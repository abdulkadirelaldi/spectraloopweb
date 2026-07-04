import { test } from "@playwright/test";

import { PUBLIC_ROUTES, assertHealthyPage } from "./helpers";

/**
 * Smoke coverage for every public route: 200 response, Header/nav/Footer
 * landmarks, a single visible H1, and no uncaught client errors. Purely
 * client-observable — no DB/Resend/env dependency (server components degrade
 * to empty-state fallbacks when the internal read APIs have no data).
 */
test.describe("public smoke", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} loads healthy`, async ({ page }, testInfo) => {
      await assertHealthyPage(page, route, testInfo);
    });
  }
});
