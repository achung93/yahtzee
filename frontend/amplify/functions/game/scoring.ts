import {
  Category,
  Player,
  UPPER_CATEGORIES,
  LOWER_CATEGORIES,
} from "./types";

const upperByValue: Record<number, Category> = {
  1: "ones",
  2: "twos",
  3: "threes",
  4: "fours",
  5: "fives",
  6: "sixes",
};

function countDice(dice: number[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const d of dice) counts[d] = (counts[d] || 0) + 1;
  return counts;
}

export function isYahtzeeRoll(dice: number[]): boolean {
  return dice.length === 5 && dice.every((d) => d === dice[0]);
}

function isStraight(dice: number[], length: 4 | 5): boolean {
  const unique = [...new Set(dice)].sort((a, b) => a - b);
  if (unique.length < length) return false;
  for (let start = 0; start + length <= unique.length; start++) {
    let ok = true;
    for (let i = 1; i < length; i++) {
      if (unique[start + i] !== unique[start] + i) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Score a category for the given dice. Applies the Yahtzee Joker rule:
 * when the player already has a 50 in the yahtzee category and rolls another
 * yahtzee, the lower-section categories (full house / straights) award their
 * full value as a "joker".
 */
export function scoreCategory(
  category: Category,
  dice: number[],
  player: Player,
): number {
  const counts = countDice(dice);
  const sum = dice.reduce((a, b) => a + b, 0);
  const yahtzee = isYahtzeeRoll(dice);
  const jokerActive =
    yahtzee &&
    player.scorecard.yahtzee !== undefined &&
    player.scorecard.yahtzee > 0;

  switch (category) {
    case "ones":
      return (counts[1] || 0) * 1;
    case "twos":
      return (counts[2] || 0) * 2;
    case "threes":
      return (counts[3] || 0) * 3;
    case "fours":
      return (counts[4] || 0) * 4;
    case "fives":
      return (counts[5] || 0) * 5;
    case "sixes":
      return (counts[6] || 0) * 6;
    case "threeOfAKind":
      return Object.values(counts).some((c) => c >= 3) ? sum : 0;
    case "fourOfAKind":
      return Object.values(counts).some((c) => c >= 4) ? sum : 0;
    case "fullHouse": {
      if (jokerActive) return 25;
      const vals = Object.values(counts).sort();
      return vals.length === 2 && vals[0] === 2 && vals[1] === 3 ? 25 : 0;
    }
    case "smallStraight":
      if (jokerActive) return 30;
      return isStraight(dice, 4) ? 30 : 0;
    case "largeStraight":
      if (jokerActive) return 40;
      return isStraight(dice, 5) ? 40 : 0;
    case "yahtzee":
      return yahtzee ? 50 : 0;
    case "chance":
      return sum;
  }
}

/**
 * Validate that the chosen category is legal given the Yahtzee joker rules.
 * Returns null if legal, otherwise an error message.
 */
export function validateCategoryChoice(
  category: Category,
  dice: number[],
  player: Player,
): string | null {
  if (player.scorecard[category] !== undefined) {
    return "Category already used.";
  }
  if (!isYahtzeeRoll(dice)) return null;

  // Bonus yahtzee scenario (yahtzee already filled with 50)
  const yahtzeeCell = player.scorecard.yahtzee;
  if (yahtzeeCell === undefined || yahtzeeCell === 0) return null;

  const value = dice[0];
  const matchingUpper = upperByValue[value];

  // If matching upper is open, player MUST score there.
  if (player.scorecard[matchingUpper] === undefined) {
    if (category !== matchingUpper) {
      return `Joker rule: must score in ${matchingUpper} (upper section is still open).`;
    }
    return null;
  }

  // Otherwise prefer lower section; any open lower category is legal.
  const openLower = LOWER_CATEGORIES.filter(
    (c) => player.scorecard[c] === undefined,
  );
  if (openLower.length > 0) {
    if (!openLower.includes(category)) {
      return "Joker rule: must score in an open lower-section category.";
    }
    return null;
  }

  // All lower filled — player may take a zero in any open upper category.
  const openUpper = UPPER_CATEGORIES.filter(
    (c) => player.scorecard[c] === undefined,
  );
  if (!openUpper.includes(category)) {
    return "Joker rule: must take a zero in an open upper-section category.";
  }
  return null;
}

export function upperTotal(player: Player): number {
  return UPPER_CATEGORIES.reduce(
    (sum, c) => sum + (player.scorecard[c] ?? 0),
    0,
  );
}

export function upperBonus(player: Player): number {
  return upperTotal(player) >= 63 ? 35 : 0;
}

export function lowerTotal(player: Player): number {
  return LOWER_CATEGORIES.reduce(
    (sum, c) => sum + (player.scorecard[c] ?? 0),
    0,
  );
}

export function yahtzeeBonusPoints(player: Player): number {
  return player.yahtzeeBonuses * 100;
}

export function grandTotal(player: Player): number {
  return (
    upperTotal(player) +
    upperBonus(player) +
    lowerTotal(player) +
    yahtzeeBonusPoints(player)
  );
}
