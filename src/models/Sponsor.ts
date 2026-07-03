import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for sponsors.
 *
 * Domain shape lives in `@/types` (`Sponsor`, `SponsorTier`). This schema is the
 * persistence counterpart; keep the two in sync (field names + tier values) —
 * changes to `src/types` go through the chief.
 */
const sponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, required: true, trim: true },
    tier: {
      type: String,
      enum: ["gold", "silver", "bronze"],
      required: true,
    },
    website: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type SponsorDocument = InferSchemaType<typeof sponsorSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const Sponsor: Model<SponsorDocument> =
  (mongoose.models.Sponsor as Model<SponsorDocument>) ??
  mongoose.model<SponsorDocument>("Sponsor", sponsorSchema);
