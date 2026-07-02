import { expect, test } from "@playwright/test";

// Smoke E2E — the homepage serves a 200 and renders. Grows into the public-site
// E2E suite in Faz 1 (1.Q2).
test("homepage responds 200 and loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response, "navigation should return a response").not.toBeNull();
  expect(response!.status()).toBe(200);
  // Body renders (framework mounted, not a blank/error shell).
  await expect(page.locator("body")).toBeVisible();
});
