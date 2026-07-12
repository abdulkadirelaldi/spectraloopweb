import { z } from "zod";

import {
  SPONSOR_TIERS,
  UPDATE_EMPTY_MESSAGE,
  hasAtLeastOneField,
  httpUrl,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel sponsor input schemas — mirror `api/panel/sponsors/shared.ts`.
 * name 1–200, logoUrl required http(s) URL ≤2048, tier enum (required, no
 * default), website optional http(s) URL ≤2048, active boolean (default true).
 *
 * `active` is the CMS publish/unpublish toggle — SHAPE only; who may publish is
 * a route/guard concern.
 */
export const panelSponsorCreateSchema = z.object({
  name: requiredText(200, "Name"),
  logoUrl: httpUrl(2048, "logoUrl"),
  tier: z.enum(SPONSOR_TIERS),
  website: httpUrl(2048, "website").optional(),
  active: z.boolean().optional().default(true),
});

export const panelSponsorUpdateSchema = z
  .object({
    name: optionalText(200, "name"),
    logoUrl: httpUrl(2048, "logoUrl").optional(),
    tier: z.enum(SPONSOR_TIERS).optional(),
    // Clearable: omit to leave unchanged, or null to clear (mirrors "website" in body).
    website: httpUrl(2048, "website").nullish(),
    active: z.boolean().optional(),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelSponsorCreate = z.infer<typeof panelSponsorCreateSchema>;
export type PanelSponsorUpdate = z.infer<typeof panelSponsorUpdateSchema>;
