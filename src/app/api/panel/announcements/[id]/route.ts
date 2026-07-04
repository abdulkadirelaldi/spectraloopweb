import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { Announcement, type AnnouncementDocument } from "@/models/Announcement";
import { toAnnouncement, validateUpdate } from "../shared";

/**
 * Single panel announcement — /api/panel/announcements/[id]
 *
 * GET    — read one. Any authenticated panel user (member+).
 * PATCH  — update fields. admin + lead only.
 * DELETE — remove. admin + lead only.
 *
 * See ../README.md for the full RBAC + response contract.
 *
 * IDOR note: admin AND lead may currently modify/delete ANY announcement. A
 * finer per-subteam/author restriction for leads is deferred — see README.
 */

type Ctx = { params: Promise<{ id: string }> };

/** 400 for a malformed id so a bad path can't reach the DB as a CastError. */
function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid announcement id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Announcement not found." },
    { status: 404 },
  );
}

export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const doc = await Announcement.findById(id).lean<
      (AnnouncementDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    return Response.json({ ok: true, announcement: toAnnouncement(doc) });
  } catch (err) {
    console.error("[panel/announcements/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load announcement." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

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

  const parsed = validateUpdate(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const updated = await Announcement.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean<(AnnouncementDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, announcement: toAnnouncement(updated) });
  } catch (err) {
    console.error("[panel/announcements/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update announcement." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const deleted = await Announcement.findByIdAndDelete(id).lean();
    if (!deleted) return notFound();

    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/announcements/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete announcement." },
      { status: 500 },
    );
  }
}
