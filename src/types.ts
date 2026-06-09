export type EmissionCategory = "transport" | "energy" | "diet" | "consumption";

export type EmissionSource = "voice" | "receipt" | "manual";

export interface EmissionLog {
  id: string;
  createdAt: string;
  category: EmissionCategory;
  source: EmissionSource;
  description: string;
  quantity: number;
  unit: string;
  kgCO2e: number;
  confidence: number;
}

export interface EmissionData {
  logs: EmissionLog[];
  preferredLanguage: LanguageCode;
  session?: SessionState;
}

export interface SessionState {
  userAlias: string;
  verifiedAt: string;
}

export type LanguageCode = "en" | "hi" | "ta" | "te" | "kn";

export interface ParsedEmissionInput {
  category: EmissionCategory;
  description: string;
  quantity: number;
  unit: string;
  kgCO2e: number;
  confidence: number;
}

export interface DashboardStats {
  dailyKgCO2e: number;
  weeklyKgCO2e: number;
  monthlyKgCO2e: number;
  categoryTotals: Record<EmissionCategory, number>;
}

export interface ToastMessage {
  id: string;
  tone: "success" | "error" | "info";
  text: string;
}
