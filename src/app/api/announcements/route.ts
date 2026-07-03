import { connectToDatabase } from "@/lib/db/connect";
import { Announcement, type AnnouncementDocument } from "@/models/Announcement";
import type {
  Announcement as AnnouncementType,
  AnnouncementAudience,
} from "@/types";

/**
 * GET /api/announcements
 *
 * Public, read-only endpoint. Returns only announcements published to the
 * public site, newest first. Consumed by the Haberler/Medya page (1.6) and,
 * later, the Ana Sayfa.
 *
 * SECURITY: only `publishedToPublic: true` records are returned — panel-only /
 * draft announcements must never leak to the public.
 *
 * See ./README.md for the full response contract.
 */

// Public data changes rarely — cache the response and revalidate every 5 min.
export const revalidate = 300;

/** Map a Mongoose document to the shared `Announcement` API shape. */
function toAnnouncement(
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

export async function GET(): Promise<Response> {
  try {
    await connectToDatabase();

    const docs = await Announcement.find({ publishedToPublic: true })
      .sort({ createdAt: -1 }) // newest first
      .lean<(AnnouncementDocument & { _id: unknown })[]>();

    const announcements = docs.map(toAnnouncement);

    return Response.json({ ok: true, announcements });
  } catch (err) {
    // Log server-side; never leak DB/internal details to the client.
    console.error("[announcements] Failed to load announcements:", err);
    return Response.json(
      { ok: false, error: "Could not load announcements." },
      { status: 500 },
    );
  }
}
