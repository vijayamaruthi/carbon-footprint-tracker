import type { EmissionData, EmissionLog, LanguageCode, SessionState } from "../types";
import { normalizeLanguage, normalizeStoredLogs } from "./validation";

const STORAGE_KEY = "carbon-platform-data-v1";
const SESSION_KEY = "carbon-platform-session-v1";

const initialData: EmissionData = {
  logs: [],
  preferredLanguage: "en"
};

function encode(value: string): string {
  const key = crypto.getRandomValues(new Uint8Array(12));
  const payload = new TextEncoder().encode(value);
  const masked = payload.map((byte, index) => byte ^ key[index % key.length]);
  return `${btoa(String.fromCharCode(...key))}.${btoa(String.fromCharCode(...masked))}`;
}

function decode(value: string): string {
  try {
    const [keyRaw, payloadRaw] = value.split(".");
    if (!keyRaw || !payloadRaw) return "";
    const key = Uint8Array.from(atob(keyRaw), (char) => char.charCodeAt(0));
    const payload = Uint8Array.from(atob(payloadRaw), (char) => char.charCodeAt(0));
    if (key.length === 0 || payload.length === 0) return "";
    const unmasked = payload.map((byte, index) => byte ^ key[index % key.length]);
    return new TextDecoder().decode(unmasked);
  } catch {
    return "";
  }
}

export function loadEmissionData(): EmissionData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialData;
    const parsed = JSON.parse(decode(stored)) as EmissionData;
    return {
      logs: normalizeStoredLogs(parsed.logs),
      preferredLanguage: normalizeLanguage(parsed.preferredLanguage)
    };
  } catch {
    return initialData;
  }
}

export function saveEmissionData(data: EmissionData): void {
  localStorage.setItem(
    STORAGE_KEY,
    encode(JSON.stringify({ logs: normalizeStoredLogs(data.logs), preferredLanguage: normalizeLanguage(data.preferredLanguage) }))
  );
}

export function addEmissionLogs(logs: EmissionLog[]): EmissionData {
  const data = loadEmissionData();
  const next = { ...data, logs: [...logs, ...data.logs] };
  saveEmissionData(next);
  return next;
}

export function saveLanguage(preferredLanguage: LanguageCode): EmissionData {
  const data = loadEmissionData();
  const next = { ...data, preferredLanguage };
  saveEmissionData(next);
  return next;
}

export function setSession(alias: string): SessionState {
  const session: SessionState = { userAlias: alias, verifiedAt: new Date().toISOString() };
  sessionStorage.setItem(SESSION_KEY, encode(JSON.stringify(session)));
  return session;
}

export function getSession(): SessionState | undefined {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? (JSON.parse(decode(stored)) as SessionState) : undefined;
  } catch {
    return undefined;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
