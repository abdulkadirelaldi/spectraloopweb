import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for team members / panel users.
 *
 * Domain shape lives in `@/types` (`User`, `Role`). This schema is the
 * persistence counterpart and additionally stores the auth secret
 * (`passwordHash`), which is intentionally NOT part of the shared `User` type —
 * see `src/types/user.ts`. Keep field names + role values in sync with `@/types`
 * (changes to `src/types` go through the chief).
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    // Auth secret. `select: false` keeps it out of query results by default;
    // Auth.js authorize() must opt in with `.select("+passwordHash")`.
    passwordHash: { type: String, select: false },
    role: {
      type: String,
      enum: ["admin", "lead", "member"],
      default: "member",
    },
    // Subteam id this user belongs to (FK -> Subteam.id). Optional (e.g. admins).
    subteam: { type: String, trim: true },
    photoUrl: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", userSchema);
