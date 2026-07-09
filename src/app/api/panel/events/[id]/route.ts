import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { EventModel, type EventDocument } from "@/models/Event";
import { toEvent } from "../shared";
import { panelEventUpdateSchema, firstErrorMessage } from "@/lib/validation";

/**
 * Single panel event — /api/panel/events/[id]
 *
 * GET    — read one. Any authenticated user (reads open).
 * PATCH  — update. admin + lead only.
 * DELETE — delete. admin + lead only.
 *
 * Events are not subteam-scoped, so there is no per-subteam IDOR check.
 * See ../README.md.
 */

type Ctx = { params: Promise<{ id: string }> };

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid event id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Event not found." },
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
    const doc = await EventModel.findById(id).lean<
      (EventDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    return Response.json({ ok: true, event: toEvent(doc) });
  } catch (err) {
    console.error("[panel/events/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load event." },
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

  const parsed = panelEventUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const updated = await EventModel.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean<(EventDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, event: toEvent(updated) });
  } catch (err) {
    console.error("[panel/events/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update event." },
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
    const deleted = await EventModel.findByIdAndDelete(id).lean();
    if (!deleted) return notFound();

    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/events/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete event." },
      { status: 500 },
    );
  }
}
