import type { BaseEntity, ExpenseStatus, ISODateString } from "./common";

/**
 * Expense / budget line item (Faz 3 — team spending tracking, approval flow).
 *
 * NOT part of PROGRAM.md §8; added as a new domain type via chief approval
 * (task 3.B3). Financial data — access is restricted to admin + lead.
 *
 * NOTE on `amount`: stored as a decimal `number` in a single currency field.
 * JS floating point can introduce rounding error on arithmetic; for now this is
 * acceptable for tracking, but production-grade accounting should consider
 * integer minor units (kuruş/cents). See README.
 */
export interface Expense extends BaseEntity {
  title: string;
  amount: number;
  /** ISO-4217-ish currency code, default "TRY". */
  currency: string;
  category: string;
  /** Subteam id this expense belongs to (FK -> Subteam.id). */
  subteam?: string;
  date: ISODateString;
  status: ExpenseStatus;
  /** User id of the submitter (FK -> User.id). */
  submittedBy: string;
  notes?: string;
}
