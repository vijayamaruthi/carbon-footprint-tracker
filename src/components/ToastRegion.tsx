import React from "react";
import type { ToastMessage } from "../types";

interface Props {
  toasts: ToastMessage[];
}

export function ToastRegion({ toasts }: Props): React.ReactElement {
  return (
    <aside className="toast-region" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`toast ${toast.tone}`} key={toast.id} role={toast.tone === "error" ? "alert" : "status"}>
          {toast.text}
        </div>
      ))}
    </aside>
  );
}
