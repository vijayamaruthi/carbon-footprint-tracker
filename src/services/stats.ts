import type { DashboardStats, EmissionCategory, EmissionLog } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;
const categories: EmissionCategory[] = ["transport", "energy", "diet", "consumption"];

export function calculateDashboardStats(logs: EmissionLog[], now = new Date()): DashboardStats {
  const emptyTotals = Object.fromEntries(categories.map((category) => [category, 0])) as Record<EmissionCategory, number>;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = now.getTime() - 7 * DAY_MS;
  const monthStart = now.getTime() - 30 * DAY_MS;

  return logs.reduce<DashboardStats>(
    (stats, log) => {
      const createdAt = Date.parse(log.createdAt);
      if (!Number.isFinite(createdAt)) return stats;

      stats.categoryTotals[log.category] += log.kgCO2e;
      if (createdAt >= startOfToday) stats.dailyKgCO2e += log.kgCO2e;
      if (createdAt >= weekStart) stats.weeklyKgCO2e += log.kgCO2e;
      if (createdAt >= monthStart) stats.monthlyKgCO2e += log.kgCO2e;
      return stats;
    },
    { dailyKgCO2e: 0, weeklyKgCO2e: 0, monthlyKgCO2e: 0, categoryTotals: emptyTotals }
  );
}
