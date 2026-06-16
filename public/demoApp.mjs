import {
  CATEGORIES,
  CATEGORY_LABELS,
  calculateDashboardStats,
  createLog,
  decode,
  encode,
  normalizeEmissionData,
  parseReceiptEmission,
  parseVoiceEmission,
  validateIngestionText
} from "./carbonLogic.mjs";

const STORAGE_KEY = "carbon-platform-data-v1";
const SESSION_KEY = "carbon-platform-session-v1";

const state = loadData();

function formatKg(value) {
  return `${Number(value || 0).toFixed(2)} kg CO2e`;
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeEmissionData(JSON.parse(decode(stored))) : { logs: [], preferredLanguage: "en" };
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

function replaceChildren(target, children) {
  target.replaceChildren(...children);
}

function createTextElement(tagName, text, className) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function renderChart(stats) {
  const chart = document.querySelector("#chart");
  const largest = Math.max(1, ...CATEGORIES.map((category) => stats.categoryTotals[category]));
  const rows = CATEGORIES.map((category) => {
    const total = stats.categoryTotals[category];
    const width = Math.max(4, (total / largest) * 100);
    const row = document.createElement("div");
    row.className = "bar-row";

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = `bar-fill ${category}`;
    fill.style.width = `${width}%`;
    track.append(fill);

    row.append(createTextElement("span", CATEGORY_LABELS[category]), track, createTextElement("strong", formatKg(total)));
    return row;
  });
  replaceChildren(chart, rows);
}

function renderLogs(logs) {
  const container = document.querySelector("#logs");
  if (logs.length === 0) {
    const empty = createTextElement(
      "p",
      "No emissions logged yet. Add a voice entry or scan a receipt to see your footprint.",
      "empty-state"
    );
    empty.role = "status";
    container.replaceChildren(empty);
    return;
  }

  const table = document.createElement("table");
  table.append(createTextElement("caption", "Recent emission logs"));

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Activity", "Category", "Carbon", "Confidence"].forEach((heading) => {
    const th = createTextElement("th", heading);
    th.scope = "col";
    headerRow.append(th);
  });
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  logs.slice(0, 8).forEach((log) => {
    const row = document.createElement("tr");
    row.append(
      createTextElement("td", log.description),
      createTextElement("td", CATEGORY_LABELS[log.category]),
      createTextElement("td", formatKg(log.kgCO2e)),
      createTextElement("td", `${Math.round(log.confidence * 100)}%`)
    );
    tbody.append(row);
  });

  table.append(thead, tbody);
  container.replaceChildren(table);
}

function render() {
  const stats = calculateDashboardStats(state.logs);
  document.querySelector("#language").value = state.preferredLanguage;
  document.querySelector("#log-count").textContent = `${state.logs.length} logged activities`;
  document.querySelector("#daily-total").textContent = formatKg(stats.dailyKgCO2e);
  document.querySelector("#weekly-total").textContent = formatKg(stats.weeklyKgCO2e);
  document.querySelector("#monthly-total").textContent = formatKg(stats.monthlyKgCO2e);

  renderChart(stats);
  renderLogs(state.logs);
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
