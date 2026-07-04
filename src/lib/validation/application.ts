import { z } from "zod";

/**
 * Authoritative validation schema for the public "Bize Katıl" application form.
 * Mirrors the contract in `src/app/api/applications/README.md` and the shared
 * `ApplicationInput` type in `@/types` exactly.
 *
 * Backend binds this in task 1.B5, replacing the interim hand-rolled validate().
 *
 * Notes:
 * - Strings are trimmed before length checks so " " does not pass `min(1)`.
 * - Unknown keys are stripped (zod default), so a client cannot smuggle
 *   server-assigned fields (`status`, `id`, `createdAt`) through the form body.
 */
export const APPLICATION_LIMITS = {
  name: { min: 1, max: 120 },
  email: { max: 254 },
  subteamPref: { min: 1, max: 120 },
  message: { min: 1, max: 5000 },
} as const;

export const applicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(APPLICATION_LIMITS.name.min, "Name is required.")
    .max(APPLICATION_LIMITS.name.max, "Name is too long."),
  email: z
    .email({ message: "Invalid email address." })
    .max(APPLICATION_LIMITS.email.max, "Email is too long."),
  subteamPref: z
    .string()
    .trim()
    .min(APPLICATION_LIMITS.subteamPref.min, "Preferred subteam is required.")
    .max(APPLICATION_LIMITS.subteamPref.max, "Preferred subteam is too long."),
  message: z
    .string()
    .trim()
    .min(APPLICATION_LIMITS.message.min, "Message is required.")
    .max(APPLICATION_LIMITS.message.max, "Message is too long."),
});

/** Parsed/validated application input (structurally equal to `@/types` ApplicationInput). */
export type ApplicationInput = z.infer<typeof applicationSchema>;
