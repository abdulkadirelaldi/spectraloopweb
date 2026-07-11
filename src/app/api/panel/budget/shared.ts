import type { ExpenseDocument } from "@/models/Expense";
import type { Expense as ExpenseType, ExpenseStatus } from "@/types";

/**
 * Shared helpers for the panel budget/expense endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 */

export const EXPENSE_STATUSES: readonly ExpenseStatus[] = [
  "pending",
  "approved",
  "reimbursed",
  "rejected",
];

const LIMITS = {
  title: 200,
  currency: 8,
  category: 120,
  subteam: 120,
  notes: 5000,
  amountMax: 100_000_000,
} as const;

/** Map a Mongoose document to the shared `Expense` API shape. */
export function toExpense(
  doc: ExpenseDocument & { _id: unknown },
): ExpenseType {
  return {
    id: String(doc._id),
    title: doc.title,
    amount: doc.amount,
    currency: doc.currency,
    category: doc.category,
    subteam: doc.subteam ?? undefined,
    date: (doc.date as Date).toISOString(),
    status: doc.status as ExpenseStatus,
    submittedBy: doc.submittedBy,
    notes: doc.notes ?? undefined,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}

/** Client-writable fields on CREATE (never `submittedBy`/`status`/`id`). */
export interface ExpenseCreate {
  title: string;
  amount: number;
  currency: string;
  category: string;
  subteam?: string;
  date: Date;
  notes?: string;
}

/** Client-writable fields on UPDATE (status gated by role in the route). */
export interface ExpenseUpdate {
  title?: string;
  amount?: number;
  currency?: string;
  category?: string;
  subteam?: string;
  date?: Date;
  notes?: string;
  status?: ExpenseStatus;
}

type ValidateResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function checkOptionalString(
  value: unknown,
  max: number,
  label: string,
): { ok: true; value?: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true };
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `Invalid ${label}.` };
  }
  if (value.length > max) return { ok: false, error: `${label} is too long.` };
  return { ok: true, value: value.trim() };
}

function checkAmount(
  value: unknown,
): { ok: true; value: number } | { ok: false; error: string } {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > LIMITS.amountMax
  ) {
    return { ok: false, error: "amount must be a number > 0." };
  }
  return { ok: true, value };
}

function checkDate(
  value: unknown,
): { ok: true; value: Date } | { ok: false; error: string } {
  if (typeof value !== "string") {
    return { ok: false, error: "Field date is required (ISO string)." };
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid date." };
  }
  return { ok: true, value: d };
}

/**
 * Minimal server-side validation for CREATE (POST). `status` is NOT accepted —
 * a new expense is always "pending" (set in the route). `submittedBy` is
 * server-assigned.
 *
 * TODO(3.Q): replace with an authoritative panel-expense zod schema owned by
 * Security & QA (`@/lib/validation`, task 3.Q1). Hand-rolled for now.
 */
export function validateCreate(body: unknown): ValidateResult<ExpenseCreate> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.title) || b.title.length > LIMITS.title) {
    return { ok: false, error: "Field title is required." };
  }
  if (!isNonEmptyString(b.category) || b.category.length > LIMITS.category) {
    return { ok: false, error: "Field category is required." };
  }

  const amount = checkAmount(b.amount);
  if (!amount.ok) return amount;

  const date = checkDate(b.date);
  if (!date.ok) return date;

  const currency = checkOptionalString(b.currency, LIMITS.currency, "currency");
  if (!currency.ok) return currency;

  const subteam = checkOptionalString(b.subteam, LIMITS.subteam, "subteam");
  if (!subteam.ok) return subteam;

  const notes = checkOptionalString(b.notes, LIMITS.notes, "notes");
  if (!notes.ok) return notes;

  return {
    ok: true,
    data: {
      title: b.title.trim(),
      amount: amount.value,
      currency: currency.value ?? "TRY",
      category: b.category.trim(),
      subteam: subteam.value,
      date: date.value,
      notes: notes.value,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH): every field optional, at
 * least one present. `status` transitions are ROLE-gated in the route (approval
 * is admin-only) — validated here for shape only.
 *
 * TODO(3.Q): replace with the shared panel-expense zod schema (see above).
 */
export function validateUpdate(body: unknown): ValidateResult<ExpenseUpdate> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const patch: ExpenseUpdate = {};

  if (b.title !== undefined) {
    if (!isNonEmptyString(b.title) || b.title.length > LIMITS.title) {
      return { ok: false, error: "Invalid title." };
    }
    patch.title = b.title.trim();
  }
  if (b.category !== undefined) {
    if (!isNonEmptyString(b.category) || b.category.length > LIMITS.category) {
      return { ok: false, error: "Invalid category." };
    }
    patch.category = b.category.trim();
  }
  if (b.amount !== undefined) {
    const r = checkAmount(b.amount);
    if (!r.ok) return r;
    patch.amount = r.value;
  }
  if (b.date !== undefined) {
    const r = checkDate(b.date);
    if (!r.ok) return r;
    patch.date = r.value;
  }
  if (b.currency !== undefined) {
    const r = checkOptionalString(b.currency, LIMITS.currency, "currency");
    if (!r.ok) return r;
    patch.currency = r.value;
  }
  if ("subteam" in b) {
    const r = checkOptionalString(b.subteam, LIMITS.subteam, "subteam");
    if (!r.ok) return r;
    patch.subteam = r.value;
  }
  if ("notes" in b) {
    const r = checkOptionalString(b.notes, LIMITS.notes, "notes");
    if (!r.ok) return r;
    patch.notes = r.value;
  }
  if (b.status !== undefined) {
    if (!EXPENSE_STATUSES.includes(b.status as never)) {
      return { ok: false, error: "Invalid status." };
    }
    patch.status = b.status as ExpenseStatus;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No updatable fields provided." };
  }

  return { ok: true, data: patch };
}

/** Summary over a set of expenses. Amounts are grouped BY CURRENCY (never summed
 *  across currencies). Status breakdown is counts. */
export interface ExpenseSummary {
  count: number;
  byStatus: Record<ExpenseStatus, number>;
  totalsByCurrency: Record<string, number>;
}

export function computeSummary(items: ExpenseType[]): ExpenseSummary {
  const byStatus: Record<ExpenseStatus, number> = {
    pending: 0,
    approved: 0,
    reimbursed: 0,
    rejected: 0,
  };
  const totalsByCurrency: Record<string, number> = {};

  for (const e of items) {
    byStatus[e.status] += 1;
    totalsByCurrency[e.currency] =
      (totalsByCurrency[e.currency] ?? 0) + e.amount;
  }

  return { count: items.length, byStatus, totalsByCurrency };
}
