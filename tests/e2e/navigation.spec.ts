import { expect, test } from "@playwright/test";

/**
 * Header navigation: critical links route to the right page. Scoped to the
 * banner landmark so we drive the real header (not the footer's mirror links).
 * Runs on the desktop viewport where the primary nav is visible.
 */
test.describe("header navigation", () => {
  test("nav link → Sponsorluk", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Ana menü" });
    await nav.getByRole("link", { name: "Sponsorluk" }).click();
    await page.waitForURL("**/sponsorluk");
    await expect(page.locator("h1")).toContainText("yön verelim");
  });

  test("CTA → Bize Katıl (application page)", async ({ page }) => {
    await page.goto("/");
    // The CTA lives in the header but outside the nav list.
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Bize Katıl" })
      .click();
    await page.waitForURL("**/katil");
    await expect(page.locator("h1")).toContainText("birlikte inşa edelim");
  });

  test("nav link → Ana Sayfa returns home", async ({ page }) => {
    await page.goto("/iletisim");
    const nav = page.getByRole("navigation", { name: "Ana menü" });
    await nav.getByRole("link", { name: "Ana Sayfa" }).click();
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page.locator("h1")).toContainText("birlikte tasarlıyoruz");
  });
});
