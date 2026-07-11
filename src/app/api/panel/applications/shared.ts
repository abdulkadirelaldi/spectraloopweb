import type { ApplicationDocument } from "@/models/Application";
import type {
  Application as ApplicationType,
  ApplicationStatus,
} from "@/types";

/**
 * Shared helpers for the panel applications endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 */

export const APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
];

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

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Minimal server-side validation for the status update (PATCH). ONLY `status`
 * is accepted — the application's content (name/email/subteamPref/message) is
 * read-only in the panel, so any other field in the body is ignored.
 *
 * TODO(3.Q): replace with an authoritative panel application-status zod schema
 * owned by Security & QA (`@/lib/validation`, task 3.Q1). Hand-rolled for now.
 */
export function validateStatusUpdate(
  body: unknown,
): ValidateResult<{ status: ApplicationStatus }> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const { status } = body as Record<string, unknown>;

  if (typeof status !== "string" || status.length === 0) {
    return { ok: false, error: "Field status is required." };
  }
  if (!APPLICATION_STATUSES.includes(status as never)) {
    return { ok: false, error: "Invalid status." };
  }

  return { ok: true, data: { status: status as ApplicationStatus } };
}
