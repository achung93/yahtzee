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

export const CATEGORY_LABELS: Record<Category, string> = {
  ones: "Ones",
  twos: "Twos",
  threes: "Threes",
  fours: "Fours",
  fives: "Fives",
  sixes: "Sixes",
  threeOfAKind: "Three of a Kind",
  fourOfAKind: "Four of a Kind",
  fullHouse: "Full House",
  smallStraight: "Small Straight",
  largeStraight: "Large Straight",
  yahtzee: "Yahtzee",
  chance: "Chance",
};

export interface Player {
  name: string;
  connected: boolean;
  scorecard: Partial<Record<Category, number>>;
  yahtzeeBonuses: number;
}

export interface Totals {
  upper: number;
  upperBonus: number;
  lower: number;
  yahtzeeBonus: number;
  grand: number;
}

export type RoomStatus = "lobby" | "playing" | "finished";

/**
 * The room state as the UI sees it — a normalized view of the AppSync `Game`
 * record (see client.ts `toRoomState`). Totals are computed client-side from
 * each player's scorecard (see scoring.ts); the backend stays the source of
 * truth for the scorecards themselves.
 */
export interface RoomState {
  id: string;
  code: string;
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
