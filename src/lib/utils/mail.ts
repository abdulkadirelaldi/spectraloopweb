import { Resend } from "resend";

/**
 * Thin Resend wrapper for transactional/notification emails.
 *
 * Env keys:
 * - `RESEND_API_KEY`   — Resend API key. If unset, sending is skipped (no throw).
 * - `MAIL_FROM`        — sender address (defaults to Resend's onboarding sender).
 * - `TEAM_NOTIFY_EMAIL`— recipient for internal team notifications.
 *
 * Design rule: email is best-effort. Callers (e.g. the applications endpoint)
 * must NOT fail their main operation just because mail could not be sent — this
 * helper swallows/soft-reports errors and never throws.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM ?? "Spectraloop <onboarding@resend.dev>";
const TEAM_NOTIFY_EMAIL = process.env.TEAM_NOTIFY_EMAIL;

export interface SendMailResult {
  sent: boolean;
  /** Reason when `sent` is false (e.g. "missing RESEND_API_KEY"). */
  skippedReason?: string;
}

interface SendMailOptions {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
}

/**
 * Send a plain-text email. Returns `{ sent: false, skippedReason }` instead of
 * throwing when the key is missing or Resend errors.
 */
export async function sendMail(
  options: SendMailOptions,
): Promise<SendMailResult> {
  if (!RESEND_API_KEY) {
    return { sent: false, skippedReason: "missing RESEND_API_KEY" };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      replyTo: options.replyTo,
    });

    if (error) {
      // Do not leak provider internals to callers/clients; log server-side only.
      console.error("[mail] Resend returned an error:", error.message);
      return { sent: false, skippedReason: "resend error" };
    }

    return { sent: true };
  } catch (err) {
    console.error("[mail] Failed to send email:", err);
    return { sent: false, skippedReason: "send threw" };
  }
}

/**
 * Notify the team about a new "Bize Katıl" application. No-op (soft-skip) when
 * `TEAM_NOTIFY_EMAIL` or `RESEND_API_KEY` is missing.
 */
export async function notifyNewApplication(input: {
  name: string;
  email: string;
  subteamPref: string;
  message: string;
}): Promise<SendMailResult> {
  if (!TEAM_NOTIFY_EMAIL) {
    return { sent: false, skippedReason: "missing TEAM_NOTIFY_EMAIL" };
  }

  const text = [
    "Yeni bir 'Bize Katıl' başvurusu alındı:",
    "",
    `İsim:            ${input.name}`,
    `E-posta:         ${input.email}`,
    `Tercih (birim):  ${input.subteamPref}`,
    "",
    "Mesaj:",
    input.message,
  ].join("\n");

  return sendMail({
    to: TEAM_NOTIFY_EMAIL,
    subject: `Yeni başvuru: ${input.name}`,
    text,
    // Let the team reply straight to the applicant.
    replyTo: input.email,
  });
}

/**
 * Forward a contact-form ("İletişim") message to the team. No-op (soft-skip)
 * when `TEAM_NOTIFY_EMAIL` or `RESEND_API_KEY` is missing. Reuses the same env
 * keys as {@link notifyNewApplication}.
 */
export async function notifyContactMessage(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<SendMailResult> {
  if (!TEAM_NOTIFY_EMAIL) {
    return { sent: false, skippedReason: "missing TEAM_NOTIFY_EMAIL" };
  }

  const text = [
    "Yeni bir iletişim mesajı alındı:",
    "",
    `İsim:     ${input.name}`,
    `E-posta:  ${input.email}`,
    `Konu:     ${input.subject ?? "(belirtilmedi)"}`,
    "",
    "Mesaj:",
    input.message,
  ].join("\n");

  return sendMail({
    to: TEAM_NOTIFY_EMAIL,
    subject: input.subject
      ? `İletişim: ${input.subject}`
      : `İletişim mesajı: ${input.name}`,
    text,
    // Let the team reply straight to the sender.
    replyTo: input.email,
  });
}
