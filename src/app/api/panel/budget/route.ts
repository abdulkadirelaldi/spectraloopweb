import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole } from "@/lib/auth/guard";
import { Expense, type ExpenseDocument } from "@/models/Expense";
import {
  EXPENSE_STATUSES,
  computeSummary,
  toExpense,
  validateCreate,
} from "./shared";

/**
 * Panel budget/expenses collection — /api/panel/budget
 *
 * GET  — list expenses + summary. **admin + lead only** (financial data; members
 *        cannot see it). admin sees all; a lead sees ONLY their own subteam.
 *        Query filters: `status`, `category`, `subteam` (admin), `from`, `to`.
 * POST — submit an expense request. admin + lead. A lead is pinned to their own
 *        subteam; `status` is always "pending"; `submittedBy` = session user id.
 *
 * See ./README.md for the full RBAC + approval-flow contract.
 */

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  const { role, subteam: ownSubteam } = gate.session.user;
  const { searchParams } = new URL(request.url);
  const filter: Record<string, unknown> = {};

  // Subteam scoping: a lead is restricted to their own subteam.
  if (role === "lead") {
    if (!ownSubteam) {
      // A lead without a subteam has no expenses to see.
      return Response.json({
        ok: true,
        expenses: [],
        summary: computeSummary([]),
      });
    }
    filter.subteam = ownSubteam;
  } else {
    const subteam = searchParams.get("subteam");
    if (subteam) filter.subteam = subteam;
  }

  const status = searchParams.get("status");
  if (status) {
    if (!EXPENSE_STATUSES.includes(status as never)) {
      return Response.json(
        { ok: false, error: "Invalid status filter." },
        { status: 400 },
      );
    }
    filter.status = status;
  }

  const category = searchParams.get("category");
  if (category) filter.category = category;

  // Date range filter (inclusive) on `date`.
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const dateRange: Record<string, Date> = {};
  if (from) {
    const d = new Date(from);
    if (Number.isNaN(d.getTime())) {
      return Response.json(
        { ok: false, error: "Invalid 'from' date." },
        { status: 400 },
      );
    }
    dateRange.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (Number.isNaN(d.getTime())) {
      return Response.json(
        { ok: false, error: "Invalid 'to' date." },
        { status: 400 },
      );
    }
    dateRange.$lte = d;
  }
  if (Object.keys(dateRange).length > 0) filter.date = dateRange;

  try {
    await connectToDatabase();
    const docs = await Expense.find(filter)
      .sort({ date: -1 }) // most recent first
      .lean<(ExpenseDocument & { _id: unknown })[]>();

    const expenses = docs.map(toExpense);
    return Response.json({
      ok: true,
      expenses,
      summary: computeSummary(expenses),
    });
  } catch (err) {
    console.error("[panel/budget] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load expenses." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = validateCreate(body);
  if (!parsed.ok) {
    return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { role, subteam: ownSubteam } = gate.session.user;

  // Resolve the target subteam under role-based scoping (IDOR boundary).
  let subteam: string | undefined;
  if (role === "lead") {
    if (!ownSubteam) {
      return Response.json(
        { ok: false, error: "Lead has no subteam assigned." },
        { status: 403 },
      );
    }
    if (parsed.data.subteam && parsed.data.subteam !== ownSubteam) {
      return Response.json(
        {
          ok: false,
          error: "A lead can only submit expenses for their own subteam.",
        },
        { status: 403 },
      );
    }
    subteam = ownSubteam;
  } else {
    subteam = parsed.data.subteam;
  }

  try {
    await connectToDatabase();
    const created = await Expense.create({
      ...parsed.data,
      subteam,
      // A new expense is always pending; approval is a separate admin action.
      status: "pending",
      // submittedBy is server-assigned from the session — never from body.
      submittedBy: gate.session.user.id,
    });

    return Response.json(
      {
        ok: true,
        expense: toExpense(created as ExpenseDocument & { _id: unknown }),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[panel/budget] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create expense." },
      { status: 500 },
    );
  }
}
