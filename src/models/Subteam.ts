import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for subteams / discipline groups.
 *
 * Domain shape lives in `@/types` (`Subteam`). Keep field names in sync with
 * `@/types` (changes to `src/types` go through the chief).
 */
const subteamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: { type: String, trim: true },
    // User id of the subteam lead (FK -> User.id). Optional.
    leadUserId: { type: String, trim: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type SubteamDocument = InferSchemaType<typeof subteamSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const Subteam: Model<SubteamDocument> =
  (mongoose.models.Subteam as Model<SubteamDocument>) ??
  mongoose.model<SubteamDocument>("Subteam", subteamSchema);
