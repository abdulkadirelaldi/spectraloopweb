import { connectToDatabase } from "@/lib/db/connect";
import { Application } from "@/models/Application";
import { notifyNewApplication } from "@/lib/utils/mail";
import type { ApplicationInput } from "@/types";

/**
 * POST /api/applications
 *
 * Public endpoint consumed by the "Bize Katıl" (1.7) and Sponsorluk (1.5) forms.
 * Persists a new application and best-effort notifies the team via Resend.
 *
 * See ./README.md for the full request/response contract.
 */

// Field length caps — minimal defensive limits until the zod schema lands.
const LIMITS = {
  name: 120,
  email: 254, // RFC 5321 max email length
  subteamPref: 120,
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
): { ok: true; data: ApplicationInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { name, email, subteamPref, message } = body as Record<string, unknown>;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(subteamPref) ||
    !isNonEmptyString(message)
  ) {
    return {
      ok: false,
      error: "Fields name, email, subteamPref and message are required.",
    };
  }

  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Invalid email address." };
  }

  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    subteamPref.length > LIMITS.subteamPref ||
    message.length > LIMITS.message
  ) {
    return { ok: false, error: "One or more fields exceed the maximum length." };
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      email: email.trim(),
      subteamPref: subteamPref.trim(),
      message: message.trim(),
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

  let created;
  try {
    await connectToDatabase();
    created = await Application.create({
      ...result.data,
      status: "new",
    });
  } catch (err) {
    // Log server-side; never leak DB/internal details to the client.
    console.error("[applications] Failed to persist application:", err);
    return Response.json(
      { ok: false, error: "Could not save your application. Please try again." },
      { status: 500 },
    );
  }

  // Best-effort notification — a mail failure must not fail the request.
  await notifyNewApplication(result.data);

  return Response.json({ ok: true, id: String(created._id) }, { status: 201 });
}
