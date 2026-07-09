import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiSession } from "@/lib/auth/guard";
import { DocumentModel, type DocumentDocument } from "@/models/Document";
import { toDocument } from "../shared";
import { panelDocumentUpdateSchema, firstErrorMessage } from "@/lib/validation";

/**
 * Single panel document — /api/panel/documents/[id]
 *
 * GET    — read one. Any authenticated user (reads open).
 * PATCH  — update. admin (any) or lead (own-subteam docs only; cannot move to
 *          another subteam). member → 403.
 * DELETE — admin (any) or lead (own subteam). member → 403.
 *
 * See ../README.md for the full RBAC + IDOR contract.
 */

type Ctx = { params: Promise<{ id: string }> };

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid document id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Document not found." },
    { status: 404 },
  );
}

function forbidden(error = "Forbidden"): Response {
  return Response.json({ ok: false, error }, { status: 403 });
}

export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const doc = await DocumentModel.findById(id).lean<
      (DocumentDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    return Response.json({ ok: true, document: toDocument(doc) });
  } catch (err) {
    console.error("[panel/documents/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load document." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { role, subteam: ownSubteam } = gate.session.user;
  if (role === "member") return forbidden("Members cannot edit documents.");

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

  const parsed = panelDocumentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  try {
    await connectToDatabase();
    const target = await DocumentModel.findById(id).lean<
      (DocumentDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    if (role === "lead") {
      if (!ownSubteam || target.subteam !== ownSubteam) {
        return forbidden(
          "A lead can only edit documents in their own subteam.",
        );
      }
      if (patch.subteam !== undefined && patch.subteam !== ownSubteam) {
        return forbidden("A lead cannot move a document to another subteam.");
      }
    }

    const updated = await DocumentModel.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean<(DocumentDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, document: toDocument(updated) });
  } catch (err) {
    console.error("[panel/documents/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update document." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { role, subteam: ownSubteam } = gate.session.user;
  if (role === "member") return forbidden("Members cannot delete documents.");

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const target = await DocumentModel.findById(id).lean<
      (DocumentDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    if (role === "lead" && (!ownSubteam || target.subteam !== ownSubteam)) {
      return forbidden(
        "A lead can only delete documents in their own subteam.",
      );
    }

    await DocumentModel.findByIdAndDelete(id);
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/documents/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete document." },
      { status: 500 },
    );
  }
}
