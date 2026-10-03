import { nextJsConfig } from "@prismio/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    ignores: [".cloudflare/**", ".vinext/**", "dist/**"],
  },
];
