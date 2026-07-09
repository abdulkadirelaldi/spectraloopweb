import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { Announcement, type AnnouncementDocument } from "@/models/Announcement";
import { toAnnouncement } from "./shared";
import {
  panelAnnouncementCreateSchema,
  firstErrorMessage,
} from "@/lib/validation";

/**
 * Panel announcements collection — /api/panel/announcements
 *
 * GET  — list ALL announcements (no publishedToPublic filter). Any authenticated
 *        panel user (member+) may read.
 * POST — create an announcement. admin + lead only.
 *
 * This is the PANEL surface. The PUBLIC read endpoint (/api/announcements) is
 * separate and still returns only publishedToPublic:true — do not confuse them.
 *
 * See ./README.md for the full RBAC + response contract.
 */

export async function GET(): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  try {
    await connectToDatabase();
    const docs = await Announcement.find()
      .sort({ createdAt: -1 }) // newest first
      .lean<(AnnouncementDocument & { _id: unknown })[]>();

    return Response.json({ ok: true, announcements: docs.map(toAnnouncement) });
  } catch (err) {
    console.error("[panel/announcements] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load announcements." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
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

  const parsed = panelAnnouncementCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const created = await Announcement.create({
      ...parsed.data,
      // authorId is server-assigned from the session — never trusted from body.
      authorId: gate.session.user.id,
    });

    return Response.json(
      {
        ok: true,
        announcement: toAnnouncement(
          created as AnnouncementDocument & { _id: unknown },
        ),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[panel/announcements] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create announcement." },
      { status: 500 },
    );
  }
}
