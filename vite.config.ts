/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { resolve } from "node:path";

// La Home V1 (public/index.html) est copiée TELLE QUELLE (aucune transformation) ;
// /swap.html et /farm.html chargent les modules dApp TypeScript.
export default defineConfig({
  base: "./",
  plugins: [nodePolyfills({ include: ["buffer", "process", "crypto", "stream", "util", "events"], globals: { Buffer: true, process: true } })],
  build: {
    target: "es2022",
    assetsDir: "_app",
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      input: {

        swap: resolve(__dirname, "swap.html"),
        farm: resolve(__dirname, "farm.html"),
      },
    },
  },
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
});
