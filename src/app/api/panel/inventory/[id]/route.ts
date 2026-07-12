import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiSession } from "@/lib/auth/guard";
import { Inventory, type InventoryDocument } from "@/models/Inventory";
import { toInventory } from "../shared";
import {
  panelInventoryUpdateSchema,
  firstErrorMessage,
} from "@/lib/validation";

/**
 * Single panel inventory item — /api/panel/inventory/[id]
 *
 * GET    — read one. Any authenticated user (reads open).
 * PATCH  — update. admin (any) or lead (own-subteam items only; cannot move to
 *          another subteam). member → 403.
 * DELETE — admin (any) or lead (own subteam). member → 403.
 *
 * See ../README.md for the full RBAC + IDOR contract.
 */

type Ctx = { params: Promise<{ id: string }> };

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid inventory id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Inventory item not found." },
    { status: 404 },
  );
}

function forbidden(error = "Forbidden"): Response {
  return Response.json({ ok: false, error }, { status: 403 });
}

export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const doc = await Inventory.findById(id).lean<
      (InventoryDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    return Response.json({ ok: true, item: toInventory(doc) });
  } catch (err) {
    console.error("[panel/inventory/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load inventory item." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { role, subteam: ownSubteam } = gate.session.user;
  if (role === "member") return forbidden("Members cannot edit inventory.");

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = panelInventoryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  try {
    await connectToDatabase();
    const target = await Inventory.findById(id).lean<
      (InventoryDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    if (role === "lead") {
      if (!ownSubteam || target.subteam !== ownSubteam) {
        return forbidden(
          "A lead can only edit inventory in their own subteam.",
        );
      }
      if (patch.subteam !== undefined && patch.subteam !== ownSubteam) {
        return forbidden("A lead cannot move an item to another subteam.");
      }
    }

    const updated = await Inventory.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean<(InventoryDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, item: toInventory(updated) });
  } catch (err) {
    console.error("[panel/inventory/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update inventory item." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { role, subteam: ownSubteam } = gate.session.user;
  if (role === "member") return forbidden("Members cannot delete inventory.");

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const target = await Inventory.findById(id).lean<
      (InventoryDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    if (role === "lead" && (!ownSubteam || target.subteam !== ownSubteam)) {
      return forbidden(
        "A lead can only delete inventory in their own subteam.",
      );
    }

    await Inventory.findByIdAndDelete(id);
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/inventory/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete inventory item." },
      { status: 500 },
    );
  }
}
