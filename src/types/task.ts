import type { BaseEntity, ISODateString, TaskStatus } from "./common";

/**
 * Work item. Source: PROGRAM.md §8
 * `Task { title, description, subteam, assigneeId, status, dueDate, createdBy, createdAt }`.
 */
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  /** Subteam id this task belongs to (FK -> Subteam.id). */
  subteam?: string;
  /** User id of the assignee (FK -> User.id). Optional when unassigned. */
  assigneeId?: string;
  status: TaskStatus;
  dueDate?: ISODateString;
  /** User id of the creator (FK -> User.id). */
  createdBy: string;
}
