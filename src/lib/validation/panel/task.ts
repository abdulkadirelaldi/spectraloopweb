import { z } from "zod";

import {
  TASK_STATUSES,
  UPDATE_EMPTY_MESSAGE,
  clearableText,
  hasAtLeastOneField,
  isoDate,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel task input schemas — mirror `api/panel/tasks/shared.ts`.
 * title 1–200, description ≤10000, subteam ≤120, assigneeId ≤64,
 * status enum (default "todo"), dueDate ISO→Date. `createdBy` server-assigned.
 *
 * Subteam scoping (a lead is pinned to their own subteam) is enforced in the
 * route, NOT here — this only validates shape.
 */
export const panelTaskCreateSchema = z.object({
  title: requiredText(200, "Title"),
  description: optionalText(10000, "description"),
  subteam: optionalText(120, "subteam"),
  assigneeId: optionalText(64, "assigneeId"),
  status: z.enum(TASK_STATUSES).optional().default("todo"),
  dueDate: isoDate("dueDate").optional(),
});

export const panelTaskUpdateSchema = z
  .object({
    title: optionalText(200, "title"),
    description: clearableText(10000, "description"),
    subteam: clearableText(120, "subteam"),
    assigneeId: clearableText(64, "assigneeId"),
    status: z.enum(TASK_STATUSES).optional(),
    dueDate: isoDate("dueDate").nullish(),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelTaskCreate = z.infer<typeof panelTaskCreateSchema>;
export type PanelTaskUpdate = z.infer<typeof panelTaskUpdateSchema>;
