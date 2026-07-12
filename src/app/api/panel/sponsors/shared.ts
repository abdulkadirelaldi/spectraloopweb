import type { SponsorDocument } from "@/models/Sponsor";
import type { Sponsor as SponsorType, SponsorTier } from "@/types";

/**
 * Shared helpers for the panel sponsors endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 3.B6);
 * this file only holds the response serializer.
 */

/** Map a Mongoose document to the shared `Sponsor` API shape. */
export function toSponsor(
  doc: SponsorDocument & { _id: unknown },
): SponsorType {
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
