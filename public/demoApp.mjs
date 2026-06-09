import {
  CATEGORY_LABELS,
  calculateDashboardStats,
  createLog,
  decode,
  encode,
  parseReceiptEmission,
  parseVoiceEmission,
  validateIngestionText
} from "./carbonLogic.mjs";

const STORAGE_KEY = "carbon-platform-data-v1";
const SESSION_KEY = "carbon-platform-session-v1";
const categories = ["transport", "energy", "diet", "consumption"];

const state = loadData();

function formatKg(value) {
  return `${Number(value || 0).toFixed(2)} kg CO2e`;
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(decode(stored)) : { logs: [], preferredLanguage: "en" };
  } catch {
    toast("error", "Stored data could not be read, so a clean view was loaded.");
    return { logs: [], preferredLanguage: "en" };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, encode(JSON.stringify(state)));
}

function toast(tone, text) {
  const region = document.querySelector("#toasts");
  const item = document.createElement("div");
  item.className = `toast ${tone}`;
  item.role = tone === "error" ? "alert" : "status";
  item.textContent = text;
  region.prepend(item);
  setTimeout(() => item.remove(), 4200);
}

function render() {
  const stats = calculateDashboardStats(state.logs);
  document.querySelector("#language").value = state.preferredLanguage;
  document.querySelector("#log-count").textContent = `${state.logs.length} logged activities`;
  document.querySelector("#daily-total").textContent = formatKg(stats.dailyKgCO2e);
  document.querySelector("#weekly-total").textContent = formatKg(stats.weeklyKgCO2e);
  document.querySelector("#monthly-total").textContent = formatKg(stats.monthlyKgCO2e);

  const largest = Math.max(1, ...categories.map((category) => stats.categoryTotals[category]));
  document.querySelector("#chart").innerHTML = categories
    .map((category) => {
      const total = stats.categoryTotals[category];
      const width = Math.max(4, (total / largest) * 100);
      return `<div class="bar-row">
        <span>${CATEGORY_LABELS[category]}</span>
        <div class="bar-track"><div class="bar-fill ${category}" style="width:${width}%"></div></div>
        <strong>${formatKg(total)}</strong>
      </div>`;
    })
    .join("");

  document.querySelector("#logs").innerHTML =
    state.logs.length === 0
      ? `<p class="empty-state" role="status">No emissions logged yet. Add a voice entry or scan a receipt to see your footprint.</p>`
      : `<table>
          <caption>Recent emission logs</caption>
          <thead><tr><th scope="col">Activity</th><th scope="col">Category</th><th scope="col">Carbon</th><th scope="col">Confidence</th></tr></thead>
          <tbody>${state.logs
            .slice(0, 8)
            .map(
              (log) =>
                `<tr><td>${log.description}</td><td>${CATEGORY_LABELS[log.category]}</td><td>${formatKg(log.kgCO2e)}</td><td>${Math.round(log.confidence * 100)}%</td></tr>`
            )
            .join("")}</tbody>
        </table>`;
}

document.querySelector("#language").addEventListener("change", (event) => {
  state.preferredLanguage = event.target.value;
  saveData();
  toast("info", "Language preference saved.");
});

document.querySelector("#auth-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const alias = validateIngestionText(document.querySelector("#alias").value).slice(0, 48);
    sessionStorage.setItem(SESSION_KEY, encode(JSON.stringify({ userAlias: alias, verifiedAt: new Date().toISOString() })));
    document.querySelector("#auth-status").textContent = `Session verified for ${alias}.`;
    document.querySelector("#alias").value = "";
    toast("success", "Session verified.");
  } catch (error) {
    toast("error", error.message);
  }
});

document.querySelector("#voice-text").addEventListener("input", (event) => {
  try {
    const parsed = event.target.value.trim() ? parseVoiceEmission(event.target.value) : undefined;
    document.querySelector("#voice-preview").textContent = parsed
      ? `${formatKg(parsed.kgCO2e)}, ${Math.round(parsed.confidence * 100)}% confidence`
      : "Try transport, energy, diet, paper, or plastic entries.";
  } catch {
    document.querySelector("#voice-preview").textContent = "Waiting for a positive quantity and known carbon activity.";
  }
});

document.querySelector("#voice-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const parsed = parseVoiceEmission(document.querySelector("#voice-text").value);
    state.logs.unshift(createLog(parsed, "voice"));
    document.querySelector("#voice-text").value = "";
    document.querySelector("#voice-preview").textContent = "Try transport, energy, diet, paper, or plastic entries.";
    saveData();
    render();
    toast("success", "Voice emission logged.");
  } catch (error) {
    toast("error", error.message);
  }
});

document.querySelector("#receipt-form").addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const parsed = parseReceiptEmission(document.querySelector("#receipt-text").value);
    state.logs.unshift(...parsed.map((item) => createLog(item, "receipt")));
    document.querySelector("#receipt-text").value = "";
    saveData();
    render();
    toast("success", `${parsed.length} receipt impact ${parsed.length === 1 ? "entry" : "entries"} logged.`);
  } catch (error) {
    toast("error", error.message);
  }
});

try {
  const session = sessionStorage.getItem(SESSION_KEY);
  if (session) {
    const parsed = JSON.parse(decode(session));
    document.querySelector("#auth-status").textContent = `Session verified for ${parsed.userAlias}.`;
  }
} catch {
  sessionStorage.removeItem(SESSION_KEY);
}

render();
