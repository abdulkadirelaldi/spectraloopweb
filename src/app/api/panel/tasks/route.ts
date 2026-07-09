import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole, requireApiSession } from "@/lib/auth/guard";
import { Task, type TaskDocument } from "@/models/Task";
import { toTask } from "./shared";
import {
  panelTaskCreateSchema,
  firstErrorMessage,
  TASK_STATUSES,
} from "@/lib/validation";

/**
 * Panel tasks collection — /api/panel/tasks
 *
 * GET  — list tasks. Any authenticated panel user may READ across all subteams
 *        (PROGRAM.md §8: lead + member "read everyone"). Optional query filters:
 *        `subteam`, `status`, `assignee`.
 * POST — create a task. admin + lead only. A lead's task is pinned to the lead's
 *        own subteam (an attempt to target another subteam is rejected).
 *
 * See ./README.md for the full RBAC + response contract.
 */

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const filter: Record<string, string> = {};

  const subteam = searchParams.get("subteam");
  if (subteam) filter.subteam = subteam;

  const assignee = searchParams.get("assignee");
  if (assignee) filter.assigneeId = assignee;

  const status = searchParams.get("status");
  if (status) {
    if (!TASK_STATUSES.includes(status as never)) {
      return Response.json(
        { ok: false, error: "Invalid status filter." },
        { status: 400 },
      );
    }
    filter.status = status;
  }

  try {
    await connectToDatabase();
    const docs = await Task.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .lean<(TaskDocument & { _id: unknown })[]>();

    return Response.json({ ok: true, tasks: docs.map(toTask) });
  } catch (err) {
    console.error("[panel/tasks] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load tasks." },
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

  const parsed = panelTaskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  const { role, subteam: ownSubteam } = gate.session.user;

  // Resolve the target subteam under role-based scoping (IDOR boundary).
  let subteam: string;
  if (role === "lead") {
    if (!ownSubteam) {
      return Response.json(
        { ok: false, error: "Lead has no subteam assigned." },
        { status: 403 },
      );
    }
    // A lead may only create within their own subteam.
    if (parsed.data.subteam && parsed.data.subteam !== ownSubteam) {
      return Response.json(
        {
          ok: false,
          error: "A lead can only create tasks for their own subteam.",
        },
        { status: 403 },
      );
    }
    subteam = ownSubteam;
  } else {
    // admin: subteam must be specified explicitly.
    if (!parsed.data.subteam) {
      return Response.json(
        { ok: false, error: "Field subteam is required." },
        { status: 400 },
      );
    }
    subteam = parsed.data.subteam;
  }

  try {
    await connectToDatabase();
    const created = await Task.create({
      ...parsed.data,
      subteam,
      // createdBy is server-assigned from the session — never trusted from body.
      createdBy: gate.session.user.id,
    });

    return Response.json(
      { ok: true, task: toTask(created as TaskDocument & { _id: unknown }) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[panel/tasks] Failed to create:", err);
    return Response.json(
      { ok: false, error: "Could not create task." },
      { status: 500 },
    );
  }
}
