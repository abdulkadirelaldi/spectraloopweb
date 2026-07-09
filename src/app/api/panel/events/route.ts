import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { EventModel, type EventDocument } from "@/models/Event";
import { toEvent } from "./shared";
import {
  panelEventCreateSchema,
  firstErrorMessage,
  EVENT_TYPES,
} from "@/lib/validation";

/**
 * Panel events collection — /api/panel/events
 *
 * GET  — list events. Any authenticated user reads (member+). Optional query
 *        filter: `type`. Sorted by `date` ascending (soonest first).
 * POST — create an event. admin + lead only. Events are not subteam-scoped.
 *
 * See ./README.md for the full RBAC + response contract.
 */

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const filter: Record<string, string> = {};

  const type = searchParams.get("type");
  if (type) {
    if (!EVENT_TYPES.includes(type as never)) {
      return Response.json(
        { ok: false, error: "Invalid type filter." },
        { status: 400 },
      );
    }
    filter.type = type;
  }

  try {
    await connectToDatabase();
    const docs = await EventModel.find(filter)
      .sort({ date: 1 }) // soonest first
      .lean<(EventDocument & { _id: unknown })[]>();

    return Response.json({ ok: true, events: docs.map(toEvent) });
  } catch (err) {
    console.error("[panel/events] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load events." },
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

  const parsed = panelEventCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const created = await EventModel.create(parsed.data);

    return Response.json(
      { ok: true, event: toEvent(created as EventDocument & { _id: unknown }) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[panel/events] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create event." },
      { status: 500 },
    );
  }
}
