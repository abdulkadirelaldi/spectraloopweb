import type { InventoryDocument } from "@/models/Inventory";
import type { Inventory as InventoryType, InventoryStatus } from "@/types";

/**
 * Shared helpers for the panel inventory endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 * Input validation lives in `@/lib/validation` (panel schemas, bound in 3.B6);
 * this file only holds the response serializer.
 */

/** Map a Mongoose document to the shared `Inventory` API shape. */
export function toInventory(
  doc: InventoryDocument & { _id: unknown },
): InventoryType {
  return {
    id: String(doc._id),
    name: doc.name,
    category: doc.category,
    quantity: doc.quantity,
    unit: doc.unit,
    location: doc.location ?? undefined,
    subteam: doc.subteam ?? undefined,
    status: doc.status as InventoryStatus,
    notes: doc.notes ?? undefined,
    createdBy: doc.createdBy,
    createdAt: (doc.createdAt as Date).toISOString(),
  };
}
