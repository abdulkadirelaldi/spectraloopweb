import { z } from "zod";

import {
  EVENT_TYPES,
  UPDATE_EMPTY_MESSAGE,
  clearableText,
  hasAtLeastOneField,
  isoDate,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel event input schemas — mirror `api/panel/events/shared.ts`.
 * title 1–200, date ISO→Date (required), type enum (default "other"),
 * description ≤10000. Events are not subteam-scoped (write requires admin/lead,
 * enforced in the route).
 */
export const panelEventCreateSchema = z.object({
  title: requiredText(200, "Title"),
  date: isoDate("date"),
  type: z.enum(EVENT_TYPES).optional().default("other"),
  description: optionalText(10000, "description"),
});

export const panelEventUpdateSchema = z
  .object({
    title: optionalText(200, "title"),
    date: isoDate("date").optional(),
    type: z.enum(EVENT_TYPES).optional(),
    description: clearableText(10000, "description"),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelEventCreate = z.infer<typeof panelEventCreateSchema>;
export type PanelEventUpdate = z.infer<typeof panelEventUpdateSchema>;
