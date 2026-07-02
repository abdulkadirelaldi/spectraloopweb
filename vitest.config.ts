import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit/integration runner. E2E (tests/e2e) is Playwright's — kept out of `include`
// so the two runners never pick up each other's specs.
export default defineConfig({
  resolve: {
    alias: {
      // Mirror the tsconfig `@/*` -> `./src/*` path alias for test imports.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: [
      "tests/unit/**/*.{test,spec}.ts",
      "tests/integration/**/*.{test,spec}.ts",
    ],
  },
});
