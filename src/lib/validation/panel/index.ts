/**
 * Panel input validation schemas (task 2.Q0) — single entry point.
 *
 * Import from `@/lib/validation` (or `@/lib/validation/panel`):
 *   import { panelTaskCreateSchema, firstErrorMessage } from "@/lib/validation";
 *
 * Backend binds these in task 2.B6 with `.safeParse()`, mapping failures to a
 * human-safe string via `firstErrorMessage` (same helper the public forms use).
 * Each entity exposes a CREATE and an UPDATE schema; UPDATE requires at least
 * one field. These validate SHAPE only — authorization (who may set which field)
 * stays in the route/guard.
 */
export {
  panelAnnouncementCreateSchema,
  panelAnnouncementUpdateSchema,
  type PanelAnnouncementCreate,
  type PanelAnnouncementUpdate,
} from "./announcement";
export {
  panelTaskCreateSchema,
  panelTaskUpdateSchema,
  type PanelTaskCreate,
  type PanelTaskUpdate,
} from "./task";
export {
  panelMemberCreateSchema,
  panelMemberUpdateSchema,
  type PanelMemberCreate,
  type PanelMemberUpdate,
} from "./member";
export {
  panelDocumentCreateSchema,
  panelDocumentUpdateSchema,
  type PanelDocumentCreate,
  type PanelDocumentUpdate,
} from "./document";
export {
  panelEventCreateSchema,
  panelEventUpdateSchema,
  type PanelEventCreate,
  type PanelEventUpdate,
} from "./event";

// Enum value lists (kept in sync with @/types), handy for tests / route filters.
export {
  AUDIENCES,
  TASK_STATUSES,
  ROLES,
  DOCUMENT_CATEGORIES,
  EVENT_TYPES,
} from "./common";
