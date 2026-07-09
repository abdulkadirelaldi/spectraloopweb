import { z } from "zod";

import {
  AUDIENCES,
  UPDATE_EMPTY_MESSAGE,
  hasAtLeastOneField,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel announcement input schemas — mirror `api/panel/announcements/shared.ts`.
 * title 1–200, body 1–10000, audience enum (default "all"),
 * publishedToPublic boolean (default false). `authorId` is server-assigned and
 * intentionally not accepted (stripped as an unknown key).
 */
export const panelAnnouncementCreateSchema = z.object({
  title: requiredText(200, "Title"),
  body: requiredText(10000, "Body"),
  audience: z.enum(AUDIENCES).optional().default("all"),
  publishedToPublic: z.boolean().optional().default(false),
});

export const panelAnnouncementUpdateSchema = z
  .object({
    title: optionalText(200, "title"),
    body: optionalText(10000, "body"),
    audience: z.enum(AUDIENCES).optional(),
    publishedToPublic: z.boolean().optional(),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelAnnouncementCreate = z.infer<
  typeof panelAnnouncementCreateSchema
>;
export type PanelAnnouncementUpdate = z.infer<
  typeof panelAnnouncementUpdateSchema
>;
