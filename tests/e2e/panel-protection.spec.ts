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

  test("a forged session cookie is still rejected (defense in depth)", async ({
    page,
    context,
    baseURL,
  }) => {
    // The optimistic proxy gate only checks cookie PRESENCE, so a bogus cookie
    // passes it — but the panel layout re-validates the session with auth()
    // server-side and redirects an unverifiable one to sign-in. (The API layer
    // independently returns 401 — see panel-api-auth.spec.ts.)
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: "forged-not-a-valid-jwt",
        url: baseURL!,
      },
    ]);

    await page.goto("/panel");
    await expect(page).toHaveURL(/\/giris(\?|$)/);
  });

  test("public routes are unaffected by the panel gate", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  });
});
