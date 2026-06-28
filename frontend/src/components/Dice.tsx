interface Props {
  dice: number[];
  held: boolean[];
  hasRolled: boolean;
  disabled: boolean;
  onToggle: (index: number) => void;
}

const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [
    [1, 1],
    [3, 3],
  ],
  3: [
    [1, 1],
    [2, 2],
    [3, 3],
  ],
  4: [
    [1, 1],
    [1, 3],
    [3, 1],
    [3, 3],
  ],
  5: [
    [1, 1],
    [1, 3],
    [2, 2],
    [3, 1],
    [3, 3],
  ],
  6: [
    [1, 1],
    [1, 3],
    [2, 1],
    [2, 3],
    [3, 1],
    [3, 3],
  ],
};

function Die({
  value,
  held,
  faded,
  onClick,
  disabled,
}: {
  value: number;
  held: boolean;
  faded: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const cls = ["die"];
  if (held) cls.push("held");
  if (faded) cls.push("faded");
  if (disabled) cls.push("disabled");
  return (
    <button
      type="button"
      className={cls.join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Die showing ${value}${held ? ", held" : ""}`}
    >
      <div className="die-face">
        {PIPS[value].map(([r, c], i) => (
          <span key={i} className={`pip pip-${r}-${c}`} />
        ))}
      </div>
    </button>
  );
}

export function Dice({ dice, held, hasRolled, disabled, onToggle }: Props) {
  return (
    <div className="dice-row">
      {dice.map((v, i) => (
        <Die
          key={i}
          value={v}
          held={hasRolled && held[i]}
          faded={!hasRolled}
          disabled={disabled}
          onClick={() => onToggle(i)}
        />
      ))}
    </div>
  );
}
