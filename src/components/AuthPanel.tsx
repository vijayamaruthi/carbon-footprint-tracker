import React from "react";
import { clearSession, setSession } from "../services/storage";
import { validateIngestionText } from "../services/validation";
import type { SessionState } from "../types";

interface Props {
  session?: SessionState;
  onChange: () => void;
}

export function AuthPanel({ session, onChange }: Props): React.ReactElement {
  const [alias, setAlias] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSignIn = React.useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      try {
        setSession(validateIngestionText(alias).slice(0, 48));
        setAlias("");
        setError("");
        onChange();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not verify this session.");
      }
    },
    [alias, onChange]
  );

  const handleSignOut = React.useCallback(() => {
    clearSession();
    onChange();
  }, [onChange]);

  return (
    <section className="panel" aria-labelledby="auth-title">
      <h2 id="auth-title">Authentication</h2>
      {session ? (
        <div className="stack">
          <p className="muted">Session verified for {session.userAlias}.</p>
          <button type="button" className="secondary-button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <form className="stack" onSubmit={handleSignIn}>
          <label htmlFor="alias">User alias</label>
          <input
            id="alias"
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            placeholder="e.g. home team"
            aria-describedby={error ? "auth-error" : undefined}
          />
          {error ? (
            <p className="error" id="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit">Verify session</button>
        </form>
      )}
    </section>
  );
}
