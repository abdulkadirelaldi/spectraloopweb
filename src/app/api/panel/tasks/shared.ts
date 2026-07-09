import type { TaskDocument } from "@/models/Task";
import type { Task as TaskType, TaskStatus } from "@/types";

/**
 * Shared helpers for the panel tasks endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 2.B6);
 * this file only holds the response serializer.
 */

/** Map a Mongoose document to the shared `Task` API shape. */
export function toTask(doc: TaskDocument & { _id: unknown }): TaskType {
  return {
    id: String(doc._id),
    title: doc.title,
    description: doc.description ?? undefined,
    subteam: doc.subteam ?? undefined,
    assigneeId: doc.assigneeId ?? undefined,
    status: doc.status as TaskStatus,
    dueDate: doc.dueDate ? (doc.dueDate as Date).toISOString() : undefined,
    createdBy: doc.createdBy,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}
