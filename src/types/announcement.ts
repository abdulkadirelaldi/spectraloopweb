import type { AnnouncementAudience, BaseEntity } from "./common";

/**
 * Announcement. Source: PROGRAM.md §8
 * `Announcement { title, body, audience, authorId, publishedToPublic, createdAt }`.
 */
export interface Announcement extends BaseEntity {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  /** User id of the author (FK -> User.id). */
  authorId: string;
  /** When true, this announcement is also surfaced on the public site (CMS). */
  publishedToPublic: boolean;
}
