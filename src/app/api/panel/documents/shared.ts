import type { DocumentDocument } from "@/models/Document";
import type { Document as DocumentType, DocumentCategory } from "@/types";

/**
 * Shared helpers for the panel documents endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 */

export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  "cad",
  "report",
  "presentation",
  "media",
  "other",
];

const LIMITS = {
  title: 200,
  fileUrl: 2048,
  subteam: 120,
} as const;

/** Map a Mongoose document to the shared `Document` API shape. */
export function toDocument(
  doc: DocumentDocument & { _id: unknown },
): DocumentType {
  return {
    id: String(doc._id),
    title: doc.title,
    fileUrl: doc.fileUrl,
    category: doc.category as DocumentCategory,
    subteam: doc.subteam ?? undefined,
    uploadedBy: doc.uploadedBy,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

/** Client-writable document fields (never `uploadedBy` / `id` / timestamps). */
export interface DocumentWritable {
  title: string;
  fileUrl: string;
  category: DocumentCategory;
  subteam?: string;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * `fileUrl` must be a valid http(s) URL. NOTE: this is metadata only — the real
 * file upload (Cloudflare R2 presigned URL + MIME/size validation) is deferred
 * to Faz 3. TODO(Faz3).
 */
function checkFileUrl(
  value: unknown,
): { ok: true; value: string } | { ok: false; error: string } {
  if (!isNonEmptyString(value) || value.length > LIMITS.fileUrl) {
    return { ok: false, error: "Field fileUrl is required." };
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "fileUrl must be a valid URL." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, error: "fileUrl must be an http(s) URL." };
  }
  return { ok: true, value: value.trim() };
}

function checkCategory(
  value: unknown,
): { ok: true; value: DocumentCategory } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: "other" };
  if (!DOCUMENT_CATEGORIES.includes(value as never)) {
    return { ok: false, error: "Invalid category." };
  }
  return { ok: true, value: value as DocumentCategory };
}

function checkOptionalSubteam(
  value: unknown,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: "Invalid subteam." };
  }
  if (value.length > LIMITS.subteam) {
    return { ok: false, error: "subteam is too long." };
  }
  return { ok: true, value: value.trim() };
}

/**
 * Minimal server-side validation for CREATE (POST).
 *
 * TODO(2.Q): replace with an authoritative panel-document zod schema owned by
 * Security & QA (`@/lib/validation`, task 2.Q0). Hand-rolled checks for now.
 */
export function validateCreate(
  body: unknown,
): ValidateResult<DocumentWritable> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.title) || b.title.length > LIMITS.title) {
    return { ok: false, error: "Field title is required." };
  }
  const fileUrl = checkFileUrl(b.fileUrl);
  if (!fileUrl.ok) return fileUrl;

  const category = checkCategory(b.category);
  if (!category.ok) return category;

  const subteam = checkOptionalSubteam(b.subteam);
  if (!subteam.ok) return subteam;

  return {
    ok: true,
    data: {
      title: b.title.trim(),
      fileUrl: fileUrl.value,
      category: category.value,
      subteam: subteam.value,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH): every field optional, at
 * least one present.
 *
 * TODO(2.Q): replace with the shared panel-document zod schema (see above).
 */
export function validateUpdate(
  body: unknown,
): ValidateResult<Partial<DocumentWritable>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const patch: Partial<DocumentWritable> = {};

  if (b.title !== undefined) {
    if (!isNonEmptyString(b.title) || b.title.length > LIMITS.title) {
      return { ok: false, error: "Invalid title." };
    }
    patch.title = b.title.trim();
  }
  if (b.fileUrl !== undefined) {
    const r = checkFileUrl(b.fileUrl);
    if (!r.ok) return r;
    patch.fileUrl = r.value;
  }
  if (b.category !== undefined) {
    const r = checkCategory(b.category);
    if (!r.ok) return r;
    patch.category = r.value;
  }
  if ("subteam" in b) {
    const r = checkOptionalSubteam(b.subteam);
    if (!r.ok) return r;
    patch.subteam = r.value;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No updatable fields provided." };
  }

  return { ok: true, data: patch };
}
