import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", ".vercel/**", "agents-dashboard/**", ".backup_*.tsx"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["src/**/*.ts", "tests/**/*.ts", "vite.config.ts"], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  // JS V1 (Home validée, fichiers gelés) : on tolère les try/catch vides historiques plutôt que de toucher au code validé.
  { files: ["public/assets/js/**/*.js", "assets/js/**/*.js"], languageOptions: { sourceType: "script", globals: { ...globals.browser } }, rules: { "no-empty": ["error", { allowEmptyCatch: true }], "@typescript-eslint/no-unused-vars": ["error", { caughtErrors: "none" }] } },
  { files: ["scripts/**/*.{mjs,ts}", "eslint.config.js"], languageOptions: { globals: { ...globals.node } } },
);
