import React from "react";
import type { EmissionLog } from "../types";
import { createLog, parseVoiceEmission } from "../services/emissionParser";

interface Props {
  onLog: (logs: EmissionLog[]) => void;
  onError: (message: string) => void;
}

export function VoiceRecorder({ onLog, onError }: Props): React.ReactElement {
  const [transcript, setTranscript] = React.useState("");

  const parsedPreview = React.useMemo(() => {
    try {
      return transcript.trim() ? parseVoiceEmission(transcript) : undefined;
    } catch {
      return undefined;
    }
  }, [transcript]);

  const handleSubmit = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      try {
        const parsed = parseVoiceEmission(transcript);
        onLog([createLog(parsed, "voice")]);
        setTranscript("");
      } catch (caught) {
        onError(caught instanceof Error ? caught.message : "Could not parse that voice entry.");
      }
    },
    [onError, onLog, transcript]
  );

  return (
    <section className="panel" aria-labelledby="voice-title">
      <h2 id="voice-title">Voice logging</h2>
      <form className="stack" onSubmit={handleSubmit}>
        <label htmlFor="voice-text">Carbon activity transcript</label>
        <textarea
          id="voice-text"
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="I drove 15 kilometers in a petrol car"
          rows={4}
        />
        <p className="hint" aria-live="polite">
          {parsedPreview ? `${parsedPreview.kgCO2e} kg CO2e, ${parsedPreview.confidence * 100}% confidence` : "Try transport, energy, diet, paper, or plastic entries."}
        </p>
        <button type="submit">Log voice entry</button>
      </form>
    </section>
  );
}
