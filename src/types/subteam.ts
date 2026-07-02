import type { BaseEntity } from "./common";

/**
 * Subteam / discipline group. Source: PROGRAM.md §8
 * `Subteam { name, description, leadUserId }`.
 * Examples: Mechanical, Electronics-Electrical, Software.
 */
export interface Subteam extends BaseEntity {
  name: string;
  description?: string;
  /** User id of the subteam lead (FK -> User.id). */
  leadUserId?: string;
}
