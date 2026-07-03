import { connectToDatabase } from "@/lib/db/connect";
import { Sponsor, type SponsorDocument } from "@/models/Sponsor";
import type { Sponsor as SponsorType, SponsorTier } from "@/types";

/**
 * GET /api/sponsors
 *
 * Public, read-only endpoint. Returns active sponsors ordered by tier
 * (gold → silver → bronze) so the Frontend (Ana Sayfa sponsor strip, 1.2, and
 * the Sponsorluk page) can render them without extra sorting.
 *
 * See ./README.md for the full response contract.
 */

// Public data changes rarely — cache the response and revalidate every 5 min.
export const revalidate = 300;

// Rank used to order tiers gold → silver → bronze.
const TIER_RANK: Record<SponsorTier, number> = {
  gold: 0,
  silver: 1,
  bronze: 2,
};

/** Map a Mongoose document to the shared `Sponsor` API shape. */
function toSponsor(doc: SponsorDocument & { _id: unknown }): SponsorType {
  return {
    id: String(doc._id),
    name: doc.name,
    logoUrl: doc.logoUrl,
    tier: doc.tier as SponsorTier,
    website: doc.website ?? undefined,
    active: doc.active,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();

    const docs = await Sponsor.find({ active: true }).lean<
      (SponsorDocument & { _id: unknown })[]
    >();

    const sponsors = docs
      .map(toSponsor)
      .sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);

    return Response.json({ ok: true, sponsors });
  } catch (err) {
    // Log server-side; never leak DB/internal details to the client.
    console.error("[sponsors] Failed to load sponsors:", err);
    return Response.json(
      { ok: false, error: "Could not load sponsors." },
      { status: 500 },
    );
  }
}
