import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

/** "How to Play" rules panel. Opened from the Home screen and in-game header. */
export function HowToPlay({ onClose }: Props) {
  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="How to play"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2>How to Play</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="modal-body">
          <p className="modal-lead">
            Yahtzee is a dice game for 2–5 players. Over 13 rounds you fill in a
            scorecard — the highest grand total wins.
          </p>

          <h3>Getting started</h3>
          <ol className="howto-steps">
            <li>
              <strong>Create a room</strong> and share the 4-letter code, or{" "}
              <strong>join</strong> a friend's room with their code.
            </li>
            <li>
              When everyone's in the lobby, the host taps <strong>Start</strong>{" "}
              (2–5 players).
            </li>
          </ol>

          <h3>On your turn</h3>
          <ol className="howto-steps">
            <li>
              <strong>Roll</strong> all five dice — you get up to{" "}
              <strong>3 rolls</strong> per turn.
            </li>
            <li>
              After a roll, <strong>click dice to hold</strong> them; held dice
              stay put while you reroll the rest.
            </li>
            <li>
              When you're happy (or out of rolls), <strong>click a category</strong>{" "}
              in your column to score it. A live preview shows what each category
              is worth.
            </li>
          </ol>

          <h3>Scoring</h3>
          <div className="howto-cats">
            <div>
              <h4>Upper section</h4>
              <ul>
                <li>Ones–Sixes — sum of those dice</li>
                <li>
                  <strong>Bonus +35</strong> if the upper section totals 63 or
                  more
                </li>
              </ul>
            </div>
            <div>
              <h4>Lower section</h4>
              <ul>
                <li>3 / 4 of a Kind — sum of all dice</li>
                <li>Full House (3+2) — 25</li>
                <li>Small / Large Straight — 30 / 40</li>
                <li>
                  <strong>Yahtzee</strong> (5 alike) — 50
                </li>
                <li>Chance — sum of all dice</li>
              </ul>
            </div>
          </div>

          <h3>Bonus Yahtzees & the Joker</h3>
          <p>
            Roll another Yahtzee after already scoring 50 there? Each extra one
            is worth <strong>+100</strong>. If your matching upper box is taken,
            the <em>Joker rule</em> lets you score it in a lower category (Full
            House, Straights count at full value).
          </p>
          <p className="modal-note">
            Every category must be filled exactly once — sometimes the best move
            is taking a zero. After all 13 are full for everyone, highest total
            wins.
          </p>
        </div>

        <button className="primary modal-done" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
