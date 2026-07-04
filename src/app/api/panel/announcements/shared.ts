import type { AnnouncementDocument } from "@/models/Announcement";
import type {
  Announcement as AnnouncementType,
  AnnouncementAudience,
} from "@/types";

/**
 * Shared helpers for the panel announcements endpoints (collection + [id]).
 *
 * NOTE: this is a colocated module (not `route.ts`), so Next.js does not treat
 * it as a route. It is imported by the sibling route handlers only.
 */

const AUDIENCES: readonly AnnouncementAudience[] = ["all", "leads", "admins"];

// Field length caps for panel input.
const LIMITS = {
  title: 200,
  body: 10000,
} as const;

/** Map a Mongoose document to the shared `Announcement` API shape. */
export function toAnnouncement(
  doc: AnnouncementDocument & { _id: unknown },
): AnnouncementType {
  return {
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    audience: doc.audience as AnnouncementAudience,
    authorId: doc.authorId,
    publishedToPublic: doc.publishedToPublic,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

/** Client-writable announcement fields (never `authorId` / `id` / timestamps). */
export interface AnnouncementWritable {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishedToPublic: boolean;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Minimal server-side validation for CREATE (POST).
 *
 * TODO(2.Q): replace with an authoritative panel-announcement zod schema owned
 * by Security & QA (in `@/lib/validation`), mirroring how public forms bind
 * `applicationSchema` / `contactSchema`. Kept as hand-rolled checks for now.
 */
export function validateCreate(
  body: unknown,
): ValidateResult<AnnouncementWritable> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const {
    title,
    body: text,
    audience,
    publishedToPublic,
  } = body as Record<string, unknown>;

  if (!isNonEmptyString(title) || !isNonEmptyString(text)) {
    return { ok: false, error: "Fields title and body are required." };
  }
  if (title.length > LIMITS.title || text.length > LIMITS.body) {
    return { ok: false, error: "Title or body exceeds the maximum length." };
  }
  if (audience !== undefined && !AUDIENCES.includes(audience as never)) {
    return { ok: false, error: "Invalid audience." };
  }
  if (
    publishedToPublic !== undefined &&
    typeof publishedToPublic !== "boolean"
  ) {
    return { ok: false, error: "publishedToPublic must be a boolean." };
  }

  return {
    ok: true,
    data: {
      title: title.trim(),
      body: text.trim(),
      audience: (audience as AnnouncementAudience) ?? "all",
      publishedToPublic: (publishedToPublic as boolean) ?? false,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH): every field optional, but
 * at least one must be present, and any present field must be valid.
 *
 * TODO(2.Q): replace with the shared panel-announcement zod schema (see above).
 */
export function validateUpdate(
  body: unknown,
): ValidateResult<Partial<AnnouncementWritable>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const {
    title,
    body: text,
    audience,
    publishedToPublic,
  } = body as Record<string, unknown>;

  const patch: Partial<AnnouncementWritable> = {};

  if (title !== undefined) {
    if (!isNonEmptyString(title) || title.length > LIMITS.title) {
      return { ok: false, error: "Invalid title." };
    }
    patch.title = title.trim();
  }
  if (text !== undefined) {
    if (!isNonEmptyString(text) || text.length > LIMITS.body) {
      return { ok: false, error: "Invalid body." };
    }
    patch.body = text.trim();
  }
  if (audience !== undefined) {
    if (!AUDIENCES.includes(audience as never)) {
      return { ok: false, error: "Invalid audience." };
    }
    patch.audience = audience as AnnouncementAudience;
  }
  if (publishedToPublic !== undefined) {
    if (typeof publishedToPublic !== "boolean") {
      return { ok: false, error: "publishedToPublic must be a boolean." };
    }
    patch.publishedToPublic = publishedToPublic;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No updatable fields provided." };
  }

  return { ok: true, data: patch };
}
