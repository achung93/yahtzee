import { useState } from "react";

interface Props {
  onCreate: (name: string) => void;
  onJoin: (code: string, name: string) => void;
  busy: boolean;
  error?: string | null;
  initialCode?: string;
}

export function Home({ onCreate, onJoin, busy, error, initialCode }: Props) {
  const [mode, setMode] = useState<"create" | "join">(
    initialCode ? "join" : "create",
  );
  const [name, setName] = useState("");
  const [code, setCode] = useState(initialCode ?? "");

  const cleanName = () => name.trim() || "Player";

  const submit = () => {
    if (busy) return;
    if (mode === "create") onCreate(cleanName());
    else onJoin(code.trim().toUpperCase(), cleanName());
  };

  const canSubmit =
    name.trim().length > 0 && (mode === "create" || code.trim().length === 4);

  return (
    <div className="setup">
      <h1>Yahtzee</h1>
      <p className="subtitle">Play online with friends — anywhere</p>

      <div className="player-count mode-toggle">
        <button
          type="button"
          className={mode === "create" ? "active" : ""}
          onClick={() => setMode("create")}
        >
          Create room
        </button>
        <button
          type="button"
          className={mode === "join" ? "active" : ""}
          onClick={() => setMode("join")}
        >
          Join room
        </button>
      </div>

      <label className="field">
        <span>Your name</span>
        <input
          value={name}
          maxLength={20}
          placeholder="Your name"
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
        />
      </label>

      {mode === "join" && (
        <label className="field">
          <span>Room code</span>
          <input
            value={code}
            maxLength={4}
            placeholder="ABCD"
            className="code-input"
            onChange={(e) =>
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
            }
            onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
          />
        </label>
      )}

      {error && <div className="error">{error}</div>}

      <button className="primary" onClick={submit} disabled={busy || !canSubmit}>
        {busy
          ? "Working…"
          : mode === "create"
            ? "Create room"
            : "Join room"}
      </button>
    </div>
  );
}
