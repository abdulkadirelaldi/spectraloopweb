import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { Sponsor, type SponsorDocument } from "@/models/Sponsor";
import { SPONSOR_TIERS, toSponsor, validateCreate } from "./shared";

/**
 * Panel sponsors collection — /api/panel/sponsors (CMS)
 *
 * GET  — list ALL sponsors (including `active:false`, unlike the public feed).
 *        Any authenticated panel user reads. Optional filters: `tier`, `active`.
 * POST — create a sponsor. **admin only** (org-level brand). member/lead → 403.
 *
 * CMS: `active` is the publish flag. After a mutation we on-demand revalidate the
 * PUBLIC feed (`/api/sponsors`) so changes surface without waiting out the 5-min
 * ISR window. The public GET (active:true, tier order, revalidate=300) is
 * untouched. `logoUrl` may be produced by the R2 upload flow (3.B4).
 *
 * See ./README.md for the full contract.
 */

/** On-demand invalidate the public sponsors feed after a change. */
function revalidatePublicSponsors(): void {
  try {
    revalidatePath("/api/sponsors");
  } catch {
    // no-op if called outside a request scope
  }
}

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const filter: Record<string, unknown> = {};

  const tier = searchParams.get("tier");
  if (tier) {
    if (!SPONSOR_TIERS.includes(tier as never)) {
      return Response.json(
        { ok: false, error: "Invalid tier filter." },
        { status: 400 },
      );
    }
    filter.tier = tier;
  }

  const active = searchParams.get("active");
  if (active === "true") filter.active = true;
  else if (active === "false") filter.active = false;

  try {
    await connectToDatabase();
    const docs = await Sponsor.find(filter)
      .sort({ createdAt: -1 }) // newest first (panel view)
      .lean<(SponsorDocument & { _id: unknown })[]>();

    return Response.json({ ok: true, sponsors: docs.map(toSponsor) });
  } catch (err) {
    console.error("[panel/sponsors] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load sponsors." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
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

  const parsed = validateCreate(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const created = await Sponsor.create(parsed.data);
    // Publish to the public feed if the new sponsor is active.
    if (created.active) revalidatePublicSponsors();

    return Response.json(
      {
        ok: true,
        sponsor: toSponsor(created as SponsorDocument & { _id: unknown }),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[panel/sponsors] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create sponsor." },
      { status: 500 },
    );
  }
}
