import { expect, test, type Page } from "@playwright/test";

/**
 * /katil ApplicationForm flow. The POST to /api/applications is always
 * intercepted, so no real DB write or mail ever happens — we assert pure
 * client behaviour: validation, success state, and server-error state.
 */

async function fillValidApplication(page: Page): Promise<void> {
  await page.getByLabel("Ad soyad").fill("Ada Yılmaz");
  await page.getByLabel("E-posta").fill("ada@example.com");
  await page.getByLabel("Tercih ettiğin alt ekip").selectOption({ index: 1 }); // first real subteam (index 0 is the disabled placeholder)
  await page
    .getByLabel("Neden katılmak istiyorsun?")
    .fill("Takıma katılmak ve gerçek mühendislik deneyimi kazanmak istiyorum.");
}

test.describe("application form (/katil)", () => {
  test("shows client validation errors and does not call the API", async ({
    page,
  }) => {
    let apiCalls = 0;
    await page.route("**/api/applications", async (route) => {
      apiCalls += 1;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, id: "should-not-be-called" }),
      });
    });

    await page.goto("/katil");
    await page.getByRole("button", { name: "Başvuruyu gönder" }).click();

    // Field-level errors surface for the empty required fields.
    await expect(page.getByText("Ad soyad zorunludur.")).toBeVisible();
    await expect(page.getByText("E-posta zorunludur.")).toBeVisible();
    await expect(page.getByText("Lütfen bir alt ekip seçin.")).toBeVisible();
    await expect(page.getByText("Mesaj zorunludur.")).toBeVisible();

    // Invalid email is rejected client-side too.
    await page.getByLabel("E-posta").fill("not-an-email");
    await page.getByRole("button", { name: "Başvuruyu gönder" }).click();
    await expect(
      page.getByText("Geçerli bir e-posta adresi girin."),
    ).toBeVisible();

    expect(apiCalls, "API must not be called on invalid submit").toBe(0);
  });

  test("submits valid input and shows the success state (mocked 201)", async ({
    page,
  }) => {
    let received: unknown = null;
    await page.route("**/api/applications", async (route) => {
      received = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, id: "665f1c2e9a3b4c1d2e3f4a5b" }),
      });
    });

    await page.goto("/katil");
    await fillValidApplication(page);
    await page.getByRole("button", { name: "Başvuruyu gönder" }).click();

    await expect(
      page.getByRole("heading", { name: "Başvurun alındı!" }),
    ).toBeVisible();

    // The form sent the expected trimmed payload shape.
    expect(received).toMatchObject({
      name: "Ada Yılmaz",
      email: "ada@example.com",
    });
  });

  test("shows the server error message on a mocked 400", async ({ page }) => {
    await page.route("**/api/applications", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Invalid email address." }),
      });
    });

    await page.goto("/katil");
    await fillValidApplication(page);
    await page.getByRole("button", { name: "Başvuruyu gönder" }).click();

    await expect(page.getByText("Invalid email address.")).toBeVisible();
    // Success state must NOT appear.
    await expect(
      page.getByRole("heading", { name: "Başvurun alındı!" }),
    ).toHaveCount(0);
  });
});
