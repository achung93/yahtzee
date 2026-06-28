import { useState } from "react";
import { RoomState } from "../types";

interface Props {
  room: RoomState;
  mySeat: number;
  onStart: () => void;
  onLeave: () => void;
  busy: boolean;
  error?: string | null;
}

export function Lobby({ room, mySeat, onStart, onLeave, busy, error }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = mySeat === 0;
  const enough = room.players.length >= 2;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable; the code is shown anyway */
    }
  };

  return (
    <div className="setup lobby">
      <h1>Lobby</h1>
      <p className="subtitle">Share this code so friends can join</p>

      <button type="button" className="room-code" onClick={copyCode}>
        <span className="code-text">{room.code}</span>
        <span className="code-copy">{copied ? "Copied!" : "Tap to copy"}</span>
      </button>

      <div className="lobby-players">
        <div className="lobby-players-head">
          Players ({room.players.length}/5)
        </div>
        <ol>
          {room.players.map((p, i) => (
            <li key={i} className={i === mySeat ? "me" : ""}>
              <span>
                {p.name}
                {i === 0 && <span className="host-tag">Host</span>}
                {i === mySeat && <span className="you-tag">You</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {error && <div className="error">{error}</div>}

      {isHost ? (
        <button
          className="primary"
          onClick={onStart}
          disabled={busy || !enough}
        >
          {enough ? "Start game" : "Need at least 2 players"}
        </button>
      ) : (
        <div className="hint waiting">Waiting for the host to start…</div>
      )}

      <button className="link leave" onClick={onLeave} disabled={busy}>
        Leave room
      </button>
    </div>
  );
}
