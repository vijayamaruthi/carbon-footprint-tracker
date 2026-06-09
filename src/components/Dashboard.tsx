import React from "react";
import { CATEGORY_LABELS } from "../services/carbonFactors";
import type { DashboardStats, EmissionCategory, EmissionLog } from "../types";

const categoryOrder: EmissionCategory[] = ["transport", "energy", "diet", "consumption"];

interface Props {
  logs: EmissionLog[];
  stats: DashboardStats;
}

function formatKg(value: number): string {
  return `${value.toFixed(2)} kg CO2e`;
}

export function Dashboard({ logs, stats }: Props): React.ReactElement {
  const largestCategory = React.useMemo(
    () => Math.max(1, ...categoryOrder.map((category) => stats.categoryTotals[category])),
    [stats.categoryTotals]
  );

  return (
    <section className="dashboard" aria-labelledby="dashboard-title">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Summary dashboard</p>
          <h2 id="dashboard-title">Carbon totals</h2>
        </div>
        <p className="muted">{logs.length} logged activities</p>
      </div>

      <div className="metric-grid" aria-label="Carbon emission totals">
        <article>
          <span>Today</span>
          <strong>{formatKg(stats.dailyKgCO2e)}</strong>
        </article>
        <article>
          <span>7 days</span>
          <strong>{formatKg(stats.weeklyKgCO2e)}</strong>
        </article>
        <article>
          <span>30 days</span>
          <strong>{formatKg(stats.monthlyKgCO2e)}</strong>
        </article>
      </div>

      <div className="chart" role="img" aria-label="Emission breakdown by category">
        {categoryOrder.map((category) => {
          const total = stats.categoryTotals[category];
          const width = `${Math.max(4, (total / largestCategory) * 100)}%`;
          return (
            <div className="bar-row" key={category}>
              <span>{CATEGORY_LABELS[category]}</span>
              <div className="bar-track">
                <div className={`bar-fill ${category}`} style={{ width }} />
              </div>
              <strong>{formatKg(total)}</strong>
            </div>
          );
        })}
      </div>

      {logs.length === 0 ? (
        <p className="empty-state" role="status">
          No emissions logged yet. Add a voice entry or scan a receipt to see your footprint.
        </p>
      ) : (
        <table>
          <caption>Recent emission logs</caption>
          <thead>
            <tr>
              <th scope="col">Activity</th>
              <th scope="col">Category</th>
              <th scope="col">Carbon</th>
              <th scope="col">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 8).map((log) => (
              <tr key={log.id}>
                <td>{log.description}</td>
                <td>{CATEGORY_LABELS[log.category]}</td>
                <td>{formatKg(log.kgCO2e)}</td>
                <td>{Math.round(log.confidence * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
