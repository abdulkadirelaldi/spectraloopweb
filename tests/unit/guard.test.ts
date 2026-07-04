import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the auth singleton so guards run without booting NextAuth / a DB.
vi.mock("@/lib/auth/index", () => ({ auth: vi.fn() }));

import type { Role } from "@/types";
import { auth } from "@/lib/auth/index";
import {
  requireApiMinRole,
  requireApiRole,
  requireApiSession,
} from "@/lib/auth/guard";

// `auth` is an overloaded function in v5; view it as a simple async getter here
// so mockResolvedValue accepts a session-or-null without overload confusion.
const authMock = vi.mocked(auth as unknown as () => Promise<unknown>);

function session(role: Role) {
  return {
    user: { id: "1", email: "u@x.com", name: "U", role },
    expires: "2099-01-01T00:00:00.000Z",
  };
}

/** Point the mocked auth() at a given session (or null for unauthenticated). */
function signedInAs(role: Role | null) {
  authMock.mockResolvedValue(role ? session(role) : null);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireApiSession", () => {
  it("401 when unauthenticated", async () => {
    signedInAs(null);
    const result = await requireApiSession();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
      await expect(result.response.json()).resolves.toEqual({
        ok: false,
        error: "Unauthorized",
      });
    }
  });

  it("ok with the session for any authenticated user", async () => {
    signedInAs("member");
    const result = await requireApiSession();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.session.user.role).toBe("member");
  });
});

describe("requireApiRole", () => {
  it("401 when unauthenticated (no session beats role check)", async () => {
    signedInAs(null);
    const result = await requireApiRole(["admin"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("403 when authenticated but role not allowed", async () => {
    signedInAs("member");
    const result = await requireApiRole(["admin", "lead"]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({
        ok: false,
        error: "Forbidden",
      });
    }
  });

  it("ok when role is allowed", async () => {
    signedInAs("admin");
    const result = await requireApiRole(["admin", "lead"]);
    expect(result.ok).toBe(true);
  });

  it("accepts a single role argument", async () => {
    signedInAs("lead");
    expect((await requireApiRole("lead")).ok).toBe(true);
    signedInAs("member");
    expect((await requireApiRole("lead")).ok).toBe(false);
  });
});

describe("requireApiMinRole (hierarchy)", () => {
  it("member is below the lead gate -> 403", async () => {
    signedInAs("member");
    const result = await requireApiMinRole("lead");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("lead and admin clear the lead gate", async () => {
    signedInAs("lead");
    expect((await requireApiMinRole("lead")).ok).toBe(true);
    signedInAs("admin");
    expect((await requireApiMinRole("lead")).ok).toBe(true);
  });

  it("401 when unauthenticated", async () => {
    signedInAs(null);
    const result = await requireApiMinRole("member");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });
});
