import type { DocumentDocument } from "@/models/Document";
import type { Document as DocumentType, DocumentCategory } from "@/types";

/**
 * Shared helpers for the panel documents endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 2.B6);
 * this file only holds the response serializer.
 */

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
