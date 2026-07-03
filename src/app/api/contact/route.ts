import { notifyContactMessage } from "@/lib/utils/mail";
import type { ContactInput } from "@/types";

/**
 * POST /api/contact
 *
 * Public endpoint consumed by the İletişim (Contact) page (task 1.6).
 * Mail-only: the message is forwarded to the team via Resend (best-effort).
 * There is intentionally NO database persistence for contact messages (see
 * ./README.md). Mirrors the applications (1.B1) response contract.
 */

// Field length caps — minimal defensive limits until the zod schema lands.
const LIMITS = {
  name: 120,
  email: 254, // RFC 5321 max email length
  subject: 200,
  message: 5000,
} as const;

// Pragmatic email check; the authoritative validation arrives with zod (1.Q1).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Minimal, safe server-side validation of the request body.
 *
 * TODO(1.Q1): replace this with the shared zod schema from `src/lib/validation`
 * (owned by Security & QA) once it exists, instead of these hand-rolled checks.
 */
function validate(
  body: unknown,
): { ok: true; data: ContactInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { name, email, subject, message } = body as Record<string, unknown>;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(message)
  ) {
    return {
      ok: false,
      error: "Fields name, email and message are required.",
    };
  }

  // `subject` is optional, but when present it must be a string.
  if (subject !== undefined && typeof subject !== "string") {
    return { ok: false, error: "Field subject must be a string." };
  }

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Invalid email address." };
  }

  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    (typeof subject === "string" && subject.length > LIMITS.subject) ||
    message.length > LIMITS.message
  ) {
    return { ok: false, error: "One or more fields exceed the maximum length." };
  }

  const trimmedSubject =
    typeof subject === "string" ? subject.trim() : undefined;

  return {
    ok: true,
    data: {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      ...(trimmedSubject ? { subject: trimmedSubject } : {}),
    },
  };
}

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

  const result = validate(body);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  // Best-effort notification — a mail failure must not fail the request.
  // With no DB persistence, a soft-skipped mail still returns success: the
  // contract is "we accepted your message", not "we guaranteed delivery".
  await notifyContactMessage(result.data);

  return Response.json({ ok: true }, { status: 201 });
}
