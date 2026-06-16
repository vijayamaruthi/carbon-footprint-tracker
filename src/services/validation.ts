import type { EmissionCategory, EmissionLog, LanguageCode } from "../types";

const SAFE_TEXT = /^[\p{L}\p{N}\s.,:/()'-]+$/u;
const MAX_PERSISTED_LOGS = 250;
const SUPPORTED_CATEGORIES: EmissionCategory[] = ["transport", "energy", "diet", "consumption"];
const SUPPORTED_LANGUAGES: LanguageCode[] = ["en", "hi", "ta", "te", "kn"];
const SUPPORTED_SOURCES: EmissionLog["source"][] = ["voice", "receipt", "manual"];

export function sanitizeInput(value: string): string {
  return String(value ?? "").replace(/[<>`{}[\]\\]/g, " ").replace(/\s+/g, " ").trim();
}

export function validateIngestionText(value: string): string {
  const sanitized = sanitizeInput(value);
  if (!sanitized) {
    throw new Error("Add a carbon activity before logging.");
  }
  if (sanitized.length > 240) {
    throw new Error("Keep entries under 240 characters.");
  }
  if (!SAFE_TEXT.test(sanitized)) {
    throw new Error("Use letters, numbers, and basic punctuation only.");
  }
  return sanitized;
}

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function roundKg(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100) / 100;
}

export function isSupportedCategory(value: unknown): value is EmissionCategory {
  return SUPPORTED_CATEGORIES.includes(value as EmissionCategory);
}

export function normalizeLanguage(value: unknown): LanguageCode {
  return SUPPORTED_LANGUAGES.includes(value as LanguageCode) ? (value as LanguageCode) : "en";
}

export function normalizeStoredLog(value: unknown): EmissionLog | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = value as Partial<EmissionLog>;
  const createdAt = Date.parse(String(candidate.createdAt ?? ""));
  const kgCO2e = roundKg(Number(candidate.kgCO2e));
  if (!Number.isFinite(createdAt) || !isSupportedCategory(candidate.category) || kgCO2e <= 0) return undefined;
  const source: EmissionLog["source"] = SUPPORTED_SOURCES.includes(candidate.source as EmissionLog["source"])
    ? (candidate.source as EmissionLog["source"])
    : "manual";

  return {
    id: sanitizeInput(candidate.id ?? crypto.randomUUID()),
    createdAt: new Date(createdAt).toISOString(),
    category: candidate.category,
    source,
    description: sanitizeInput(candidate.description ?? "").slice(0, 160) || "Carbon activity",
    quantity: Math.max(0, Number(candidate.quantity) || 0),
    unit: sanitizeInput(candidate.unit ?? "").slice(0, 16) || "unit",
    kgCO2e,
    confidence: clampConfidence(Number(candidate.confidence))
  };
}

export function normalizeStoredLogs(value: unknown): EmissionLog[] {
  return Array.isArray(value)
    ? value.map(normalizeStoredLog).filter((log): log is EmissionLog => Boolean(log)).slice(0, MAX_PERSISTED_LOGS)
    : [];
}
