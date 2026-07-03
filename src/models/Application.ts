import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for "Bize Katıl" (Join Us) applications.
 *
 * Domain shape lives in `@/types` (`Application`, `ApplicationInput`,
 * `ApplicationStatus`). This schema is the persistence counterpart; keep the two
 * in sync (field names + status values) — changes to `src/types` go through the
 * chief.
 */
const applicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subteamPref: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "reviewing", "accepted", "rejected"],
      default: "new",
    },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type ApplicationDocument = InferSchemaType<typeof applicationSchema>;

/**
 * Hot-reload-safe model definition. In Next.js dev, modules are re-evaluated
 * repeatedly; re-calling `mongoose.model("Application", ...)` would throw
 * `OverwriteModelError`, so reuse the already-compiled model when present.
 */
export const Application: Model<ApplicationDocument> =
  (mongoose.models.Application as Model<ApplicationDocument>) ??
  mongoose.model<ApplicationDocument>("Application", applicationSchema);
