import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole } from "@/lib/auth/guard";
import { Application, type ApplicationDocument } from "@/models/Application";
import { toApplication } from "../shared";
import {
  panelApplicationStatusSchema,
  firstErrorMessage,
} from "@/lib/validation";

/**
 * Single panel application — /api/panel/applications/[id]
 *
 * GET    — read one. admin + lead.
 * PATCH  — update ONLY the review `status`. admin + lead. The application's
 *          content (name/email/subteamPref/message) is READ-ONLY.
 * DELETE — remove (spam cleanup). **admin only.**
 *
 * See ../README.md for the full RBAC + response contract.
 */

type Ctx = { params: Promise<{ id: string }> };

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid application id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Application not found." },
    { status: 404 },
  );
}

export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const doc = await Application.findById(id).lean<
      (ApplicationDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    return Response.json({ ok: true, application: toApplication(doc) });
  } catch (err) {
    console.error("[panel/applications/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load application." },
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

  const parsed = panelApplicationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    // Only `status` is written — the application content stays read-only.
    const updated = await Application.findByIdAndUpdate(
      id,
      { status: parsed.data.status },
      { new: true, runValidators: true },
    ).lean<(ApplicationDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, application: toApplication(updated) });
  } catch (err) {
    console.error("[panel/applications/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update application." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  // Deleting an application (spam cleanup) is admin-only.
  const gate = await requireApiRole(["admin"]);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const deleted = await Application.findByIdAndDelete(id).lean();
    if (!deleted) return notFound();

    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/applications/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete application." },
      { status: 500 },
    );
  }
}
