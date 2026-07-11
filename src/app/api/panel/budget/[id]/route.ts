import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole } from "@/lib/auth/guard";
import { Expense, type ExpenseDocument } from "@/models/Expense";
import { toExpense, validateUpdate } from "../shared";

/**
 * Single panel expense — /api/panel/budget/[id]
 *
 * GET    — read one. admin (any) or lead (own subteam only). member → 403.
 * PATCH  — update. Approval flow:
 *            • admin → any field INCLUDING `status` (approve/reimburse/reject).
 *            • lead  → own-subteam expense, only while `status === "pending"`,
 *                      and may NOT change `status` (approval is admin-only) or
 *                      move to another subteam.
 * DELETE — admin (any) or lead (own, pending, own-subteam request). member → 403.
 *
 * See ../README.md for the full RBAC + approval-flow contract.
 */

type Ctx = { params: Promise<{ id: string }> };

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid expense id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Expense not found." },
    { status: 404 },
  );
}

function forbidden(error = "Forbidden"): Response {
  return Response.json({ ok: false, error }, { status: 403 });
}

export async function GET(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  const { role, subteam: ownSubteam } = gate.session.user;

  try {
    await connectToDatabase();
    const doc = await Expense.findById(id).lean<
      (ExpenseDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    // A lead may only read expenses in their own subteam.
    if (role === "lead" && (!ownSubteam || doc.subteam !== ownSubteam)) {
      return forbidden("A lead can only view expenses in their own subteam.");
    }

    return Response.json({ ok: true, expense: toExpense(doc) });
  } catch (err) {
    console.error("[panel/budget/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load expense." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

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

  const parsed = validateUpdate(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }
  const patch = parsed.data;

  const { role, subteam: ownSubteam } = gate.session.user;

  try {
    await connectToDatabase();
    const target = await Expense.findById(id).lean<
      (ExpenseDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    if (role === "lead") {
      // Scope: own subteam only.
      if (!ownSubteam || target.subteam !== ownSubteam) {
        return forbidden("A lead can only edit expenses in their own subteam.");
      }
      // Approval is admin-only: a lead may not change status.
      if (patch.status !== undefined) {
        return forbidden("Only an admin can change an expense's status.");
      }
      // A lead may only edit a request that is still pending.
      if (target.status !== "pending") {
        return forbidden("A lead can only edit a pending expense.");
      }
      // A lead cannot move the expense to another subteam.
      if (patch.subteam !== undefined && patch.subteam !== ownSubteam) {
        return forbidden("A lead cannot move an expense to another subteam.");
      }
    }
    // admin: any field including status (approve / reimburse / reject).

    const updated = await Expense.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean<(ExpenseDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, expense: toExpense(updated) });
  } catch (err) {
    console.error("[panel/budget/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update expense." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  const { role, id: userId, subteam: ownSubteam } = gate.session.user;

  try {
    await connectToDatabase();
    const target = await Expense.findById(id).lean<
      (ExpenseDocument & { _id: unknown }) | null
    >();
    if (!target) return notFound();

    if (role === "lead") {
      // A lead may delete only their OWN, still-pending request in their subteam.
      if (!ownSubteam || target.subteam !== ownSubteam) {
        return forbidden(
          "A lead can only delete expenses in their own subteam.",
        );
      }
      if (target.submittedBy !== userId || target.status !== "pending") {
        return forbidden(
          "A lead can only delete their own pending expense request.",
        );
      }
    }
    // admin: may delete any expense.

    await Expense.findByIdAndDelete(id);
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/budget/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete expense." },
      { status: 500 },
    );
  }
}
