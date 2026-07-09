import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { User, type UserDocument } from "@/models/User";
import { hashPassword } from "@/lib/utils/password";
import { toMember } from "./shared";
import {
  panelMemberCreateSchema,
  firstErrorMessage,
  ROLES,
} from "@/lib/validation";

/**
 * Panel members collection — /api/panel/members
 *
 * GET  — member directory. Any authenticated user (member+) reads it, via a SAFE
 *        projection (never `passwordHash`; `email` only for admin/lead — see
 *        README field-visibility policy).
 * POST — create a member. **admin only** (new user + role assignment). Passwords
 *        are hashed with bcrypt; a plaintext password is never stored or logged.
 *
 * See ./README.md for the full RBAC + security contract.
 */

/** Escape user input before using it in a RegExp (avoids injection / ReDoS). */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  // Field-visibility policy: only admin + lead may see member emails.
  const includeEmail = gate.session.user.role !== "member";

  const { searchParams } = new URL(request.url);
  const filter: Record<string, unknown> = {};

  const subteam = searchParams.get("subteam");
  if (subteam) filter.subteam = subteam;

  const role = searchParams.get("role");
  if (role) {
    if (!ROLES.includes(role as never)) {
      return Response.json(
        { ok: false, error: "Invalid role filter." },
        { status: 400 },
      );
    }
    filter.role = role;
  }

  const active = searchParams.get("active");
  if (active === "true") filter.active = true;
  else if (active === "false") filter.active = false;

  const q = searchParams.get("q");
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    // Search name always; include email only when the viewer may see it.
    filter.$or = includeEmail ? [{ name: rx }, { email: rx }] : [{ name: rx }];
  }

  try {
    await connectToDatabase();
    const docs = await User.find(filter)
      .sort({ name: 1 })
      .lean<(UserDocument & { _id: unknown })[]>();

    return Response.json({
      ok: true,
      members: docs.map((d) => toMember(d, includeEmail)),
    });
  } catch (err) {
    console.error("[panel/members] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load members." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  // Creating a member (and assigning a role) is admin-only.
  const gate = await requireApiRole(["admin"]);
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = panelMemberCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  // Hash the plaintext password (if any) — never persist/log the plaintext.
  const { password, ...rest } = parsed.data;
  const passwordHash = password ? await hashPassword(password) : undefined;

  try {
    await connectToDatabase();
    const created = await User.create({ ...rest, passwordHash });

    return Response.json(
      // Actor is an admin → allowed to see the email in the response.
      {
        ok: true,
        member: toMember(created as UserDocument & { _id: unknown }, true),
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    // Duplicate email (unique index) → 409 Conflict, generic message.
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: number }).code === 11000
    ) {
      return Response.json(
        { ok: false, error: "A user with this email already exists." },
        { status: 409 },
      );
    }
    console.error("[panel/members] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create member." },
      { status: 500 },
    );
  }
}
