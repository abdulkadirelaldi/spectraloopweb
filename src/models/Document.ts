import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for documents (panel file archive — metadata only).
 *
 * Domain shape lives in `@/types` (`Document`, `DocumentCategory`). `fileUrl` is
 * stored as a plain string (a pre-uploaded / external URL). Real file upload
 * (Cloudflare R2 presigned URLs + type/size checks) is deferred to Faz 3 —
 * TODO(Faz3). Subteam-scoped, so `subteam` is indexed.
 */
const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // Pre-uploaded / external URL. TODO(Faz3): replace with R2 upload flow.
    fileUrl: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["cad", "report", "presentation", "media", "other"],
      default: "other",
    },
    // Subteam id this document belongs to (FK -> Subteam.id).
    subteam: { type: String, trim: true, index: true },
    // User id of the uploader (FK -> User.id).
    uploadedBy: { type: String, required: true, trim: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type DocumentDocument = InferSchemaType<typeof documentSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const DocumentModel: Model<DocumentDocument> =
  (mongoose.models.Document as Model<DocumentDocument>) ??
  mongoose.model<DocumentDocument>("Document", documentSchema);
