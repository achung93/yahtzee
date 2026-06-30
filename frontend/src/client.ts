import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";
import type { Category, Player, RoomState } from "./types";

const client = generateClient<Schema>();

/** Identifies a seat the player holds in a room (persisted in localStorage). */
export interface Seat {
  gameId: string;
  code: string;
  seatToken: string;
  seatIndex: number;
}

function unwrap<T>(res: {
  data: T;
  errors?: { message: string }[];
}): NonNullable<T> {
  if (res.errors?.length) {
    throw new Error(res.errors.map((e) => e.message).join(", "));
  }
  if (res.data == null) throw new Error("No data returned.");
  return res.data as NonNullable<T>;
}

function toSeat(action: {
  gameId?: string | null;
  code?: string | null;
  seatToken?: string | null;
  seatIndex?: number | null;
}): Seat {
  return {
    gameId: action.gameId ?? "",
    code: action.code ?? "",
    seatToken: action.seatToken ?? "",
    seatIndex: action.seatIndex ?? 0,
  };
}

// a.json() fields can arrive as native values or as a JSON string (the engine
// stringifies them on write — see the handler's encodeJsonFields). Decode both.
function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return v as T;
}

/** Normalize a raw DynamoDB-backed Game record into the typed UI shape. */
export function toRoomState(rec: any): RoomState {
  return {
    id: rec.id,
    code: rec.code,
    status: rec.status,
    players: parseJson(rec.players, [] as Player[]),
    currentPlayer: rec.currentPlayer ?? 0,
    round: rec.round ?? 1,
    dice: (rec.dice ?? [1, 1, 1, 1, 1]) as number[],
    held: parseJson(rec.held, [false, false, false, false, false] as boolean[]),
    rollsLeft: rec.rollsLeft ?? 3,
    hasRolled: rec.hasRolled ?? false,
    finished: rec.finished ?? false,
    winners: (rec.winners ?? []) as string[],
    lastScored: parseJson(rec.lastScored, null),
  };
}

export const gameApi = {
  createRoom: (name: string) =>
    client.mutations.createRoom({ name }).then((r) => toSeat(unwrap(r))),

  joinRoom: (code: string, name: string) =>
    client.mutations
      .joinRoom({ code: code.toUpperCase(), name })
      .then((r) => toSeat(unwrap(r))),

  startGame: (gameId: string, seatToken: string) =>
    client.mutations.startGame({ gameId, seatToken }).then((r) => unwrap(r)),

  rollDice: (gameId: string, seatToken: string, keep: boolean[]) =>
    client.mutations
      .rollDice({ gameId, seatToken, keep })
      .then((r) => unwrap(r)),

  scoreCategory: (gameId: string, seatToken: string, category: Category) =>
    client.mutations
      .scoreCategory({ gameId, seatToken, category })
      .then((r) => unwrap(r)),

  get: (gameId: string) =>
    client.models.Game.get({ id: gameId }).then((r) =>
      r.data ? toRoomState(r.data) : null,
    ),

  /** Live updates for one room. Returns an unsubscribe function. */
  subscribe: (
    gameId: string,
    onChange: (room: RoomState) => void,
    onError?: (err: Error) => void,
  ) => {
    const sub = client.models.Game.onUpdate({
      filter: { id: { eq: gameId } },
    }).subscribe({
      next: (rec) => onChange(toRoomState(rec)),
      error: (err) => onError?.(err as Error),
    });
    return () => sub.unsubscribe();
  },
};
