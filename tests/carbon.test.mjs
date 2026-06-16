import assert from "node:assert/strict";
import {
  calculateDashboardStats,
  decode,
  encode,
  normalizeEmissionData,
  parseReceiptEmission,
  parseVoiceEmission,
  validateIngestionText
} from "../public/carbonLogic.mjs";

const driven = parseVoiceEmission("I drove 15 kilometers in a petrol car");
assert.equal(driven.category, "transport");
assert.equal(driven.kgCO2e, 2.88);
assert.equal(driven.unit, "km");

const electricity = parseVoiceEmission("Used 4 units of electricity today");
assert.equal(electricity.category, "energy");
assert.equal(electricity.kgCO2e, 2.84);

const receipt = parseReceiptEmission("Electricity 4 units, paper 0.5 kg, plastic 0.2 kg");
assert.equal(receipt.length >= 3, true);
assert.equal(receipt.some((item) => item.category === "consumption" && item.description.includes("paper")), true);
assert.equal(receipt.some((item) => item.category === "energy"), true);
assert.equal(receipt.reduce((total, item) => Math.round((total + item.kgCO2e) * 100) / 100, 0), 4.69);

assert.throws(() => parseVoiceEmission(""), /carbon activity/);
assert.throws(() => parseVoiceEmission("I drove 0 kilometers in a petrol car"), /positive quantity/);
assert.equal(validateIngestionText("<script>alert(1)</script>"), "script alert(1) /script");

const now = new Date("2026-06-09T10:00:00.000Z");
const stats = calculateDashboardStats(
  [
    { createdAt: "2026-06-09T09:00:00.000Z", category: "transport", kgCO2e: 2.88 },
    { createdAt: "2026-06-02T11:00:00.000Z", category: "energy", kgCO2e: 2.84 },
    { createdAt: "2026-05-01T09:00:00.000Z", category: "diet", kgCO2e: 5.4 },
    { createdAt: "not-a-date", category: "diet", kgCO2e: 99 }
  ],
  now
);
assert.equal(stats.dailyKgCO2e, 2.88);
assert.equal(stats.weeklyKgCO2e, 5.72);
assert.equal(stats.monthlyKgCO2e, 5.72);
assert.equal(stats.categoryTotals.diet, 5.4);

const encoded = encode("session-token");
assert.notEqual(encoded, "session-token");
assert.equal(decode(encoded), "session-token");
assert.equal(decode("not-valid-base64"), "");

const normalized = normalizeEmissionData({
  preferredLanguage: "xx",
  logs: [
    {
      id: "safe",
      createdAt: "2026-06-09T09:00:00.000Z",
      category: "transport",
      source: "voice",
      description: "<img src=x onerror=alert(1)>",
      quantity: 1,
      unit: "km",
      kgCO2e: 0.192,
      confidence: 2
    },
    { createdAt: "2026-06-09T09:00:00.000Z", category: "unknown", kgCO2e: 10 }
  ]
});
assert.equal(normalized.preferredLanguage, "en");
assert.equal(normalized.logs.length, 1);
assert.equal(normalized.logs[0].description.includes("<"), false);
assert.equal(normalized.logs[0].confidence, 1);

console.log("carbon.test.mjs: all tests passed");
