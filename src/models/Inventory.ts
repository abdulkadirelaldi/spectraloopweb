import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for inventory / stock items (Faz 3).
 *
 * Domain shape lives in `@/types` (`Inventory`, `InventoryStatus`). Subteam-scoped
 * like tasks/documents; `category`, `subteam`, `status` are indexed to support
 * the panel's filtering. Keep field names + status values in sync with `@/types`.
 */
const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    // Subteam id this item belongs to (FK -> Subteam.id).
    subteam: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: ["available", "in-use", "maintenance", "depleted"],
      default: "available",
      index: true,
    },
    notes: { type: String, trim: true },
    // User id of the creator (FK -> User.id).
    createdBy: { type: String, required: true, trim: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type InventoryDocument = InferSchemaType<typeof inventorySchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const Inventory: Model<InventoryDocument> =
  (mongoose.models.Inventory as Model<InventoryDocument>) ??
  mongoose.model<InventoryDocument>("Inventory", inventorySchema);
