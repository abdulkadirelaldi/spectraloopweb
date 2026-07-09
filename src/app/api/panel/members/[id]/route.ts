import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { User, type UserDocument } from "@/models/User";
import { hashPassword } from "@/lib/utils/password";
import { LEAD_EDITABLE_FIELDS, toMember } from "../shared";
import {
  panelMemberUpdateSchema,
  firstErrorMessage,
  type PanelMemberUpdate,
} from "@/lib/validation";

/**
 * Single panel member — /api/panel/members/[id]
 *
 * PATCH  — update. Role-scoped:
 *            • admin → any field (role/active included) + password reset.
 *            • lead  → ONLY `name`/`photoUrl` of a member in their OWN subteam.
 *                      Never role/active/email/subteam/password (priv-esc guard).
 *            • member → 403.
 * DELETE — soft-delete (sets `active:false`). **admin only.**
 *
 * Safety: role changes and (de)activation are admin-only, and the API refuses to
 * remove the LAST active admin (self-lockout guard). See ../README.md.
 */

type Ctx = { params: Promise<{ id: string }> };

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid member id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Member not found." },
    { status: 404 },
  );
}

function forbidden(error = "Forbidden"): Response {
  return Response.json({ ok: false, error }, { status: 403 });
}

/** True if the patch would strip admin power (demote or deactivate) from a user. */
function removesAdminPower(patch: PanelMemberUpdate): boolean {
  return (
    (patch.role !== undefined && patch.role !== "admin") ||
    patch.active === false
  );
}

/** Count OTHER active admins (excluding `exceptId`). */
async function otherActiveAdmins(exceptId: string): Promise<number> {
  return User.countDocuments({
    role: "admin",
    active: true,
    _id: { $ne: exceptId },
  });
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const actor = gate.session.user;
  if (actor.role === "member") {
    return forbidden("Members cannot edit member records.");
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = panelMemberUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  try {
    await connectToDatabase();
    const target = await User.findById(id).lean<
      (UserDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    if (actor.role === "lead") {
      // Scope: a lead may only edit members of their own subteam.
      if (!actor.subteam || target.subteam !== actor.subteam) {
        return forbidden("A lead can only edit members of their own subteam.");
      }
      // Field allow-list: never role/active/email/subteam/password.
      const disallowed = Object.keys(patch).filter(
        (k) => !LEAD_EDITABLE_FIELDS.includes(k as keyof PanelMemberUpdate),
      );
      if (disallowed.length > 0) {
        return forbidden(`A lead cannot change: ${disallowed.join(", ")}.`);
      }
    }
    // admin: any field. Guard against removing the last active admin.
    else if (
      target.role === "admin" &&
      target.active &&
      removesAdminPower(patch) &&
      (await otherActiveAdmins(id)) === 0
    ) {
      return forbidden("Cannot demote or deactivate the last active admin.");
    }

    // Hash a password reset (admin only reaches here with a password).
    const { password, ...fields } = patch;
    const update: Record<string, unknown> = { ...fields };
    if (password) update.passwordHash = await hashPassword(password);

    const updated = await User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).lean<(UserDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    // Actor is admin/lead → allowed to see email.
    return Response.json({ ok: true, member: toMember(updated, true) });
  } catch (err: unknown) {
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
    console.error("[panel/members/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update member." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  // Soft-delete / deactivation is admin-only.
  const gate = await requireApiRole(["admin"]);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const target = await User.findById(id).lean<
      (UserDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    // Refuse to deactivate the last active admin (self-lockout guard).
    if (
      target.role === "admin" &&
      target.active &&
      (await otherActiveAdmins(id)) === 0
    ) {
      return forbidden("Cannot deactivate the last active admin.");
    }

    // Soft delete: preserve the record (FK references from tasks/announcements)
    // and just mark it inactive.
    const updated = await User.findByIdAndUpdate(
      id,
      { active: false },
      { new: true },
    ).lean<(UserDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, member: toMember(updated, true) });
  } catch (err) {
    console.error("[panel/members/:id] Failed to deactivate:", err);
    return Response.json(
      { ok: false, error: "Could not deactivate member." },
      { status: 500 },
    );
  }
}
