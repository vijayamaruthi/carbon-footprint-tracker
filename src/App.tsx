import React from "react";
import { AuthPanel } from "./components/AuthPanel";
import { Dashboard } from "./components/Dashboard";
import { LanguageSelection } from "./components/LanguageSelection";
import { ReceiptScanner } from "./components/ReceiptScanner";
import { ToastRegion } from "./components/ToastRegion";
import { VoiceRecorder } from "./components/VoiceRecorder";
import { calculateDashboardStats } from "./services/stats";
import { getSession, loadEmissionData, saveEmissionData, saveLanguage } from "./services/storage";
import type { EmissionData, EmissionLog, ToastMessage } from "./types";
import "./styles/app.css";

export default function App(): React.ReactElement {
  const [data, setData] = React.useState<EmissionData>(() => ({ ...loadEmissionData(), session: getSession() }));
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const stats = React.useMemo(() => calculateDashboardStats(data.logs), [data.logs]);

  const pushToast = React.useCallback((tone: ToastMessage["tone"], text: string) => {
    const toast = { id: crypto.randomUUID(), tone, text };
    setToasts((items) => [toast, ...items].slice(0, 3));
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== toast.id));
    }, 4200);
  }, []);

  const persistLogs = React.useCallback(
    (logs: EmissionLog[]) => {
      try {
        const next = { ...data, logs: [...logs, ...data.logs] };
        saveEmissionData(next);
        setData(next);
        pushToast("success", `${logs.length} emission ${logs.length === 1 ? "entry" : "entries"} logged.`);
      } catch {
        pushToast("error", "Could not save this entry. Please try again.");
      }
    },
    [data, pushToast]
  );

  const handleLanguageChange = React.useCallback((preferredLanguage: EmissionData["preferredLanguage"]) => {
    setData((current) => ({ ...saveLanguage(preferredLanguage), session: current.session }));
  }, []);

  const handleSessionChange = React.useCallback(() => {
    setData((current) => ({ ...current, session: getSession() }));
  }, []);

  return (
    <main className="app-shell" aria-labelledby="page-title">
      <header className="topbar">
        <div>
          <p className="eyebrow">Carbon Footprint Awareness Platform</p>
          <h1 id="page-title">Daily greenhouse gas tracker</h1>
        </div>
        <LanguageSelection value={data.preferredLanguage} onChange={handleLanguageChange} />
      </header>

      <section className="workspace" aria-label="Carbon tracking workspace">
        <div className="left-rail">
          <AuthPanel session={data.session} onChange={handleSessionChange} />
          <VoiceRecorder onLog={persistLogs} onError={(message) => pushToast("error", message)} />
          <ReceiptScanner onLog={persistLogs} onError={(message) => pushToast("error", message)} />
        </div>
        <Dashboard logs={data.logs} stats={stats} />
      </section>

      <ToastRegion toasts={toasts} />
    </main>
  );
}
