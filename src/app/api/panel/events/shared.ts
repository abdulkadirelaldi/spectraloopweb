import type { EventDocument } from "@/models/Event";
import type { Event as EventType, EventType as EventKind } from "@/types";

/**
 * Shared helpers for the panel events endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 2.B6);
 * this file only holds the response serializer.
 */

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
