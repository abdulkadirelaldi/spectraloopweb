import type { UserDocument } from "@/models/User";
import type { Role } from "@/types";

/**
 * Shared helpers for the panel members endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 *
 * SECURITY: the safe projection below NEVER includes `passwordHash`. Even though
 * the schema marks it `select: false`, `toMember` builds the response object
 * from an explicit allow-list — defence in depth against accidental leakage.
 */

export const ROLES: readonly Role[] = ["admin", "lead", "member"];

const LIMITS = {
  name: 120,
  email: 254,
  subteam: 120,
  photoUrl: 2048,
  password: { min: 8, max: 200 },
} as const;

// Pragmatic email check; authoritative validation arrives with zod (2.Q0).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Safe, client-facing member shape. `email` only when the viewer may see it. */
export interface MemberView {
  id: string;
  name: string;
  email?: string;
  role: Role;
  subteam?: string;
  photoUrl?: string;
  active: boolean;
  createdAt: string;
}

/**
 * Map a User document to the safe `MemberView`. `passwordHash` is never read.
 * @param includeEmail whether the viewer is allowed to see the email (see README
 *   field-visibility policy: admin + lead only).
 */
export function toMember(
  doc: UserDocument & { _id: unknown },
  includeEmail: boolean,
): MemberView {
  const view: MemberView = {
    id: String(doc._id),
    name: doc.name,
    role: doc.role as Role,
    subteam: doc.subteam ?? undefined,
    photoUrl: doc.photoUrl ?? undefined,
    active: doc.active,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
  if (includeEmail) view.email = doc.email;
  return view;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export interface MemberCreateInput {
  name: string;
  email: string;
  password?: string;
  role: Role;
  subteam?: string;
  photoUrl?: string;
  active: boolean;
}

/** Fields a client may submit on update; role/active gating is done in the route. */
export interface MemberUpdateInput {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  subteam?: string;
  photoUrl?: string;
  active?: boolean;
}

function checkOptionalString(
  value: unknown,
  max: number,
  label: string,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `Invalid ${label}.` };
  }
  if (value.length > max) return { ok: false, error: `${label} is too long.` };
  return { ok: true, value: value.trim() };
}

function checkPassword(
  value: unknown,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== "string" || value.length < LIMITS.password.min) {
    return {
      ok: false,
      error: `Password must be at least ${LIMITS.password.min} characters.`,
    };
  }
  if (value.length > LIMITS.password.max) {
    return { ok: false, error: "Password is too long." };
  }
  return { ok: true, value };
}

/**
 * Minimal server-side validation for CREATE (POST, admin-only).
 *
 * TODO(2.Q): replace with an authoritative panel-member zod schema owned by
 * Security & QA (`@/lib/validation`, task 2.Q0). Hand-rolled checks for now.
 */
export function validateCreate(
  body: unknown,
): ValidateResult<MemberCreateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.name) || b.name.length > LIMITS.name) {
    return { ok: false, error: "Field name is required." };
  }
  if (!isNonEmptyString(b.email) || b.email.length > LIMITS.email) {
    return { ok: false, error: "Field email is required." };
  }
  if (!EMAIL_RE.test(b.email)) {
    return { ok: false, error: "Invalid email address." };
  }

  const password = checkPassword(b.password);
  if (!password.ok) return password;

  let role: Role = "member";
  if (b.role !== undefined) {
    if (!ROLES.includes(b.role as never)) {
      return { ok: false, error: "Invalid role." };
    }
    role = b.role as Role;
  }

  const subteam = checkOptionalString(b.subteam, LIMITS.subteam, "subteam");
  if (!subteam.ok) return subteam;

  const photoUrl = checkOptionalString(b.photoUrl, LIMITS.photoUrl, "photoUrl");
  if (!photoUrl.ok) return photoUrl;

  let active = true;
  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") {
      return { ok: false, error: "active must be a boolean." };
    }
    active = b.active;
  }

  return {
    ok: true,
    data: {
      name: b.name.trim(),
      email: b.email.trim().toLowerCase(),
      password: password.value,
      role,
      subteam: subteam.value,
      photoUrl: photoUrl.value,
      active,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH). Every field optional; at
 * least one must be present. Which fields a given ROLE may actually change is
 * enforced in the route (privilege-escalation guard).
 *
 * TODO(2.Q): replace with the shared panel-member zod schema (see above).
 */
export function validateUpdate(
  body: unknown,
): ValidateResult<MemberUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const patch: MemberUpdateInput = {};

  if (b.name !== undefined) {
    if (!isNonEmptyString(b.name) || b.name.length > LIMITS.name) {
      return { ok: false, error: "Invalid name." };
    }
    patch.name = b.name.trim();
  }
  if (b.email !== undefined) {
    if (
      !isNonEmptyString(b.email) ||
      b.email.length > LIMITS.email ||
      !EMAIL_RE.test(b.email)
    ) {
      return { ok: false, error: "Invalid email address." };
    }
    patch.email = b.email.trim().toLowerCase();
  }
  if (b.password !== undefined) {
    const r = checkPassword(b.password);
    if (!r.ok) return r;
    patch.password = r.value;
  }
  if (b.role !== undefined) {
    if (!ROLES.includes(b.role as never)) {
      return { ok: false, error: "Invalid role." };
    }
    patch.role = b.role as Role;
  }
  if ("subteam" in b) {
    const r = checkOptionalString(b.subteam, LIMITS.subteam, "subteam");
    if (!r.ok) return r;
    patch.subteam = r.value;
  }
  if ("photoUrl" in b) {
    const r = checkOptionalString(b.photoUrl, LIMITS.photoUrl, "photoUrl");
    if (!r.ok) return r;
    patch.photoUrl = r.value;
  }
  if (b.active !== undefined) {
    if (typeof b.active !== "boolean") {
      return { ok: false, error: "active must be a boolean." };
    }
    patch.active = b.active;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No updatable fields provided." };
  }

  return { ok: true, data: patch };
}

/** Fields a LEAD may edit on a member in their own subteam (never role/active/email/subteam/password). */
export const LEAD_EDITABLE_FIELDS: readonly (keyof MemberUpdateInput)[] = [
  "name",
  "photoUrl",
];
