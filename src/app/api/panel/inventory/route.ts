import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { Inventory, type InventoryDocument } from "@/models/Inventory";
import { INVENTORY_STATUSES, toInventory, validateCreate } from "./shared";

/**
 * Panel inventory collection — /api/panel/inventory
 *
 * GET  — list items. Any authenticated user reads (member+). Optional query
 *        filters: `category`, `subteam`, `status`, `q` (search name/category).
 * POST — create an item. admin + lead only. A lead's item is pinned to the
 *        lead's own subteam. `createdBy` = session user id.
 *
 * See ./README.md for the full RBAC + IDOR contract.
 */

/** Escape user input before using it in a RegExp (avoids injection / ReDoS). */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const filter: Record<string, unknown> = {};

  const category = searchParams.get("category");
  if (category) filter.category = category;

  const subteam = searchParams.get("subteam");
  if (subteam) filter.subteam = subteam;

  const status = searchParams.get("status");
  if (status) {
    if (!INVENTORY_STATUSES.includes(status as never)) {
      return Response.json(
        { ok: false, error: "Invalid status filter." },
        { status: 400 },
      );
    }
    filter.status = status;
  }

  const q = searchParams.get("q");
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ name: rx }, { category: rx }];
  }

  try {
    await connectToDatabase();
    const docs = await Inventory.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .lean<(InventoryDocument & { _id: unknown })[]>();

    return Response.json({ ok: true, items: docs.map(toInventory) });
  } catch (err) {
    console.error("[panel/inventory] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load inventory." },
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
          error: "A lead can only add inventory for their own subteam.",
        },
        { status: 403 },
      );
    }
    subteam = ownSubteam;
  } else {
    // admin: subteam optional (may be general / cross-team stock).
    subteam = parsed.data.subteam;
  }

  try {
    await connectToDatabase();
    const created = await Inventory.create({
      ...parsed.data,
      subteam,
      // createdBy is server-assigned from the session — never trusted from body.
      createdBy: gate.session.user.id,
    });

    return Response.json(
      {
        ok: true,
        item: toInventory(created as InventoryDocument & { _id: unknown }),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[panel/inventory] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create inventory item." },
      { status: 500 },
    );
  }
}
