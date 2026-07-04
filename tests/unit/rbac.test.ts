import { describe, expect, it } from "vitest";

import type { Role } from "@/types";
import { hasRole, isAdmin, isAtLeast, isLead, roleOf } from "@/lib/auth/rbac";

/** Build a minimal session-like object carrying a role. */
function sessionWith(role: Role) {
  return { user: { id: "1", email: "u@x.com", name: "U", role } };
}

const ROLES: Role[] = ["admin", "lead", "member"];

describe("roleOf", () => {
  it("reads the role from a session", () => {
    expect(roleOf(sessionWith("lead"))).toBe("lead");
  });

  it("returns null for unauthenticated / missing role", () => {
    expect(roleOf(null)).toBeNull();
    expect(roleOf(undefined)).toBeNull();
    expect(roleOf({ user: null })).toBeNull();
    expect(roleOf({})).toBeNull();
  });
});

describe("hasRole", () => {
  it("matches an exact single role", () => {
    expect(hasRole(sessionWith("admin"), "admin")).toBe(true);
    expect(hasRole(sessionWith("member"), "admin")).toBe(false);
  });

  it("matches any role in a list", () => {
    expect(hasRole(sessionWith("lead"), ["admin", "lead"])).toBe(true);
    expect(hasRole(sessionWith("member"), ["admin", "lead"])).toBe(false);
  });

  it("is false for no session", () => {
    expect(hasRole(null, ["admin", "lead", "member"])).toBe(false);
  });
});

describe("isAtLeast (hierarchy admin > lead > member)", () => {
  // Expected truth table for isAtLeast(role, min).
  const table: Array<[Role, Role, boolean]> = [
    ["admin", "member", true],
    ["admin", "lead", true],
    ["admin", "admin", true],
    ["lead", "member", true],
    ["lead", "lead", true],
    ["lead", "admin", false],
    ["member", "member", true],
    ["member", "lead", false],
    ["member", "admin", false],
  ];

  it.each(table)("%s isAtLeast %s -> %s", (role, min, expected) => {
    expect(isAtLeast(sessionWith(role), min)).toBe(expected);
  });

  it("is false for no session", () => {
    expect(isAtLeast(null, "member")).toBe(false);
  });
});

describe("isAdmin / isLead (exact)", () => {
  it.each(ROLES)("isAdmin(%s)", (role) => {
    expect(isAdmin(sessionWith(role))).toBe(role === "admin");
  });

  it.each(ROLES)("isLead(%s) is exact (not lead+)", (role) => {
    expect(isLead(sessionWith(role))).toBe(role === "lead");
  });

  it("both false for no session", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isLead(undefined)).toBe(false);
  });
});
