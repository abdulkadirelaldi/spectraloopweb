import mongoose, { type InferSchemaType, type Model } from "mongoose";

/**
 * Mongoose schema for tasks (panel work items).
 *
 * Domain shape lives in `@/types` (`Task`, `TaskStatus`). Keep field names +
 * status values in sync with `@/types` (changes to `src/types` go through the
 * chief). Tasks are subteam-scoped — `subteam` and `assigneeId` are indexed to
 * support the panel's role-based filtering.
 */
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    // Subteam id this task belongs to (FK -> Subteam.id).
    subteam: { type: String, trim: true, index: true },
    // User id of the assignee (FK -> User.id). Optional when unassigned.
    assigneeId: { type: String, trim: true, index: true },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "done"],
      default: "todo",
    },
    dueDate: { type: Date },
    // User id of the creator (FK -> User.id).
    createdBy: { type: String, required: true, trim: true },
  },
  {
    // `createdAt` (and `updatedAt`) managed automatically by Mongoose.
    timestamps: true,
  },
);

export type TaskDocument = InferSchemaType<typeof taskSchema>;

/**
 * Hot-reload-safe model definition (see Application.ts for the rationale).
 */
export const Task: Model<TaskDocument> =
  (mongoose.models.Task as Model<TaskDocument>) ??
  mongoose.model<TaskDocument>("Task", taskSchema);
