import { z } from "zod";

import {
  INVENTORY_STATUSES,
  UPDATE_EMPTY_MESSAGE,
  clearableText,
  hasAtLeastOneField,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel inventory input schemas — mirror `api/panel/inventory/shared.ts`.
 * name 1–200, category 1–120, unit 1–40, quantity 0–1_000_000 (not int),
 * location ≤200, subteam ≤120, notes ≤5000, status enum (default "available").
 * `createdBy` is server-assigned. SHAPE only — subteam scoping / who-may-write
 * stays in the route/guard.
 */
const quantity = z
  .number()
  .min(0, "quantity must be a number ≥ 0.")
  .max(1_000_000, "quantity is too large.");

export const panelInventoryCreateSchema = z.object({
  name: requiredText(200, "Name"),
  category: requiredText(120, "Category"),
  unit: requiredText(40, "Unit"),
  quantity,
  location: optionalText(200, "location"),
  subteam: optionalText(120, "subteam"),
  notes: optionalText(5000, "notes"),
  status: z.enum(INVENTORY_STATUSES).optional().default("available"),
});

export const panelInventoryUpdateSchema = z
  .object({
    name: optionalText(200, "name"),
    category: optionalText(120, "category"),
    unit: optionalText(40, "unit"),
    quantity: quantity.optional(),
    location: clearableText(200, "location"),
    subteam: clearableText(120, "subteam"),
    notes: clearableText(5000, "notes"),
    status: z.enum(INVENTORY_STATUSES).optional(),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelInventoryCreate = z.infer<typeof panelInventoryCreateSchema>;
export type PanelInventoryUpdate = z.infer<typeof panelInventoryUpdateSchema>;
