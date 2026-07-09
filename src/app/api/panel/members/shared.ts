import type { UserDocument } from "@/models/User";
import type { Role } from "@/types";
import type { PanelMemberUpdate } from "@/lib/validation";

/**
 * Shared helpers for the panel members endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 2.B6);
 * this file holds the SAFE response serializer + the lead field allow-list
 * (both are serialization / authorization concerns, not shape validation).
 *
 * SECURITY: `toMember` NEVER includes `passwordHash`. Even though the schema
 * marks it `select: false`, the projection is built from an explicit allow-list
 * — defence in depth against accidental leakage.
 */

/** Safe, client-facing member shape. `email` only when the viewer may see it. */
export interface MemberView {
  id: string;
  name: string;
  email?: string;
  role: Role;
  subteam?: string;
  photoUrl?: string;
  active: boolean;
  createdAt: string;
}

/**
 * Map a User document to the safe `MemberView`. `passwordHash` is never read.
 * @param includeEmail whether the viewer may see the email (README policy:
 *   admin + lead only).
 */
export function toMember(
  doc: UserDocument & { _id: unknown },
  includeEmail: boolean,
): MemberView {
  const view: MemberView = {
    id: String(doc._id),
    name: doc.name,
    role: doc.role as Role,
    subteam: doc.subteam ?? undefined,
    photoUrl: doc.photoUrl ?? undefined,
    active: doc.active,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
  if (includeEmail) view.email = doc.email;
  return view;
}

/**
 * Fields a LEAD may edit on a member in their own subteam. NEVER
 * role/active/email/subteam/password (privilege-escalation guard lives in the
 * route). Typed against the panel update schema so it stays in sync.
 */
export const LEAD_EDITABLE_FIELDS: readonly (keyof PanelMemberUpdate)[] = [
  "name",
  "photoUrl",
];
