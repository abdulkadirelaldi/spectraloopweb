import type { BaseEntity, InventoryStatus } from "./common";

/**
 * Inventory / stock item (Faz 3 — team material tracking).
 *
 * NOT part of PROGRAM.md §8; added as a new domain type via chief approval
 * (task 3.B2). Subteam-scoped like tasks/documents.
 */
export interface Inventory extends BaseEntity {
  name: string;
  /** Free-text category (e.g. "electronics", "raw-material", "tooling"). */
  category: string;
  quantity: number;
  /** Unit of measure, e.g. "adet", "m", "kg". */
  unit: string;
  location?: string;
  /** Subteam id this item belongs to (FK -> Subteam.id). */
  subteam?: string;
  status: InventoryStatus;
  notes?: string;
  /** User id of the creator (FK -> User.id). */
  createdBy: string;
}
