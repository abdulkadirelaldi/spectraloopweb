import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { notifyNewApplication } from "@/lib/utils/mail";
import { applicationSchema, firstErrorMessage } from "@/lib/validation";

/**
 * POST /api/applications
 *
 * Public endpoint consumed by the "Bize Katıl" (1.7) and Sponsorluk (1.5) forms.
 * Persists a new application and best-effort notifies the team via Resend.
 *
 * Body validation is delegated to the authoritative `applicationSchema` from
 * `@/lib/validation` (owned by Security & QA). See ./README.md for the contract.
 */

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }
  const data = parsed.data;

  let created;
  try {
    await connectToDatabase();
    created = await Application.create({
      ...data,
      status: "new",
    });
  } catch (err) {
    // Log server-side; never leak DB/internal details to the client.
    console.error("[applications] Failed to persist application:", err);
    return Response.json(
      {
        ok: false,
        error: "Could not save your application. Please try again.",
      },
      { status: 500 },
    );
  }

  // Best-effort notification — a mail failure must not fail the request.
  await notifyNewApplication(data);

  return Response.json({ ok: true, id: String(created._id) }, { status: 201 });
}
