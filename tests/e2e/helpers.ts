import type { Page, TestInfo } from "@playwright/test";
import { expect } from "@playwright/test";

/** Every public route, with its expected (unique) H1 text. */
export const PUBLIC_ROUTES: ReadonlyArray<{ path: string; h1: string }> = [
  { path: "/", h1: "birlikte tasarlıyoruz" },
  { path: "/hakkimizda", h1: "öğrenci takımı" },
  { path: "/arac", h1: "Yüksek hız için" },
  { path: "/basarilar", h1: "bugüne yolculuğumuz" },
  { path: "/ekipler", h1: "tek bir hedef" },
  { path: "/sponsorluk", h1: "yön verelim" },
  { path: "/haberler", h1: "son gelişmeler" },
  { path: "/iletisim", h1: "Bize ulaşın" },
  { path: "/katil", h1: "birlikte inşa edelim" },
];

/**
 * Console/page-error messages that are environment noise rather than app bugs:
 * resource-load failures (offline fonts, favicon) that don't indicate a broken
 * page. We still fail on genuine uncaught exceptions and app-level errors.
 */
const BENIGN = [
  /favicon/i,
  /fonts\.gstatic\.com/i,
  /Failed to load resource/i,
  /net::ERR_/i,
  /ERR_INTERNET_DISCONNECTED/i,
  /downloadable font/i,
];

function isBenign(text: string): boolean {
  return BENIGN.some((re) => re.test(text));
}

/**
 * Attaches listeners that record real client-side errors: uncaught exceptions
 * (`pageerror`) and `console.error` messages, minus known environment noise.
 * Returns a getter for the collected errors so a test can assert on them.
 */
export function collectPageErrors(page: Page): () => string[] {
  const errors: string[] = [];

  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!isBenign(text)) errors.push(`[console.error] ${text}`);
  });

  return () => errors;
}

/**
 * Loads a route and asserts the baseline health contract shared by every public
 * page: 200 response, the Header (banner) + nav landmark + Footer, exactly one
 * visible H1, and no uncaught client errors.
 */
export async function assertHealthyPage(
  page: Page,
  route: { path: string; h1: string },
  testInfo: TestInfo,
): Promise<void> {
  const getErrors = collectPageErrors(page);

  const response = await page.goto(route.path);
  expect(
    response,
    `navigation to ${route.path} returned a response`,
  ).not.toBeNull();
  expect(response!.status(), `status for ${route.path}`).toBe(200);

  // Landmarks: header (banner role), primary nav, footer (contentinfo role).
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Ana menü" }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();

  // Exactly one H1, visible and non-empty (SEO / a11y).
  const h1 = page.locator("h1");
  await expect(h1).toHaveCount(1);
  await expect(h1).toBeVisible();
  await expect(h1).toContainText(route.h1);

  // Give late console errors a tick to surface, then assert none.
  await page.waitForLoadState("networkidle").catch(() => {});
  const errors = getErrors();
  if (errors.length > 0) {
    testInfo.attach(`console-errors-${route.path}`, {
      body: errors.join("\n"),
      contentType: "text/plain",
    });
  }
  expect(errors, `client errors on ${route.path}`).toEqual([]);
}
