import React from "react";
import type { EmissionLog } from "../types";
import { createLog, parseReceiptEmission } from "../services/emissionParser";

interface Props {
  onLog: (logs: EmissionLog[]) => void;
  onError: (message: string) => void;
}

export function ReceiptScanner({ onLog, onError }: Props): React.ReactElement {
  const [receiptText, setReceiptText] = React.useState("");

  const handleScan = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      try {
        const parsed = parseReceiptEmission(receiptText);
        onLog(parsed.map((item) => createLog(item, "receipt")));
        setReceiptText("");
      } catch (caught) {
        onError(caught instanceof Error ? caught.message : "Could not scan this receipt.");
      }
    },
    [onError, onLog, receiptText]
  );

  return (
    <section className="panel" aria-labelledby="receipt-title">
      <h2 id="receipt-title">Receipt and invoice scanning</h2>
      <form className="stack" onSubmit={handleScan}>
        <label htmlFor="receipt-text">Receipt text</label>
        <textarea
          id="receipt-text"
          value={receiptText}
          onChange={(event) => setReceiptText(event.target.value)}
          placeholder="Electricity 4 units, paper 0.5 kg, plastic 0.2 kg"
          rows={5}
        />
        <button type="submit">Map eco impact</button>
      </form>
    </section>
  );
}
