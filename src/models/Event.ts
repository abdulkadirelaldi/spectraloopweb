import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for calendar events / deadlines.
 *
 * Domain shape lives in `@/types` (`Event`, `EventType`). Events are NOT
 * subteam-scoped — reads are open to all authenticated users (see route).
 */
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: ["meeting", "deadline", "competition", "workshop", "other"],
      default: "other",
    },
    description: { type: String, trim: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type EventDocument = InferSchemaType<typeof eventSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const EventModel: Model<EventDocument> =
  (mongoose.models.Event as Model<EventDocument>) ??
  mongoose.model<EventDocument>("Event", eventSchema);
