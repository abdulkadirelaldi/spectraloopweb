import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { Sponsor, type SponsorDocument } from "@/models/Sponsor";
import { toSponsor, validateUpdate } from "../shared";

/**
 * Single panel sponsor — /api/panel/sponsors/[id] (CMS)
 *
 * GET    — read one. Any authenticated panel user.
 * PATCH  — update (incl. the `active` publish toggle). **admin only.**
 * DELETE — delete. **admin only.**
 *
 * Every mutation on-demand revalidates the PUBLIC feed (`/api/sponsors`).
 * See ../README.md for the full contract.
 */

type Ctx = { params: Promise<{ id: string }> };

/** On-demand invalidate the public sponsors feed after a change. */
function revalidatePublicSponsors(): void {
  try {
    revalidatePath("/api/sponsors");
  } catch {
    // no-op if called outside a request scope
  }
}

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid sponsor id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Sponsor not found." },
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
    const doc = await Sponsor.findById(id).lean<
      (SponsorDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    return Response.json({ ok: true, sponsor: toSponsor(doc) });
  } catch (err) {
    console.error("[panel/sponsors/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load sponsor." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin"]);
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
    const updated = await Sponsor.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean<(SponsorDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    // A sponsor change (incl. active toggle) may affect the public feed.
    revalidatePublicSponsors();

    return Response.json({ ok: true, sponsor: toSponsor(updated) });
  } catch (err) {
    console.error("[panel/sponsors/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update sponsor." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin"]);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const deleted = await Sponsor.findByIdAndDelete(id).lean();
    if (!deleted) return notFound();

    revalidatePublicSponsors();
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/sponsors/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete sponsor." },
      { status: 500 },
    );
  }
}
