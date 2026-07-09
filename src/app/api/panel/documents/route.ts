import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { DocumentModel, type DocumentDocument } from "@/models/Document";
import { DOCUMENT_CATEGORIES, toDocument, validateCreate } from "./shared";

/**
 * Panel documents collection — /api/panel/documents
 *
 * GET  — list documents. Any authenticated user reads (member+). Optional query
 *        filters: `subteam`, `category`.
 * POST — create a document (metadata). admin + lead only. A lead's document is
 *        pinned to the lead's own subteam. `uploadedBy` = session user id.
 *
 * NOTE: documents here are METADATA only — `fileUrl` is a pre-uploaded/external
 * URL. Real upload (Cloudflare R2 presigned URL + type/size checks) is deferred
 * to Faz 3. TODO(Faz3). See ./README.md.
 */

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const filter: Record<string, string> = {};

  const subteam = searchParams.get("subteam");
  if (subteam) filter.subteam = subteam;

  const category = searchParams.get("category");
  if (category) {
    if (!DOCUMENT_CATEGORIES.includes(category as never)) {
      return Response.json(
        { ok: false, error: "Invalid category filter." },
        { status: 400 },
      );
    }
    filter.category = category;
  }

  try {
    await connectToDatabase();
    const docs = await DocumentModel.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .lean<(DocumentDocument & { _id: unknown })[]>();

    return Response.json({ ok: true, documents: docs.map(toDocument) });
  } catch (err) {
    console.error("[panel/documents] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load documents." },
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

  const parsed = validateCreate(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { role, subteam: ownSubteam } = gate.session.user;

  // Resolve the target subteam under role-based scoping (IDOR boundary).
  let subteam: string | undefined;
  if (role === "lead") {
    if (!ownSubteam) {
      return Response.json(
        { ok: false, error: "Lead has no subteam assigned." },
        { status: 403 },
      );
    }
    if (parsed.data.subteam && parsed.data.subteam !== ownSubteam) {
      return Response.json(
        {
          ok: false,
          error: "A lead can only add documents for their own subteam.",
        },
        { status: 403 },
      );
    }
    subteam = ownSubteam;
  } else {
    // admin: subteam optional (may be a cross-team / general document).
    subteam = parsed.data.subteam;
  }

  try {
    await connectToDatabase();
    const created = await DocumentModel.create({
      ...parsed.data,
      subteam,
      // uploadedBy is server-assigned from the session — never trusted from body.
      uploadedBy: gate.session.user.id,
    });

    return Response.json(
      {
        ok: true,
        document: toDocument(created as DocumentDocument & { _id: unknown }),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[panel/documents] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create document." },
      { status: 500 },
    );
  }
}
