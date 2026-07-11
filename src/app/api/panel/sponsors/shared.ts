import type { SponsorDocument } from "@/models/Sponsor";
import type { Sponsor as SponsorType, SponsorTier } from "@/types";

/**
 * Shared helpers for the panel sponsors endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 */

export const SPONSOR_TIERS: readonly SponsorTier[] = [
  "gold",
  "silver",
  "bronze",
];

const LIMITS = {
  name: 200,
  logoUrl: 2048,
  website: 2048,
} as const;

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

/** Client-writable sponsor fields (never `id` / timestamps). */
export interface SponsorWritable {
  name: string;
  logoUrl: string;
  tier: SponsorTier;
  website?: string;
  active: boolean;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Require a valid http(s) URL within `max`. */
function checkUrl(
  value: unknown,
  max: number,
  label: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (!isNonEmptyString(value) || value.length > max) {
    return { ok: false, error: `Field ${label} is required.` };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: `${label} must be a valid URL.` };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: `${label} must be an http(s) URL.` };
  }
  return { ok: true, value: value.trim() };
}

/** Optional http(s) URL (omit to skip). */
function checkOptionalUrl(
  value: unknown,
  max: number,
  label: string,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  return checkUrl(value, max, label);
}

function checkTier(
  value: unknown,
): { ok: true; value: SponsorTier } | { ok: false; error: string } {
  if (!SPONSOR_TIERS.includes(value as never)) {
    return { ok: false, error: "Invalid tier." };
  }
  return { ok: true, value: value as SponsorTier };
}

/**
 * Minimal server-side validation for CREATE (POST).
 *
 * TODO(3.Q): replace with an authoritative panel-sponsor zod schema owned by
 * Security & QA (`@/lib/validation`, task 3.Q0). Hand-rolled for now.
 */
export function validateCreate(body: unknown): ValidateResult<SponsorWritable> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.name) || b.name.length > LIMITS.name) {
    return { ok: false, error: "Field name is required." };
  }

  const logoUrl = checkUrl(b.logoUrl, LIMITS.logoUrl, "logoUrl");
  if (!logoUrl.ok) return logoUrl;

  const tier = checkTier(b.tier);
  if (!tier.ok) return tier;

  const website = checkOptionalUrl(b.website, LIMITS.website, "website");
  if (!website.ok) return website;

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
      logoUrl: logoUrl.value,
      tier: tier.value,
      website: website.value,
      active,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH): every field optional, at
 * least one present. `active` is the CMS publish/unpublish toggle.
 *
 * TODO(3.Q): replace with the shared panel-sponsor zod schema (see above).
 */
export function validateUpdate(
  body: unknown,
): ValidateResult<Partial<SponsorWritable>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const patch: Partial<SponsorWritable> = {};

  if (b.name !== undefined) {
    if (!isNonEmptyString(b.name) || b.name.length > LIMITS.name) {
      return { ok: false, error: "Invalid name." };
    }
    patch.name = b.name.trim();
  }
  if (b.logoUrl !== undefined) {
    const r = checkUrl(b.logoUrl, LIMITS.logoUrl, "logoUrl");
    if (!r.ok) return r;
    patch.logoUrl = r.value;
  }
  if (b.tier !== undefined) {
    const r = checkTier(b.tier);
    if (!r.ok) return r;
    patch.tier = r.value;
  }
  if ("website" in b) {
    const r = checkOptionalUrl(b.website, LIMITS.website, "website");
    if (!r.ok) return r;
    patch.website = r.value;
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
