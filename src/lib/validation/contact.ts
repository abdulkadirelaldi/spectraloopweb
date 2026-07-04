import { z } from "zod";

/**
 * Authoritative validation schema for the public İletişim (Contact) form.
 * Mirrors the contract in `src/app/api/contact/README.md` and the shared
 * `ContactInput` type in `@/types` exactly. `subject` is optional (≤200).
 *
 * Backend binds this in task 1.B5, replacing the interim hand-rolled validate().
 * Unknown keys are stripped (zod default) — see application.ts for rationale.
 */
export const CONTACT_LIMITS = {
  name: { min: 1, max: 120 },
  email: { max: 254 },
  subject: { max: 200 },
  message: { min: 1, max: 5000 },
} as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.name.min, "Name is required.")
    .max(CONTACT_LIMITS.name.max, "Name is too long."),
  email: z
    .email({ message: "Invalid email address." })
    .max(CONTACT_LIMITS.email.max, "Email is too long."),
  subject: z
    .string()
    .trim()
    .max(CONTACT_LIMITS.subject.max, "Subject is too long.")
    .optional(),
  message: z
    .string()
    .trim()
    .min(CONTACT_LIMITS.message.min, "Message is required.")
    .max(CONTACT_LIMITS.message.max, "Message is too long."),
});

/** Parsed/validated contact input (structurally equal to `@/types` ContactInput). */
export type ContactInput = z.infer<typeof contactSchema>;
