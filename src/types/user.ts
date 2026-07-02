import type { BaseEntity, Role } from "./common";

/**
 * Team member. Source: PROGRAM.md §8
 * `User { name, email, passwordHash|oauth, role, subteam, photoUrl, active, createdAt }`.
 *
 * NOTE: `passwordHash` is intentionally NOT part of this shared type. This shape
 * is consumed by the Frontend UI, so it must never carry credentials. The auth
 * secret (password hash / OAuth linkage) lives only in the Mongoose model and
 * the auth layer, both owned by Security & QA. `authProvider` records which
 * mechanism a user authenticates with, without leaking the secret itself.
 */
export interface User extends BaseEntity {
  name: string;
  email: string;
  role: Role;
  /** Subteam id this user belongs to (FK -> Subteam.id). Optional (e.g. admins). */
  subteam?: string;
  photoUrl?: string;
  active: boolean;
  authProvider?: "credentials" | "oauth";
}
