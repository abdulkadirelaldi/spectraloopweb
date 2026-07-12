import type { ApplicationDocument } from "@/models/Application";
import type {
  Application as ApplicationType,
  ApplicationStatus,
} from "@/types";

/**
 * Shared helpers for the panel applications endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 3.B6);
 * this file only holds the response serializer.
 */

/** Map a Mongoose document to the shared `Application` API shape. */
export function toApplication(
  doc: ApplicationDocument & { _id: unknown },
): ApplicationType {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    subteamPref: doc.subteamPref,
    message: doc.message,
    status: doc.status as ApplicationStatus,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}
