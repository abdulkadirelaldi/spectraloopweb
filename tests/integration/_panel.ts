import { vi } from "vitest";

import type { Role } from "@/types";

/**
 * Shared helpers for panel RBAC integration tests.
 *
 * These tests import the real route handlers and mock only the collaborators
 * `auth()` (session), `connectToDatabase` (no-op), the Mongoose models, and
 * `hashPassword`. That exercises the REAL guard + IDOR + privilege-escalation
 * logic deterministically — no database, no server, CI-friendly.
 */

/** Fixed, valid 24-hex ObjectId strings (accepted by mongoose.isValidObjectId). */
export const IDS = {
  doc: "a1a1a1a1a1a1a1a1a1a1a1a1",
  me: "c3c3c3c3c3c3c3c3c3c3c3c3",
  other: "d4d4d4d4d4d4d4d4d4d4d4d4",
} as const;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  subteam?: string;
};

/** Build a session for a role (defaults id to IDS.me). */
export function session(
  role: Role,
  opts: { id?: string; subteam?: string } = {},
) {
  return {
    user: {
      id: opts.id ?? IDS.me,
      email: "user@example.com",
      name: "Test User",
      role,
      subteam: opts.subteam,
    } satisfies SessionUser,
    expires: "2099-01-01T00:00:00.000Z",
  };
}

/** A JSON Request for a route handler (method + optional body). */
export function jsonReq(method: string, body?: unknown): Request {
  return new Request("http://localhost/api/panel/resource", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** A GET Request carrying query params. */
export function getReq(query = ""): Request {
  return new Request(`http://localhost/api/panel/resource${query}`, {
    method: "GET",
  });
}

/** Route-handler context with an awaited `params.id`. */
export const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

/**
 * A Mongoose-query stand-in supporting the chains the routes use:
 * `.lean()` and `.sort(...).lean()`, both resolving to `result`.
 */
export function leanQuery(result: unknown) {
  const q = {
    lean: () => Promise.resolve(result),
    sort: () => q,
  };
  return q;
}

/** Cast a vi.mock'd model to a bag of mock fns for per-test configuration. */
export function asMock<T>(model: T): Record<string, ReturnType<typeof vi.fn>> {
  return model as unknown as Record<string, ReturnType<typeof vi.fn>>;
}

/** Cast the overloaded Auth.js `auth` to a simple async getter mock. */
export function asAuthMock(auth: unknown) {
  return vi.mocked(auth as () => Promise<unknown>);
}
