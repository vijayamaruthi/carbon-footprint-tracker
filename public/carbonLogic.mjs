export const CARBON_FACTORS = {
  petrolCarKm: { category: "transport", unit: "km", kgCO2ePerUnit: 0.192, aliases: ["petrol car", "gasoline car", "car", "drove", "drive"] },
  motorbikeKm: { category: "transport", unit: "km", kgCO2ePerUnit: 0.103, aliases: ["bike", "motorbike", "scooter", "two wheeler"] },
  busKm: { category: "transport", unit: "km", kgCO2ePerUnit: 0.089, aliases: ["bus"] },
  electricityKwh: { category: "energy", unit: "kWh", kgCO2ePerUnit: 0.71, aliases: ["electricity", "power", "unit", "units", "kwh"] },
  naturalGasUnit: { category: "energy", unit: "unit", kgCO2ePerUnit: 2.03, aliases: ["gas", "natural gas", "cylinder"] },
  vegetarianMeal: { category: "diet", unit: "meal", kgCO2ePerUnit: 1.7, aliases: ["vegetarian meal", "veg meal", "vegetarian food"] },
  meatMeal: { category: "diet", unit: "meal", kgCO2ePerUnit: 5.4, aliases: ["meat", "chicken", "mutton", "beef", "non veg"] },
  plasticKg: { category: "consumption", unit: "kg", kgCO2ePerUnit: 6, aliases: ["plastic"] },
  paperKg: { category: "consumption", unit: "kg", kgCO2ePerUnit: 1.3, aliases: ["paper", "cardboard"] }
};

export const CATEGORY_LABELS = {
  transport: "Transport",
  energy: "Energy",
  diet: "Diet",
  consumption: "Consumption"
};

const SAFE_TEXT = /^[\p{L}\p{N}\s.,:/()'-]+$/u;
const NUMBER_PATTERN = /(\d+(?:\.\d+)?)/;
const categories = ["transport", "energy", "diet", "consumption"];

export function sanitizeInput(value) {
  return String(value ?? "").replace(/[<>`{}[\]\\]/g, " ").replace(/\s+/g, " ").trim();
}

export function validateIngestionText(value) {
  const sanitized = sanitizeInput(value);
  if (!sanitized) throw new Error("Add a carbon activity before logging.");
  if (sanitized.length > 240) throw new Error("Keep entries under 240 characters.");
  if (!SAFE_TEXT.test(sanitized)) throw new Error("Use letters, numbers, and basic punctuation only.");
  return sanitized;
}

export function roundKg(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100) / 100;
}

export function parseVoiceEmission(rawText) {
  const original = validateIngestionText(rawText);
  const text = original.toLowerCase();
  const amount = Number(text.match(NUMBER_PATTERN)?.[1] ?? "0");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Include a positive quantity, such as 15 km or 4 units.");

  const factor = Object.values(CARBON_FACTORS).find((candidate) => candidate.aliases.some((alias) => text.includes(alias)));
  if (!factor) throw new Error("I could not map that activity to a carbon factor yet.");

  const kgCO2e = roundKg(amount * factor.kgCO2ePerUnit);
  return {
    category: factor.category,
    description: original,
    quantity: amount,
    unit: factor.unit,
    kgCO2e,
    confidence: kgCO2e === 0 ? 0.2 : 0.86
  };
}

export function parseReceiptEmission(rawText) {
  const text = validateIngestionText(rawText).toLowerCase();
  const results = [];

  for (const factor of Object.values(CARBON_FACTORS)) {
    const alias = factor.aliases.find((candidate) => text.includes(candidate));
    if (!alias) continue;

    const aliasIndex = text.indexOf(alias);
    const afterAlias = text.slice(aliasIndex, aliasIndex + 48);
    const beforeAlias = text.slice(Math.max(0, aliasIndex - 16), aliasIndex);
    const amount = Number(afterAlias.match(NUMBER_PATTERN)?.[1] ?? beforeAlias.match(NUMBER_PATTERN)?.[1] ?? "1");
    if (Number.isFinite(amount) && amount > 0) {
      results.push({
        category: factor.category,
        description: `${alias} found in receipt`,
        quantity: amount,
        unit: factor.unit,
        kgCO2e: roundKg(amount * factor.kgCO2ePerUnit),
        confidence: alias === "unit" || alias === "units" ? 0.72 : 0.78
      });
    }
  }

  if (results.length === 0) throw new Error("No utility, paper, plastic, food, or travel item was detected.");
  return results;
}

export function createLog(input, source) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    category: input.category,
    source,
    description: input.description,
    quantity: input.quantity,
    unit: input.unit,
    kgCO2e: roundKg(input.kgCO2e),
    confidence: Math.min(1, Math.max(0, Number(input.confidence) || 0))
  };
}

export function calculateDashboardStats(logs, now = new Date()) {
  const totals = Object.fromEntries(categories.map((category) => [category, 0]));
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const week = now.getTime() - 7 * dayMs;
  const month = now.getTime() - 30 * dayMs;

  return logs.reduce(
    (stats, log) => {
      const createdAt = Date.parse(log.createdAt);
      if (!Number.isFinite(createdAt)) return stats;
      stats.categoryTotals[log.category] += log.kgCO2e;
      if (createdAt >= today) stats.dailyKgCO2e += log.kgCO2e;
      if (createdAt >= week) stats.weeklyKgCO2e += log.kgCO2e;
      if (createdAt >= month) stats.monthlyKgCO2e += log.kgCO2e;
      return stats;
    },
    { dailyKgCO2e: 0, weeklyKgCO2e: 0, monthlyKgCO2e: 0, categoryTotals: totals }
  );
}

export function encode(value) {
  const bytes = new TextEncoder().encode(value);
  const key = globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint8Array(12)) : Uint8Array.from({ length: 12 }, (_, index) => (index * 17 + 31) % 255);
  const masked = bytes.map((byte, index) => byte ^ key[index % key.length]);
  return `${btoa(String.fromCharCode(...key))}.${btoa(String.fromCharCode(...masked))}`;
}

export function decode(value) {
  const [keyRaw, payloadRaw] = String(value ?? "").split(".");
  if (!keyRaw || !payloadRaw) return "";
  const key = Uint8Array.from(atob(keyRaw), (char) => char.charCodeAt(0));
  const payload = Uint8Array.from(atob(payloadRaw), (char) => char.charCodeAt(0));
  const unmasked = payload.map((byte, index) => byte ^ key[index % key.length]);
  return new TextDecoder().decode(unmasked);
}
