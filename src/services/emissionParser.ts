import type { EmissionLog, ParsedEmissionInput } from "../types";
import { CARBON_FACTORS } from "./carbonFactors";
import { clampConfidence, roundKg, validateIngestionText } from "./validation";

const NUMBER_PATTERN = /(\d+(?:\.\d+)?)/;

export function createLog(input: ParsedEmissionInput, source: EmissionLog["source"]): EmissionLog {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    category: input.category,
    source,
    description: input.description,
    quantity: input.quantity,
    unit: input.unit,
    kgCO2e: roundKg(input.kgCO2e),
    confidence: clampConfidence(input.confidence)
  };
}

export function parseVoiceEmission(rawText: string): ParsedEmissionInput {
  const text = validateIngestionText(rawText).toLowerCase();
  const amount = Number(text.match(NUMBER_PATTERN)?.[1] ?? "0");
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Include a positive quantity, such as 15 km or 4 units.");
  }

  const matchedFactor = Object.values(CARBON_FACTORS).find((factor) =>
    factor.aliases.some((alias) => text.includes(alias))
  );

  if (!matchedFactor) {
    throw new Error("I could not map that activity to a carbon factor yet.");
  }

  const kgCO2e = roundKg(amount * matchedFactor.kgCO2ePerUnit);
  return {
    category: matchedFactor.category,
    description: validateIngestionText(rawText),
    quantity: amount,
    unit: matchedFactor.unit,
    kgCO2e,
    confidence: kgCO2e === 0 ? 0.2 : 0.86
  };
}

export function parseReceiptEmission(rawText: string): ParsedEmissionInput[] {
  const text = validateIngestionText(rawText).toLowerCase();
  const results: ParsedEmissionInput[] = [];

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

  if (results.length === 0) {
    throw new Error("No utility, paper, plastic, food, or travel item was detected.");
  }

  return results;
}
