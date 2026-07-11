import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for expenses / budget line items (Faz 3).
 *
 * Domain shape lives in `@/types` (`Expense`, `ExpenseStatus`). Subteam-scoped;
 * `subteam`, `status`, `date` are indexed to support panel filtering.
 * See `@/types` for the note on `amount` precision.
 */
const expenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, default: "TRY" },
    category: { type: String, required: true, trim: true },
    // Subteam id this expense belongs to (FK -> Subteam.id).
    subteam: { type: String, trim: true, index: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "reimbursed", "rejected"],
      default: "pending",
      index: true,
    },
    // User id of the submitter (FK -> User.id).
    submittedBy: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

expenseSchema.index({ date: -1 });

export type ExpenseDocument = InferSchemaType<typeof expenseSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const Expense: Model<ExpenseDocument> =
  (mongoose.models.Expense as Model<ExpenseDocument>) ??
  mongoose.model<ExpenseDocument>("Expense", expenseSchema);
