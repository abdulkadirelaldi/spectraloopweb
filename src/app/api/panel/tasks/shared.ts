import type { TaskDocument } from "@/models/Task";
import type { Task as TaskType, TaskStatus } from "@/types";

/**
 * Shared helpers for the panel tasks endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 */

export const TASK_STATUSES: readonly TaskStatus[] = [
  "todo",
  "in-progress",
  "review",
  "done",
];

// Field length caps for panel input.
const LIMITS = {
  title: 200,
  description: 10000,
  subteam: 120,
  assigneeId: 64,
} as const;

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

/**
 * Client-writable task fields (never `createdBy` / `id` / timestamps).
 * `subteam` scoping by role is enforced in the route, not here.
 */
export interface TaskWritable {
  title: string;
  description?: string;
  subteam?: string;
  assigneeId?: string;
  status: TaskStatus;
  dueDate?: Date;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/** Validate an optional string field: must be a string within `max` if present. */
function checkOptionalString(
  value: unknown,
  max: number,
  label: string,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `Invalid ${label}.` };
  }
  if (value.length > max) return { ok: false, error: `${label} is too long.` };
  return { ok: true, value: value.trim() };
}

/** Validate an optional ISO date string, returning a `Date`. */
function checkOptionalDate(
  value: unknown,
): { ok: true; value?: Date } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== "string")
    return { ok: false, error: "Invalid dueDate." };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid dueDate." };
  }
  return { ok: true, value: d };
}

/**
 * Minimal server-side validation for CREATE (POST).
 *
 * TODO(2.Q): replace with an authoritative panel-task zod schema owned by
 * Security & QA (in `@/lib/validation`, task 2.Q0), mirroring how public forms
 * bind `applicationSchema` / `contactSchema`. Hand-rolled checks for now.
 */
export function validateCreate(body: unknown): ValidateResult<TaskWritable> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.title)) {
    return { ok: false, error: "Field title is required." };
  }
  if (b.title.length > LIMITS.title) {
    return { ok: false, error: "title is too long." };
  }

  const description = checkOptionalString(
    b.description,
    LIMITS.description,
    "description",
  );
  if (!description.ok) return description;

  const subteam = checkOptionalString(b.subteam, LIMITS.subteam, "subteam");
  if (!subteam.ok) return subteam;

  const assigneeId = checkOptionalString(
    b.assigneeId,
    LIMITS.assigneeId,
    "assigneeId",
  );
  if (!assigneeId.ok) return assigneeId;

  const dueDate = checkOptionalDate(b.dueDate);
  if (!dueDate.ok) return dueDate;

  let status: TaskStatus = "todo";
  if (b.status !== undefined) {
    if (!TASK_STATUSES.includes(b.status as never)) {
      return { ok: false, error: "Invalid status." };
    }
    status = b.status as TaskStatus;
  }

  return {
    ok: true,
    data: {
      title: b.title.trim(),
      description: description.value,
      subteam: subteam.value,
      assigneeId: assigneeId.value,
      status,
      dueDate: dueDate.value,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH): every field optional, but
 * at least one must be present, and any present field must be valid.
 *
 * TODO(2.Q): replace with the shared panel-task zod schema (see above).
 */
export function validateUpdate(
  body: unknown,
): ValidateResult<Partial<TaskWritable>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const patch: Partial<TaskWritable> = {};

  if (b.title !== undefined) {
    if (!isNonEmptyString(b.title) || b.title.length > LIMITS.title) {
      return { ok: false, error: "Invalid title." };
    }
    patch.title = b.title.trim();
  }

  if ("description" in b) {
    const r = checkOptionalString(
      b.description,
      LIMITS.description,
      "description",
    );
    if (!r.ok) return r;
    patch.description = r.value;
  }

  if ("subteam" in b) {
    const r = checkOptionalString(b.subteam, LIMITS.subteam, "subteam");
    if (!r.ok) return r;
    patch.subteam = r.value;
  }

  if ("assigneeId" in b) {
    const r = checkOptionalString(
      b.assigneeId,
      LIMITS.assigneeId,
      "assigneeId",
    );
    if (!r.ok) return r;
    patch.assigneeId = r.value;
  }

  if ("dueDate" in b) {
    const r = checkOptionalDate(b.dueDate);
    if (!r.ok) return r;
    patch.dueDate = r.value;
  }

  if (b.status !== undefined) {
    if (!TASK_STATUSES.includes(b.status as never)) {
      return { ok: false, error: "Invalid status." };
    }
    patch.status = b.status as TaskStatus;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No updatable fields provided." };
  }

  return { ok: true, data: patch };
}
