import { z } from "zod";

import type {
  AnnouncementAudience,
  ApplicationStatus,
  DocumentCategory,
  EventType,
  ExpenseStatus,
  InventoryStatus,
  Role,
  SponsorTier,
  TaskStatus,
} from "@/types";

/**
 * Shared building blocks for the panel input schemas (task 2.Q0).
 *
 * These mirror the hand-rolled checks in each panel entity's `shared.ts`
 * exactly (length caps, enums, required/optional, ISO-date + URL rules).
 * Backend binds the resulting schemas in task 2.B6, replacing the interim
 * hand-rolled validators.
 *
 * IMPORTANT — SHAPE only, not AUTHORIZATION. These schemas validate the *shape*
 * of a body. WHO may set a field (e.g. only an admin may assign `role`; a lead
 * is pinned to their own `subteam`; a member may PATCH only `status`) is a
 * route/guard concern and is NOT expressed here — see each README's RBAC matrix
 * and `@/lib/auth/guard`. A schema accepting `role`/`subteam`/`active` does not
 * imply the caller is allowed to change them.
 *
 * Unknown keys are stripped (zod default), so a client cannot inject
 * server-assigned fields (`authorId`, `createdBy`, `uploadedBy`, `id`,
 * `createdAt`) through a create/update body.
 */

// Enum value lists — kept in lock-step with the `@/types` unions via `satisfies`
// (a divergence here fails to compile).
export const AUDIENCES = [
  "all",
  "leads",
  "admins",
] as const satisfies readonly AnnouncementAudience[];

export const TASK_STATUSES = [
  "todo",
  "in-progress",
  "review",
  "done",
] as const satisfies readonly TaskStatus[];

export const ROLES = [
  "admin",
  "lead",
  "member",
] as const satisfies readonly Role[];

export const DOCUMENT_CATEGORIES = [
  "cad",
  "report",
  "presentation",
  "media",
  "other",
] as const satisfies readonly DocumentCategory[];

export const EVENT_TYPES = [
  "meeting",
  "deadline",
  "competition",
  "workshop",
  "other",
] as const satisfies readonly EventType[];

// --- Phase 3 enum lists (task 3.Q0) ---

export const INVENTORY_STATUSES = [
  "available",
  "in-use",
  "maintenance",
  "depleted",
] as const satisfies readonly InventoryStatus[];

export const EXPENSE_STATUSES = [
  "pending",
  "approved",
  "reimbursed",
  "rejected",
] as const satisfies readonly ExpenseStatus[];

export const APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
] as const satisfies readonly ApplicationStatus[];

export const SPONSOR_TIERS = [
  "gold",
  "silver",
  "bronze",
] as const satisfies readonly SponsorTier[];

export const UPDATE_EMPTY_MESSAGE = "No updatable fields provided.";

/**
 * PATCH refine: at least one updatable field must be present. A field explicitly
 * set to `null` (to clear it) counts as present; only an all-empty body fails.
 */
export const hasAtLeastOneField = (obj: Record<string, unknown>): boolean =>
  Object.values(obj).some((v) => v !== undefined);

/** Required, trimmed text within `max` chars. */
export const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} is too long.`);

/**
 * Optional, trimmed text (omit to skip). When present it must be a non-empty
 * string within `max`. Rejects `null` — for PATCH fields the route treats
 * "omitted" as "unchanged".
 */
export const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Invalid ${label}.`)
    .max(max, `${label} is too long.`)
    .optional();

/**
 * Clearable text for PATCH: omit to leave unchanged, or send `null` to clear it
 * (mirrors the Backend's `"field" in body` handling). A present string must be
 * non-empty within `max`.
 */
export const clearableText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `Invalid ${label}.`)
    .max(max, `${label} is too long.`)
    .nullish();

/**
 * ISO date-time string → `Date`. Loose parse (matches the hand-rolled
 * `new Date(v)` + `isNaN` check), so a `Date` is what the route persists.
 */
export const isoDate = (label = "date") =>
  z
    .string({ error: `Field ${label} is required (ISO string).` })
    .refine((s) => !Number.isNaN(new Date(s).getTime()), {
      message: `Invalid ${label}.`,
    })
    .transform((s) => new Date(s));

/** Email: valid, ≤254, normalised to lowercase (as the members route stores it). */
export const emailField = () =>
  z
    .email({ message: "Invalid email address." })
    .max(254, "Email is too long.")
    .transform((v) => v.toLowerCase());

/** A required http(s) URL within `max` chars (matches the hand-rolled checkUrl). */
export const httpUrl = (max: number, label: string) =>
  z
    .url({
      protocol: /^https?$/,
      message: `${label} must be a valid http(s) URL.`,
    })
    .max(max, `${label} is too long.`);
