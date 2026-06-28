export type Category =
  | "ones"
  | "twos"
  | "threes"
  | "fours"
  | "fives"
  | "sixes"
  | "threeOfAKind"
  | "fourOfAKind"
  | "fullHouse"
  | "smallStraight"
  | "largeStraight"
  | "yahtzee"
  | "chance";

export const UPPER_CATEGORIES: Category[] = [
  "ones",
  "twos",
  "threes",
  "fours",
  "fives",
  "sixes",
];

export const LOWER_CATEGORIES: Category[] = [
  "threeOfAKind",
  "fourOfAKind",
  "fullHouse",
  "smallStraight",
  "largeStraight",
  "yahtzee",
  "chance",
];

export const ALL_CATEGORIES: Category[] = [
  ...UPPER_CATEGORIES,
  ...LOWER_CATEGORIES,
];

export interface Player {
  name: string;
  connected: boolean;
  scorecard: Partial<Record<Category, number>>;
  yahtzeeBonuses: number;
}

export type RoomStatus = "lobby" | "playing" | "finished";

/**
 * The full gameplay state for a single room. Persisted (column-per-field) in the
 * DynamoDB `Game` table; reconstructed into this shape by the Lambda handler.
 */
export interface Room {
  status: RoomStatus;
  players: Player[];
  currentPlayer: number;
  round: number;
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  hasRolled: boolean;
  finished: boolean;
  winners: string[];
  lastScored: { player: number; category: Category; points: number } | null;
}
