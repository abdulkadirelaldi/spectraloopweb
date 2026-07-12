import type { ExpenseDocument } from "@/models/Expense";
import type { Expense as ExpenseType, ExpenseStatus } from "@/types";

/**
 * Shared helpers for the panel budget/expense endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 3.B6);
 * this file holds the response serializer + the currency-aware summary (a
 * presentation concern, not shape validation).
 */

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

/**
 * Summary over a set of expenses. Amounts are grouped BY CURRENCY (never summed
 * across currencies). Status breakdown is counts.
 */
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
