import type { AnnouncementDocument } from "@/models/Announcement";
import type {
  Announcement as AnnouncementType,
  AnnouncementAudience,
} from "@/types";

/**
 * Shared helpers for the panel announcements endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 2.B6);
 * this file only holds the response serializer.
 */

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
