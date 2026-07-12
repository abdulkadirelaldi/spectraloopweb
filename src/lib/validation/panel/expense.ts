import { z } from "zod";

import {
  EXPENSE_STATUSES,
  UPDATE_EMPTY_MESSAGE,
  clearableText,
  hasAtLeastOneField,
  isoDate,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel expense/budget input schemas — mirror `api/panel/budget/shared.ts`.
 * title 1–200, amount >0 … 100_000_000, currency ≤8 (default "TRY"),
 * category 1–120, date ISO→Date, subteam ≤120, notes ≤5000.
 *
 * FINANCIAL / SHAPE only: `status` is NOT accepted on CREATE (a new expense is
 * always "pending", set in the route); `submittedBy` is server-assigned. On
 * UPDATE `status` validates shape only — the approval transition (approve /
 * reimburse) is ROLE-gated (admin-only) in the route, not here.
 */
const amount = z
  .number()
  .positive("amount must be a number > 0.")
  .max(100_000_000, "amount is too large.");

const currency = z
  .string()
  .trim()
  .min(1, "Invalid currency.")
  .max(8, "currency is too long.");

export const panelExpenseCreateSchema = z.object({
  title: requiredText(200, "Title"),
  amount,
  currency: currency.optional().default("TRY"),
  category: requiredText(120, "Category"),
  date: isoDate("date"),
  subteam: optionalText(120, "subteam"),
  notes: optionalText(5000, "notes"),
});

export const panelExpenseUpdateSchema = z
  .object({
    title: optionalText(200, "title"),
    amount: amount.optional(),
    currency: currency.optional(),
    category: optionalText(120, "category"),
    date: isoDate("date").optional(),
    subteam: clearableText(120, "subteam"),
    notes: clearableText(5000, "notes"),
    status: z.enum(EXPENSE_STATUSES).optional(),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelExpenseCreate = z.infer<typeof panelExpenseCreateSchema>;
export type PanelExpenseUpdate = z.infer<typeof panelExpenseUpdateSchema>;
