import type { InventoryDocument } from "@/models/Inventory";
import type { Inventory as InventoryType, InventoryStatus } from "@/types";

/**
 * Shared helpers for the panel inventory endpoints (collection + [id]).
 *
 * Colocated module (not `route.ts`), imported by the sibling route handlers.
 */

export const INVENTORY_STATUSES: readonly InventoryStatus[] = [
  "available",
  "in-use",
  "maintenance",
  "depleted",
];

const LIMITS = {
  name: 200,
  category: 120,
  unit: 40,
  location: 200,
  subteam: 120,
  notes: 5000,
  quantityMax: 1_000_000,
} as const;

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

/** Client-writable inventory fields (never `createdBy` / `id` / timestamps). */
export interface InventoryWritable {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location?: string;
  subteam?: string;
  status: InventoryStatus;
  notes?: string;
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

function checkQuantity(
  value: unknown,
): { ok: true; value: number } | { ok: false; error: string } {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > LIMITS.quantityMax
  ) {
    return { ok: false, error: "quantity must be a number ≥ 0." };
  }
  return { ok: true, value };
}

function checkStatus(
  value: unknown,
): { ok: true; value: InventoryStatus } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: "available" };
  if (!INVENTORY_STATUSES.includes(value as never)) {
    return { ok: false, error: "Invalid status." };
  }
  return { ok: true, value: value as InventoryStatus };
}

/**
 * Minimal server-side validation for CREATE (POST).
 *
 * TODO(3.Q): replace with an authoritative panel-inventory zod schema owned by
 * Security & QA (`@/lib/validation`, task 3.Q1). Hand-rolled checks for now.
 */
export function validateCreate(
  body: unknown,
): ValidateResult<InventoryWritable> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  if (!isNonEmptyString(b.name) || b.name.length > LIMITS.name) {
    return { ok: false, error: "Field name is required." };
  }
  if (!isNonEmptyString(b.category) || b.category.length > LIMITS.category) {
    return { ok: false, error: "Field category is required." };
  }
  if (!isNonEmptyString(b.unit) || b.unit.length > LIMITS.unit) {
    return { ok: false, error: "Field unit is required." };
  }

  const quantity = checkQuantity(b.quantity);
  if (!quantity.ok) return quantity;

  const location = checkOptionalString(b.location, LIMITS.location, "location");
  if (!location.ok) return location;

  const subteam = checkOptionalString(b.subteam, LIMITS.subteam, "subteam");
  if (!subteam.ok) return subteam;

  const notes = checkOptionalString(b.notes, LIMITS.notes, "notes");
  if (!notes.ok) return notes;

  const status = checkStatus(b.status);
  if (!status.ok) return status;

  return {
    ok: true,
    data: {
      name: b.name.trim(),
      category: b.category.trim(),
      quantity: quantity.value,
      unit: b.unit.trim(),
      location: location.value,
      subteam: subteam.value,
      notes: notes.value,
      status: status.value,
    },
  };
}

/**
 * Minimal server-side validation for UPDATE (PATCH): every field optional, at
 * least one present.
 *
 * TODO(3.Q): replace with the shared panel-inventory zod schema (see above).
 */
export function validateUpdate(
  body: unknown,
): ValidateResult<Partial<InventoryWritable>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const patch: Partial<InventoryWritable> = {};

  if (b.name !== undefined) {
    if (!isNonEmptyString(b.name) || b.name.length > LIMITS.name) {
      return { ok: false, error: "Invalid name." };
    }
    patch.name = b.name.trim();
  }
  if (b.category !== undefined) {
    if (!isNonEmptyString(b.category) || b.category.length > LIMITS.category) {
      return { ok: false, error: "Invalid category." };
    }
    patch.category = b.category.trim();
  }
  if (b.unit !== undefined) {
    if (!isNonEmptyString(b.unit) || b.unit.length > LIMITS.unit) {
      return { ok: false, error: "Invalid unit." };
    }
    patch.unit = b.unit.trim();
  }
  if (b.quantity !== undefined) {
    const r = checkQuantity(b.quantity);
    if (!r.ok) return r;
    patch.quantity = r.value;
  }
  if ("location" in b) {
    const r = checkOptionalString(b.location, LIMITS.location, "location");
    if (!r.ok) return r;
    patch.location = r.value;
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
    const r = checkStatus(b.status);
    if (!r.ok) return r;
    patch.status = r.value;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "No updatable fields provided." };
  }

  return { ok: true, data: patch };
}
