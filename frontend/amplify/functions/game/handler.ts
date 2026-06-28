import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { randomBytes, createHash } from "node:crypto";
// @ts-ignore - generated at deploy time
import { env } from "$amplify/env/gameEngine";
import type { Schema } from "../../data/resource";
import { Category, Room } from "./types";
import {
  addPlayer,
  applyRoll,
  applyScore,
  createRoomState,
  startGame,
} from "./engine";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

interface ResolverEvent {
  typeName: string;
  fieldName: string;
  arguments: Record<string, any>;
}

interface GameRecord {
  id: string;
  code: string;
  status: string;
  players: Room["players"];
  tokenHashes: string[];
  currentPlayer: number;
  round: number;
  dice: number[];
  held: boolean[];
  rollsLeft: number;
  hasRolled: boolean;
  finished: boolean;
  winners: string[];
  lastScored: Room["lastScored"];
}

const hash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const newToken = () => randomBytes(24).toString("hex");

// 4-char codes from an unambiguous alphabet (no 0/O/1/I).
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode(): string {
  const bytes = randomBytes(4);
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

/** Reconstruct the engine Room from a persisted record. */
function toRoom(rec: GameRecord): Room {
  return {
    status: rec.status as Room["status"],
    players: rec.players,
    currentPlayer: rec.currentPlayer,
    round: rec.round,
    dice: rec.dice,
    held: rec.held,
    rollsLeft: rec.rollsLeft,
    hasRolled: rec.hasRolled,
    finished: rec.finished,
    winners: rec.winners,
    lastScored: rec.lastScored,
  };
}

/** The gameplay columns to persist back from a Room. */
function roomFields(room: Room) {
  return {
    status: room.status,
    players: room.players,
    currentPlayer: room.currentPlayer,
    round: room.round,
    dice: room.dice,
    held: room.held,
    rollsLeft: room.rollsLeft,
    hasRolled: room.hasRolled,
    finished: room.finished,
    winners: room.winners,
    lastScored: room.lastScored,
  };
}

async function loadGame(gameId: string): Promise<GameRecord> {
  const { data, errors } = await client.models.Game.get({ id: gameId });
  if (errors) throw new Error(errors.map((e) => e.message).join(", "));
  if (!data) throw new Error("Game not found.");
  return data as unknown as GameRecord;
}

async function loadGameByCode(code: string): Promise<GameRecord> {
  const { data, errors } = await client.models.Game.listGameByCode({
    code: code.toUpperCase(),
  });
  if (errors) throw new Error(errors.map((e) => e.message).join(", "));
  if (!data || data.length === 0) throw new Error("Room not found.");
  return data[0] as unknown as GameRecord;
}

async function save(gameId: string, fields: Record<string, unknown>) {
  const { errors } = await client.models.Game.update({
    id: gameId,
    ...fields,
  });
  if (errors) throw new Error(errors.map((e) => e.message).join(", "));
}

/** Hash the token and return the seat index it belongs to (or -1). */
function seatFor(rec: GameRecord, token: string): number {
  return rec.tokenHashes.indexOf(hash(token));
}

export const handler = async (event: ResolverEvent) => {
  const args = event.arguments;

  switch (event.fieldName) {
    case "createRoom": {
      const room = createRoomState(String(args.name).trim() || "Player 1");
      const token = newToken();

      // Generate a code, retrying on the rare collision.
      let code = newCode();
      for (let i = 0; i < 5; i++) {
        const existing = await client.models.Game.listGameByCode({ code });
        if (!existing.data || existing.data.length === 0) break;
        code = newCode();
      }

      const { data, errors } = await client.models.Game.create({
        code,
        tokenHashes: [hash(token)],
        ...roomFields(room),
      });
      if (errors) throw new Error(errors.map((e) => e.message).join(", "));

      return { gameId: data!.id, code, seatToken: token, seatIndex: 0 };
    }

    case "joinRoom": {
      const rec = await loadGameByCode(String(args.code));
      const room = toRoom(rec);
      const seatIndex = addPlayer(room, String(args.name).trim() || "Player");
      const token = newToken();

      await save(rec.id, {
        players: room.players,
        tokenHashes: [...rec.tokenHashes, hash(token)],
      });

      return {
        gameId: rec.id,
        code: rec.code,
        seatToken: token,
        seatIndex,
      };
    }

    case "startGame": {
      const rec = await loadGame(String(args.gameId));
      if (seatFor(rec, String(args.seatToken)) !== 0) {
        throw new Error("Only the host can start the game.");
      }
      const room = startGame(toRoom(rec));
      await save(rec.id, roomFields(room));
      return { gameId: rec.id, code: rec.code };
    }

    case "rollDice": {
      const rec = await loadGame(String(args.gameId));
      const seat = seatFor(rec, String(args.seatToken));
      if (seat < 0) throw new Error("You are not in this game.");
      if (seat !== rec.currentPlayer) throw new Error("It is not your turn.");
      const room = applyRoll(toRoom(rec), (args.keep as boolean[]) ?? []);
      await save(rec.id, roomFields(room));
      return { gameId: rec.id, code: rec.code };
    }

    case "scoreCategory": {
      const rec = await loadGame(String(args.gameId));
      const seat = seatFor(rec, String(args.seatToken));
      if (seat < 0) throw new Error("You are not in this game.");
      if (seat !== rec.currentPlayer) throw new Error("It is not your turn.");
      const room = applyScore(toRoom(rec), args.category as Category);
      await save(rec.id, roomFields(room));
      return { gameId: rec.id, code: rec.code };
    }

    default:
      throw new Error(`Unknown action: ${event.fieldName}`);
  }
};
