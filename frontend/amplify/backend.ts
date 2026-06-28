import { defineBackend } from "@aws-amplify/backend";
import { data } from "./data/resource";
import { gameEngine } from "./functions/game/resource";

/**
 * Anonymous, room-code multiplayer Yahtzee.
 * - `data`: AppSync + DynamoDB, apiKey auth for clients (read + subscribe only).
 * - `gameEngine`: Lambda backing the custom mutations; writes state back through
 *   the data client so changes fan out to subscribers.
 * No `auth` resource — players are anonymous (name + room code).
 */
defineBackend({
  data,
  gameEngine,
});
