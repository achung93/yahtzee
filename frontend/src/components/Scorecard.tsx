import {
  CATEGORY_LABELS,
  Category,
  RoomState,
  LOWER_CATEGORIES,
  UPPER_CATEGORIES,
} from "../types";
import { previewScore, computeTotals } from "../scoring";

interface Props {
  room: RoomState;
  mySeat: number;
  onSelect: (category: Category) => void;
}

const CATEGORY_HINT: Record<Category, string> = {
  ones: "Sum of 1s",
  twos: "Sum of 2s",
  threes: "Sum of 3s",
  fours: "Sum of 4s",
  fives: "Sum of 5s",
  sixes: "Sum of 6s",
  threeOfAKind: "≥3 same → sum",
  fourOfAKind: "≥4 same → sum",
  fullHouse: "3+2 → 25",
  smallStraight: "4 in a row → 30",
  largeStraight: "5 in a row → 40",
  yahtzee: "5 same → 50",
  chance: "Sum of all",
};

export function Scorecard({ room, mySeat, onSelect }: Props) {
  const totals = room.players.map(computeTotals);
  // The active player may pick a category for their own column after rolling.
  const myTurn = room.currentPlayer === mySeat && !room.finished;

  const renderRow = (cat: Category) => (
    <tr key={cat}>
      <td className="cat-name">
        <div>{CATEGORY_LABELS[cat]}</div>
        <div className="cat-hint">{CATEGORY_HINT[cat]}</div>
      </td>
      {room.players.map((p, i) => {
        const recorded = p.scorecard[cat];
        const isFilled = recorded !== undefined;
        const isCurrent = i === room.currentPlayer;
        // Everyone sees a live preview in the active player's open cells.
        const showPreview =
          !isFilled && isCurrent && room.hasRolled && !room.finished;
        const preview = showPreview ? previewScore(cat, room.dice, p) : null;
        const clickable = showPreview && myTurn && i === mySeat;

        const classes = [];
        if (isCurrent) classes.push("current");
        if (isFilled) classes.push("filled");
        if (clickable) classes.push("clickable");

        return (
          <td
            key={i}
            className={classes.join(" ")}
            onClick={() => clickable && onSelect(cat)}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (clickable && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(cat);
              }
            }}
          >
            {isFilled ? (
              <span className="score">{recorded}</span>
            ) : preview !== null ? (
              <span className="preview">{preview}</span>
            ) : (
              ""
            )}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="scorecard-wrap">
      <table className="scorecard">
        <thead>
          <tr>
            <th></th>
            {room.players.map((p, i) => (
              <th
                key={i}
                className={i === room.currentPlayer ? "current" : ""}
              >
                {p.name}
                {i === mySeat && <span className="you-tag">You</span>}
                {i === room.currentPlayer && !room.finished && (
                  <span className="turn-marker">●</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="section-row">
            <td colSpan={room.players.length + 1}>Upper Section</td>
          </tr>
          {UPPER_CATEGORIES.map(renderRow)}
          <tr className="totals-row">
            <td>Upper Subtotal</td>
            {totals.map((t, i) => (
              <td key={i}>{t.upper}</td>
            ))}
          </tr>
          <tr className="totals-row">
            <td>Upper Bonus (≥63 → 35)</td>
            {totals.map((t, i) => (
              <td key={i}>{t.upperBonus}</td>
            ))}
          </tr>

          <tr className="section-row">
            <td colSpan={room.players.length + 1}>Lower Section</td>
          </tr>
          {LOWER_CATEGORIES.map(renderRow)}
          <tr className="totals-row">
            <td>Yahtzee Bonus (×100)</td>
            {room.players.map((p, i) => (
              <td key={i}>
                {p.yahtzeeBonuses > 0
                  ? `${p.yahtzeeBonuses} × 100 = ${p.yahtzeeBonuses * 100}`
                  : 0}
              </td>
            ))}
          </tr>
          <tr className="totals-row grand">
            <td>Grand Total</td>
            {totals.map((t, i) => (
              <td key={i}>{t.grand}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
