import { defineFunction } from "@aws-amplify/backend";

export const gameEngine = defineFunction({
  name: "gameEngine",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
