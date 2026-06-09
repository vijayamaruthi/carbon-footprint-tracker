const SAFE_TEXT = /^[\p{L}\p{N}\s.,:/()'-]+$/u;

export function sanitizeInput(value: string): string {
  return value.replace(/[<>`{}[\]\\]/g, " ").replace(/\s+/g, " ").trim();
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
