import { expect, test, type Page } from "@playwright/test";

/**
 * /iletisim ContactForm flow (withSubject variant). The POST to /api/contact is
 * always intercepted — no real mail is sent. We assert client validation, the
 * success state, and the server-error state.
 */

async function fillValidContact(page: Page): Promise<void> {
  await page.getByLabel("Ad soyad").fill("Ada Yılmaz");
  await page.getByLabel("E-posta").fill("ada@example.com");
  await page.getByLabel("Konu").fill("Sponsorluk hakkında");
  await page.getByLabel("Mesaj").fill("Merhaba, sizinle görüşmek istiyoruz.");
}

test.describe("contact form (/iletisim)", () => {
  test("shows client validation errors and does not call the API", async ({
    page,
  }) => {
    let apiCalls = 0;
    await page.route("**/api/contact", async (route) => {
      apiCalls += 1;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/iletisim");
    await page.getByRole("button", { name: "Mesajı gönder" }).click();

    await expect(page.getByText("Ad soyad zorunludur.")).toBeVisible();
    await expect(page.getByText("E-posta zorunludur.")).toBeVisible();
    await expect(page.getByText("Mesaj zorunludur.")).toBeVisible();

    await page.getByLabel("E-posta").fill("bad@");
    await page.getByRole("button", { name: "Mesajı gönder" }).click();
    await expect(
      page.getByText("Geçerli bir e-posta adresi girin."),
    ).toBeVisible();

    expect(apiCalls, "API must not be called on invalid submit").toBe(0);
  });

  test("submits valid input and shows the success state (mocked 201)", async ({
    page,
  }) => {
    let received: unknown = null;
    await page.route("**/api/contact", async (route) => {
      received = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/iletisim");
    await fillValidContact(page);
    await page.getByRole("button", { name: "Mesajı gönder" }).click();

    await expect(
      page.getByRole("heading", { name: "Teşekkürler!" }),
    ).toBeVisible();
    expect(received).toMatchObject({
      name: "Ada Yılmaz",
      email: "ada@example.com",
      subject: "Sponsorluk hakkında",
      message: "Merhaba, sizinle görüşmek istiyoruz.",
    });
  });

  test("shows the server error message on a mocked 400", async ({ page }) => {
    await page.route("**/api/contact", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Invalid email address." }),
      });
    });

    await page.goto("/iletisim");
    await fillValidContact(page);
    await page.getByRole("button", { name: "Mesajı gönder" }).click();

    await expect(page.getByText("Invalid email address.")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Teşekkürler!" }),
    ).toHaveCount(0);
  });
});
