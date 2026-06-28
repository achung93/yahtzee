import { ALL_CATEGORIES, Category, Player, Room } from "./types";
import {
  grandTotal,
  isYahtzeeRoll,
  scoreCategory,
  validateCategoryChoice,
} from "./scoring";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;
const TOTAL_ROUNDS = 13;

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function emptyPlayer(name: string): Player {
  return { name, connected: true, scorecard: {}, yahtzeeBonuses: 0 };
}

/** A fresh room in the lobby with the host seated at index 0. */
export function createRoomState(hostName: string): Room {
  return {
    status: "lobby",
    players: [emptyPlayer(hostName)],
    currentPlayer: 0,
    round: 1,
    dice: [1, 1, 1, 1, 1],
    held: [false, false, false, false, false],
    rollsLeft: 3,
    hasRolled: false,
    finished: false,
    winners: [],
    lastScored: null,
  };
}

/** Seat a new player in a lobby. Returns the new seat index. */
export function addPlayer(room: Room, name: string): number {
  if (room.status !== "lobby") throw new Error("Game has already started.");
  if (room.players.length >= MAX_PLAYERS) {
    throw new Error("Room is full (max 5 players).");
  }
  room.players.push(emptyPlayer(name));
  return room.players.length - 1;
}

/** Move a lobby into active play. */
export function startGame(room: Room): Room {
  if (room.status !== "lobby") throw new Error("Game has already started.");
  if (room.players.length < MIN_PLAYERS) {
    throw new Error("Need at least 2 players to start.");
  }
  room.status = "playing";
  room.currentPlayer = 0;
  room.round = 1;
  room.dice = [1, 1, 1, 1, 1];
  room.held = [false, false, false, false, false];
  room.rollsLeft = 3;
  room.hasRolled = false;
  room.lastScored = null;
  return room;
}

export function applyRoll(room: Room, keep: boolean[]): Room {
  if (room.status !== "playing") throw new Error("Game is not in progress.");
  if (room.rollsLeft <= 0) throw new Error("No rolls left this turn.");
  if (keep.length !== 5) throw new Error("`keep` must have 5 entries.");

  // On the very first roll of a turn, ignore `keep` (everything rerolls).
  const effectiveKeep = room.hasRolled
    ? keep
    : [false, false, false, false, false];

  room.dice = room.dice.map((d, i) => (effectiveKeep[i] ? d : rollDie()));
  room.held = effectiveKeep.slice();
  room.rollsLeft -= 1;
  room.hasRolled = true;
  room.lastScored = null;
  return room;
}

export function applyScore(room: Room, category: Category): Room {
  if (room.status !== "playing") throw new Error("Game is not in progress.");
  if (!ALL_CATEGORIES.includes(category)) {
    throw new Error("Unknown category.");
  }
  if (!room.hasRolled) {
    throw new Error("Roll the dice before choosing a category.");
  }

  const player = room.players[room.currentPlayer];

  const err = validateCategoryChoice(category, room.dice, player);
  if (err) throw new Error(err);

  const points = scoreCategory(category, room.dice, player);
  player.scorecard[category] = points;

  // Yahtzee bonus: only awarded if the player's yahtzee cell already holds 50.
  if (
    isYahtzeeRoll(room.dice) &&
    player.scorecard.yahtzee !== undefined &&
    player.scorecard.yahtzee >= 50 &&
    category !== "yahtzee"
  ) {
    player.yahtzeeBonuses += 1;
  }

  room.lastScored = { player: room.currentPlayer, category, points };

  // Advance turn / round.
  room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
  if (room.currentPlayer === 0) room.round += 1;

  // Check finished — 13 categories filled for everyone.
  const allDone = room.players.every(
    (p) => Object.keys(p.scorecard).length === TOTAL_ROUNDS,
  );
  if (allDone) {
    room.status = "finished";
    room.finished = true;
    const totals = room.players.map(grandTotal);
    const max = Math.max(...totals);
    room.winners = room.players
      .filter((_, i) => totals[i] === max)
      .map((p) => p.name);
  } else {
    room.dice = [1, 1, 1, 1, 1];
    room.held = [false, false, false, false, false];
    room.rollsLeft = 3;
    room.hasRolled = false;
  }

  return room;
}
