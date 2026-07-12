import { defineConfig, devices } from "@playwright/test";

// Honour PORT so the suite can run on a free port when 3000 is occupied
// (defaults to 3000 for CI / normal local runs). `next dev`/`start` read PORT too.
const PORT = Number(process.env.PORT) || 3000;
const baseURL = `http://localhost:${PORT}`;

// E2E runner. Boots the app and drives it in a real (headless) browser.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  // Fail the CI build if a `test.only` was left in the source.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Auto-start the app for the tests. In CI a prod build is more representative;
  // locally `next dev` boots faster and an already-running server is reused.
  webServer: {
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Auth.js needs a secret to boot its endpoints in CI. A throwaway value is
    // fine here — the panel-protection E2E only exercises the cookie-presence
    // gate, not token decoding. Real secrets live in .env.local / CI secrets.
    env: {
      AUTH_SECRET:
        process.env.AUTH_SECRET ?? "e2e-test-secret-not-for-production-0000",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseURL,
    },
  },
});
