import {
  type ClientSchema,
  a,
  defineData,
} from "@aws-amplify/backend";
import { gameEngine } from "../functions/game/resource";

/**
 * One `Game` row per room. Clients can only READ + SUBSCRIBE (publicApiKey);
 * all state changes go through the custom mutations below, which are handled by
 * the `gameEngine` Lambda. The Lambda writes back through the data client (IAM),
 * so every change fans out to subscribers via `Game.onUpdate`.
 *
 * Anonymous play = API key authorization, so no Cognito auth resource is needed.
 */
const schema = a
  .schema({
    Game: a
      .model({
        code: a.string().required(),
        status: a.string().required(), // "lobby" | "playing" | "finished"
        // [{ name, connected, scorecard, yahtzeeBonuses }]
        players: a.json().required(),
        // SHA-256 hash per seat; the raw token is returned to the joiner once.
        tokenHashes: a.json().required(),
        currentPlayer: a.integer().required(),
        round: a.integer().required(),
        dice: a.integer().array().required(),
        held: a.json().required(), // boolean[5]
        rollsLeft: a.integer().required(),
        hasRolled: a.boolean().required(),
        finished: a.boolean().required(),
        winners: a.string().array().required(),
        lastScored: a.json(), // { player, category, points } | null
      })
      .secondaryIndexes((index) => [index("code")])
      // Clients get read + subscribe only; the gameEngine function's write
      // access is granted at the schema level below (allow.resource).
      .authorization((allow) => [
        allow.publicApiKey().to(["read", "listen"]),
      ]),

    // ---- Custom mutations (all run on the gameEngine Lambda) ----
    GameAction: a.customType({
      gameId: a.string(),
      code: a.string(),
      seatToken: a.string(),
      seatIndex: a.integer(),
    }),

    createRoom: a
      .mutation()
      .arguments({ name: a.string().required() })
      .returns(a.ref("GameAction"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(a.handler.function(gameEngine)),

    joinRoom: a
      .mutation()
      .arguments({
        code: a.string().required(),
        name: a.string().required(),
      })
      .returns(a.ref("GameAction"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(a.handler.function(gameEngine)),

    startGame: a
      .mutation()
      .arguments({
        gameId: a.string().required(),
        seatToken: a.string().required(),
      })
      .returns(a.ref("GameAction"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(a.handler.function(gameEngine)),

    rollDice: a
      .mutation()
      .arguments({
        gameId: a.string().required(),
        seatToken: a.string().required(),
        keep: a.boolean().array().required(),
      })
      .returns(a.ref("GameAction"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(a.handler.function(gameEngine)),

    scoreCategory: a
      .mutation()
      .arguments({
        gameId: a.string().required(),
        seatToken: a.string().required(),
        category: a.string().required(),
      })
      .returns(a.ref("GameAction"))
      .authorization((allow) => [allow.publicApiKey()])
      .handler(a.handler.function(gameEngine)),
  })
  .authorization((allow) => [allow.resource(gameEngine)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
});
