import { expect, test } from "@playwright/test";

/**
 * Panel API authentication boundary (real server). Unauthenticated requests to
 * every panel API must be rejected with 401 BEFORE any DB access — the API is
 * the real security boundary (PROGRAM §11), independent of the UI/proxy. Role
 * matrix (401 vs 403 vs IDOR) is covered deterministically in the integration
 * tests (tests/integration/panel-*-rbac).
 */

const PANEL_APIS = [
  "/api/panel/announcements",
  "/api/panel/tasks",
  "/api/panel/members",
  "/api/panel/documents",
  "/api/panel/events",
] as const;

test.describe("panel API requires authentication", () => {
  for (const path of PANEL_APIS) {
    test(`GET ${path} → 401 when unauthenticated`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(401);
      expect(await res.json()).toMatchObject({ ok: false });
    });

    test(`POST ${path} → 401 when unauthenticated`, async ({ request }) => {
      const res = await request.post(path, { data: {} });
      expect(res.status()).toBe(401);
    });
  }

  test("a bogus session cookie does not grant API access (still 401)", async ({
    request,
  }) => {
    // The proxy's optimistic gate lets a cookie through, but the API validates
    // the JWT for real — an unverifiable token yields no session → 401.
    const res = await request.get("/api/panel/tasks", {
      headers: { cookie: "authjs.session-token=forged-not-a-valid-jwt" },
    });
    expect(res.status()).toBe(401);
  });
});
