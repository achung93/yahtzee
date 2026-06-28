import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The app talks to AppSync directly via aws-amplify (config in
// amplify_outputs.json), so no dev API proxy is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
