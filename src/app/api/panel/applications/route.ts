import { connectToDatabase } from "@/lib/db/connect";
import { requireApiRole } from "@/lib/auth/guard";
import { Application, type ApplicationDocument } from "@/models/Application";
import { toApplication } from "./shared";
import { APPLICATION_STATUSES } from "@/lib/validation";

/**
 * Panel applications collection — /api/panel/applications
 *
 * GET — list applications ("Bize Katıl" submissions) for review. **admin + lead
 *       only** — applications contain applicant PII, so members cannot see them.
 *       Optional query filters: `status`, `q` (search name/email/subteamPref).
 *
 * The PUBLIC submission endpoint (POST /api/applications) is separate and
 * untouched — applications are created there, managed here.
 *
 * See ./README.md for the full RBAC + response contract.
 */

/** Escape user input before using it in a RegExp (avoids injection / ReDoS). */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request): Promise<Response> {
  const gate = await requireApiRole(["admin", "lead"]);
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const filter: Record<string, unknown> = {};

  const status = searchParams.get("status");
  if (status) {
    if (!APPLICATION_STATUSES.includes(status as never)) {
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
    filter.$or = [{ name: rx }, { email: rx }, { subteamPref: rx }];
  }

  try {
    await connectToDatabase();
    const docs = await Application.find(filter)
      .sort({ createdAt: -1 }) // newest first
      .lean<(ApplicationDocument & { _id: unknown })[]>();

    return Response.json({ ok: true, applications: docs.map(toApplication) });
  } catch (err) {
    console.error("[panel/applications] Failed to list:", err);
    return Response.json(
      { ok: false, error: "Could not load applications." },
      { status: 500 },
    );
  }
}
