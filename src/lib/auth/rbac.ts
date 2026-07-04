import type { Role } from "@/types";

/**
 * Role-based access control primitives (PROGRAM.md §8 RBAC matrix).
 *
 * Pure, synchronous predicates over a session — no I/O, fully unit-testable.
 * They answer "does this role qualify?"; resource-scoped rules (a lead may only
 * touch their OWN subteam, a member only their OWN task) are enforced per-route
 * by Backend using `session.user.subteam` / `session.user.id`. These helpers are
 * the role gate, not the whole authorization story.
 *
 * Role hierarchy: admin (3) > lead (2) > member (1).
 */
export const ROLE_RANK: Record<Role, number> = {
  member: 1,
  lead: 2,
  admin: 3,
};

/** Anything carrying an optional `user.role` — a Session, or null/undefined. */
export type WithRole =
  { user?: { role?: Role | null } | null } | null | undefined;

/** The role on a session, or null when unauthenticated / role missing. */
export function roleOf(session: WithRole): Role | null {
  return session?.user?.role ?? null;
}

/** True when the session's role is exactly one of `allowed`. */
export function hasRole(
  session: WithRole,
  allowed: Role | readonly Role[],
): boolean {
  const role = roleOf(session);
  if (!role) return false;
  return Array.isArray(allowed) ? allowed.includes(role) : allowed === role;
}

/**
 * True when the session's role ranks at or above `min` in the hierarchy.
 * Use for "lead and up" style gates, e.g. `isAtLeast(session, "lead")`.
 */
export function isAtLeast(session: WithRole, min: Role): boolean {
  const role = roleOf(session);
  return role != null && ROLE_RANK[role] >= ROLE_RANK[min];
}

/** True only for the admin role. */
export function isAdmin(session: WithRole): boolean {
  return roleOf(session) === "admin";
}

/** True only for the (exact) lead role. For "lead or above" use `isAtLeast`. */
export function isLead(session: WithRole): boolean {
  return roleOf(session) === "lead";
}
