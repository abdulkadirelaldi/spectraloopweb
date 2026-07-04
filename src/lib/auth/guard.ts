import { NextResponse } from "next/server";
import type { Session } from "next-auth";

import type { Role } from "@/types";
import { auth } from "./index";
import { hasRole, isAtLeast } from "./rbac";

/**
 * API-route authorization guards for panel endpoints (2.B2+).
 *
 * Each guard resolves the session server-side (`auth()`, JWT cookie — no DB) and
 * returns a discriminated result:
 *   - `{ ok: true, session }`  → authorized; use `session.user.{id,role,subteam}`
 *   - `{ ok: false, response }` → return this Response as-is
 *
 * Status contract: 401 when there is NO session (unauthenticated); 403 when the
 * session exists but the role is insufficient (authenticated, forbidden). Bodies
 * use the app-wide `{ ok: false, error }` shape with generic, non-leaking text.
 *
 * Usage in a Route Handler:
 *   const gate = await requireApiRole(["admin", "lead"]);
 *   if (!gate.ok) return gate.response;
 *   const { session } = gate; // session.user.role is guaranteed to be allowed
 */

export type AuthorizedContext = { ok: true; session: Session };
export type AuthorizationFailure = { ok: false; response: NextResponse };
export type AuthorizationResult = AuthorizedContext | AuthorizationFailure;

function deny(status: 401 | 403, error: string): AuthorizationFailure {
  return {
    ok: false,
    response: NextResponse.json({ ok: false, error }, { status }),
  };
}

/** Require any authenticated session. 401 when absent. */
export async function requireApiSession(): Promise<AuthorizationResult> {
  const session = await auth();
  if (!session?.user) return deny(401, "Unauthorized");
  return { ok: true, session };
}

/** Require an authenticated session whose role is exactly one of `allowed`. */
export async function requireApiRole(
  allowed: Role | readonly Role[],
): Promise<AuthorizationResult> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate;
  if (!hasRole(gate.session, allowed)) return deny(403, "Forbidden");
  return gate;
}

/** Require an authenticated session ranked at or above `min` (e.g. "lead"). */
export async function requireApiMinRole(
  min: Role,
): Promise<AuthorizationResult> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate;
  if (!isAtLeast(gate.session, min)) return deny(403, "Forbidden");
  return gate;
}
