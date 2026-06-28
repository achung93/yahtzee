import {
  Category,
  Player,
  Totals,
  UPPER_CATEGORIES,
  LOWER_CATEGORIES,
} from "./types";

function counts(dice: number[]): Record<number, number> {
  const c: Record<number, number> = {};
  for (const d of dice) c[d] = (c[d] || 0) + 1;
  return c;
}

function isYahtzeeRoll(dice: number[]) {
  return dice.length === 5 && dice.every((d) => d === dice[0]);
}

function isStraight(dice: number[], length: 4 | 5): boolean {
  const unique = [...new Set(dice)].sort((a, b) => a - b);
  if (unique.length < length) return false;
  for (let s = 0; s + length <= unique.length; s++) {
    let ok = true;
    for (let i = 1; i < length; i++) {
      if (unique[s + i] !== unique[s] + i) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Mirror of backend scoring; used to preview points before the player commits
 * to a category. Backend is the source of truth — this is for UI hints only.
 */
export function previewScore(
  category: Category,
  dice: number[],
  player: Player,
): number {
  const c = counts(dice);
  const sum = dice.reduce((a, b) => a + b, 0);
  const yahtzee = isYahtzeeRoll(dice);
  const joker =
    yahtzee &&
    player.scorecard.yahtzee !== undefined &&
    player.scorecard.yahtzee > 0;

  switch (category) {
    case "ones":
      return (c[1] || 0);
    case "twos":
      return (c[2] || 0) * 2;
    case "threes":
      return (c[3] || 0) * 3;
    case "fours":
      return (c[4] || 0) * 4;
    case "fives":
      return (c[5] || 0) * 5;
    case "sixes":
      return (c[6] || 0) * 6;
    case "threeOfAKind":
      return Object.values(c).some((n) => n >= 3) ? sum : 0;
    case "fourOfAKind":
      return Object.values(c).some((n) => n >= 4) ? sum : 0;
    case "fullHouse": {
      if (joker) return 25;
      const vals = Object.values(c).sort();
      return vals.length === 2 && vals[0] === 2 && vals[1] === 3 ? 25 : 0;
    }
    case "smallStraight":
      if (joker) return 30;
      return isStraight(dice, 4) ? 30 : 0;
    case "largeStraight":
      if (joker) return 40;
      return isStraight(dice, 5) ? 40 : 0;
    case "yahtzee":
      return yahtzee ? 50 : 0;
    case "chance":
      return sum;
  }
}

/**
 * Compute a player's running totals from their scorecard. Mirrors the backend
 * grand-total logic (upper bonus at ≥63, +100 per bonus Yahtzee) — used for
 * the live scorecard footer and final rankings.
 */
export function computeTotals(player: Player): Totals {
  const upper = UPPER_CATEGORIES.reduce(
    (s, c) => s + (player.scorecard[c] ?? 0),
    0,
  );
  const upperBonus = upper >= 63 ? 35 : 0;
  const lower = LOWER_CATEGORIES.reduce(
    (s, c) => s + (player.scorecard[c] ?? 0),
    0,
  );
  const yahtzeeBonus = player.yahtzeeBonuses * 100;
  return {
    upper,
    upperBonus,
    lower,
    yahtzeeBonus,
    grand: upper + upperBonus + lower + yahtzeeBonus,
  };
}
