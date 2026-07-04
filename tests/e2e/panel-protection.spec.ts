import { expect, test } from "@playwright/test";

/**
 * Panel route protection — the optimistic proxy gate (src/proxy.ts). This is the
 * pre-filter, NOT the security boundary (that's the API guard `requireApiRole`
 * + the panel layout's server-side `auth()`), so these tests only assert the
 * redirect/pass behaviour of the cookie-presence check. No login or DB needed.
 */
test.describe("panel route protection", () => {
  test("unauthenticated /panel redirects to sign-in with callbackUrl", async ({
    page,
  }) => {
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/giris\?callbackUrl=%2Fpanel$/);
  });

  test("a deep panel path preserves its callbackUrl", async ({ page }) => {
    await page.goto("/panel/gorevler");
    await expect(page).toHaveURL(/\/giris\?callbackUrl=%2Fpanel%2Fgorevler$/);
  });

  test("a session cookie passes the optimistic gate (no redirect)", async ({
    page,
    context,
    baseURL,
  }) => {
    // Presence — not validity — is what the optimistic gate checks; a bogus
    // value still passes here and would be rejected later by auth()/the API.
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: "optimistic-gate-not-validated-here",
        url: baseURL!,
      },
    ]);

    await page.goto("/panel");
    // Stayed on /panel (not bounced to /giris). No page exists yet → 404, but
    // the point is the gate did not redirect.
    expect(new URL(page.url()).pathname).toBe("/panel");
  });

  test("public routes are unaffected by the panel gate", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
});
