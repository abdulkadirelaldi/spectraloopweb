import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/db/connect";
import { requireApiSession } from "@/lib/auth/guard";
import { Task, type TaskDocument } from "@/models/Task";
import { toTask } from "../shared";
import { panelTaskUpdateSchema, firstErrorMessage } from "@/lib/validation";

/**
 * Single panel task — /api/panel/tasks/[id]
 *
 * GET    — read one. Any authenticated panel user (reads are open, §8).
 * PATCH  — update. Role-scoped (IDOR-guarded):
 *            • admin  → any field, any task.
 *            • lead   → tasks in their OWN subteam only; cannot move to another.
 *            • member → ONLY the `status` of a task assigned to them.
 * DELETE — admin (any) or lead (own subteam only). member forbidden.
 *
 * See ../README.md for the full RBAC + IDOR contract.
 */

type Ctx = { params: Promise<{ id: string }> };

function invalidId(): Response {
  return Response.json(
    { ok: false, error: "Invalid task id." },
    { status: 400 },
  );
}

function notFound(): Response {
  return Response.json(
    { ok: false, error: "Task not found." },
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
    const doc = await Task.findById(id).lean<
      (TaskDocument & { _id: unknown }) | null
    >();
    if (!doc) return notFound();

    return Response.json({ ok: true, task: toTask(doc) });
  } catch (err) {
    console.error("[panel/tasks/:id] Failed to read:", err);
    return Response.json(
      { ok: false, error: "Could not load task." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
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

  const parsed = panelTaskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const patch = parsed.data;

  const { role, id: userId, subteam: ownSubteam } = gate.session.user;

  try {
    await connectToDatabase();
    const task = await Task.findById(id).lean<
      (TaskDocument & { _id: unknown }) | null
    >();
    if (!task) return notFound();

    // --- Role-scoped authorization (IDOR boundary) ---
    if (role === "member") {
      // A member may only change the status of their OWN task.
      const onlyStatus =
        Object.keys(patch).length === 1 && patch.status !== undefined;
      if (!onlyStatus) {
        return forbidden("A member can only change the status of their task.");
      }
      if (task.assigneeId !== userId) {
        return forbidden("A member can only update tasks assigned to them.");
      }
    } else if (role === "lead") {
      // A lead may only touch tasks in their own subteam...
      if (!ownSubteam || task.subteam !== ownSubteam) {
        return forbidden("A lead can only update tasks in their own subteam.");
      }
      // ...and may not move a task out of their subteam.
      if (patch.subteam !== undefined && patch.subteam !== ownSubteam) {
        return forbidden("A lead cannot move a task to another subteam.");
      }
    }
    // admin: no restriction.

    const updated = await Task.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean<(TaskDocument & { _id: unknown }) | null>();
    if (!updated) return notFound();

    return Response.json({ ok: true, task: toTask(updated) });
  } catch (err) {
    console.error("[panel/tasks/:id] Failed to update:", err);
    return Response.json(
      { ok: false, error: "Could not update task." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, ctx: Ctx): Promise<Response> {
  const gate = await requireApiSession();
  if (!gate.ok) return gate.response;

  const { role, subteam: ownSubteam } = gate.session.user;
  if (role === "member") {
    return forbidden("A member cannot delete tasks.");
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return invalidId();

  try {
    await connectToDatabase();
    const task = await Task.findById(id).lean<
      (TaskDocument & { _id: unknown }) | null
    >();
    if (!task) return notFound();

    // A lead may only delete tasks in their own subteam; admin any.
    if (role === "lead" && (!ownSubteam || task.subteam !== ownSubteam)) {
      return forbidden("A lead can only delete tasks in their own subteam.");
    }

    await Task.findByIdAndDelete(id);
    return Response.json({ ok: true, id });
  } catch (err) {
    console.error("[panel/tasks/:id] Failed to delete:", err);
    return Response.json(
      { ok: false, error: "Could not delete task." },
      { status: 500 },
    );
  }
}
