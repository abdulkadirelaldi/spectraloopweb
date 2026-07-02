/**
 * Shared primitive types, unions, and the base entity shape.
 *
 * These are pure domain types (NOT Mongoose models) consumed by every agent:
 * Frontend UI, Backend API contracts, and Security & QA validation schemas.
 *
 * Source of truth: PROGRAM.md §8 (data models) and the RBAC matrix.
 */

/**
 * ISO-8601 date-time string (e.g. "2026-07-02T12:00:00.000Z").
 *
 * We use strings rather than `Date` because these types cross the API boundary
 * as JSON, where dates are always serialized to strings.
 */
export type ISODateString = string;

/** RBAC roles (PROGRAM.md §8 RBAC matrix). */
export type Role = "admin" | "lead" | "member";

/** Sponsor tiers (PROGRAM.md §8: `tier: gold|silver|bronze`). */
export type SponsorTier = "gold" | "silver" | "bronze";

/**
 * Task lifecycle status.
 * Assumption (not spelled out in §8): a simple Kanban-style flow.
 */
export type TaskStatus = "todo" | "in-progress" | "review" | "done";

/**
 * Application ("Bize Katıl" form) review status.
 * Assumption (not spelled out in §8): review pipeline states.
 */
export type ApplicationStatus = "new" | "reviewing" | "accepted" | "rejected";

/**
 * Announcement audience.
 * Assumption (§8 only names the field `audience`): who the announcement targets.
 */
export type AnnouncementAudience = "all" | "leads" | "admins";

/**
 * Document category.
 * Assumption (§8 only names the field `category`): coarse document buckets.
 */
export type DocumentCategory =
  | "cad"
  | "report"
  | "presentation"
  | "media"
  | "other";

/**
 * Calendar event type.
 * Assumption (§8 only names the field `type`): common event kinds.
 */
export type EventType =
  | "meeting"
  | "deadline"
  | "competition"
  | "workshop"
  | "other";

/**
 * Fields every persisted entity carries.
 * Per task 0.4: each entity has a string `id` and a `createdAt` timestamp,
 * even where §8 did not list `createdAt` explicitly (Subteam, Event, Sponsor).
 */
export interface BaseEntity {
  id: string;
  createdAt: ISODateString;
}
