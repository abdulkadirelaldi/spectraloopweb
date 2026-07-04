import { notifyContactMessage } from "@/lib/utils/mail";
import { contactSchema, firstErrorMessage } from "@/lib/validation";

/**
 * POST /api/contact
 *
 * Public endpoint consumed by the İletişim (Contact) page (task 1.6).
 * Mail-only: the message is forwarded to the team via Resend (best-effort).
 * There is intentionally NO database persistence for contact messages (see
 * ./README.md). Mirrors the applications (1.B1) response contract.
 *
 * Body validation is delegated to the authoritative `contactSchema` from
 * `@/lib/validation` (owned by Security & QA).
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: firstErrorMessage(parsed.error) },
      { status: 400 },
    );
  }

  // Best-effort notification — a mail failure must not fail the request.
  // With no DB persistence, a soft-skipped mail still returns success: the
  // contract is "we accepted your message", not "we guaranteed delivery".
  await notifyContactMessage(parsed.data);

  return Response.json({ ok: true }, { status: 201 });
}
