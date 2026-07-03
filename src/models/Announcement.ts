import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for announcements / news.
 *
 * Domain shape lives in `@/types` (`Announcement`, `AnnouncementAudience`). This
 * schema is the persistence counterpart; keep the two in sync (field names +
 * audience values) — changes to `src/types` go through the chief.
 *
 * SECURITY NOTE: `publishedToPublic` is the boundary between panel-only
 * announcements and what the public site may read. The public GET endpoint MUST
 * filter on `publishedToPublic: true`.
 */
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ["all", "leads", "admins"],
      default: "all",
    },
    // User id of the author (FK -> User.id). Kept as a plain string for now;
    // becomes a real ref once the User model lands (Faz 2).
    authorId: { type: String, required: true, trim: true },
    publishedToPublic: { type: Boolean, default: false },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type AnnouncementDocument = InferSchemaType<typeof announcementSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const Announcement: Model<AnnouncementDocument> =
  (mongoose.models.Announcement as Model<AnnouncementDocument>) ??
  mongoose.model<AnnouncementDocument>("Announcement", announcementSchema);
