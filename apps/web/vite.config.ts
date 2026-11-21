import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts" },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:4310",
      "/health": "http://127.0.0.1:4310",
      "/events": { target: "ws://127.0.0.1:4310", ws: true },
    },
  },
});
