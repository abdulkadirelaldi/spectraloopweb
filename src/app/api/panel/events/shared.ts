import type { EventDocument } from "@/models/Event";
import type { Event as EventType, EventType as EventKind } from "@/types";

/**
 * Shared helpers for the panel events endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Events are NOT subteam-scoped: reads are open to all authenticated users;
 * writes require admin/lead.
 */

export const EVENT_TYPES: readonly EventKind[] = [
  "meeting",
  "deadline",
  "competition",
  "workshop",
  "other",
];

const LIMITS = {
  title: 200,
  description: 10000,
} as const;

/** Map a Mongoose document to the shared `Event` API shape. */
export function toEvent(doc: EventDocument & { _id: unknown }): EventType {
  return {
    id: String(doc._id),
    title: doc.title,
    date: (doc.date as Date).toISOString(),
    type: doc.type as EventKind,
    description: doc.description ?? undefined,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

/** Client-writable event fields (never `id` / timestamps). */
export interface EventWritable {
  title: string;
  date: Date;
  type: EventKind;
  description?: string;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function checkDate(
  value: unknown,
): { ok: true; value: Date } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: "Field date is required (ISO string)." };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid date." };
  }
  return { ok: true, value: d };
}

function checkType(
  value: unknown,
): { ok: true; value: EventKind } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: "other" };
  if (!EVENT_TYPES.includes(value as never)) {
    return { ok: false, error: "Invalid event type." };
  }
  return { ok: true, value: value as EventKind };
}

function checkOptionalDescription(
  value: unknown,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: "Invalid description." };
  }
  if (value.length > LIMITS.description) {
    return { ok: false, error: "description is too long." };
  }
  return { ok: true, value: value.trim() };
}

/**
 * Minimal server-side validation for CREATE (POST).
 *
 * TODO(2.Q): replace with an authoritative panel-event zod schema owned by
 * Security & QA (`@/lib/validation`, task 2.Q0). Hand-rolled checks for now.
 */
export function validateCreate(body: unknown): ValidateResult<EventWritable> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.title) || b.title.length > LIMITS.title) {
    return { ok: false, error: "Field title is required." };
  }
  const date = checkDate(b.date);
  if (!date.ok) return date;

  const type = checkType(b.type);
  if (!type.ok) return type;

  const description = checkOptionalDescription(b.description);
  if (!description.ok) return description;

  return {
    ok: true,
    data: {
      title: b.title.trim(),
      date: date.value,
      type: type.value,
      description: description.value,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH): every field optional, at
 * least one present.
 *
 * TODO(2.Q): replace with the shared panel-event zod schema (see above).
 */
export function validateUpdate(
  body: unknown,
): ValidateResult<Partial<EventWritable>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const patch: Partial<EventWritable> = {};

  if (b.title !== undefined) {
    if (!isNonEmptyString(b.title) || b.title.length > LIMITS.title) {
      return { ok: false, error: "Invalid title." };
    }
    patch.title = b.title.trim();
  }
  if (b.date !== undefined) {
    const r = checkDate(b.date);
    if (!r.ok) return r;
    patch.date = r.value;
  }
  if (b.type !== undefined) {
    const r = checkType(b.type);
    if (!r.ok) return r;
    patch.type = r.value;
  }
  if ("description" in b) {
    const r = checkOptionalDescription(b.description);
    if (!r.ok) return r;
    patch.description = r.value;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No updatable fields provided." };
  }

  return { ok: true, data: patch };
}
