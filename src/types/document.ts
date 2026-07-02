import type { BaseEntity, DocumentCategory } from "./common";

/**
 * Archived file. Source: PROGRAM.md §8
 * `Document { title, fileUrl, category, subteam, uploadedBy, createdAt }`.
 */
export interface Document extends BaseEntity {
  title: string;
  fileUrl: string;
  category: DocumentCategory;
  /** Subteam id this document belongs to (FK -> Subteam.id). */
  subteam?: string;
  /** User id of the uploader (FK -> User.id). */
  uploadedBy: string;
}
