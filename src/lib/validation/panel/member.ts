import { z } from "zod";

import {
  ROLES,
  UPDATE_EMPTY_MESSAGE,
  clearableText,
  emailField,
  hasAtLeastOneField,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel member input schemas — mirror `api/panel/members/shared.ts`.
 * name 1–120, email valid ≤254 (lowercased), password 8–200 (optional),
 * role enum (default "member"), subteam ≤120, photoUrl ≤2048 (length-checked
 * string, NOT a URL — see below), active boolean (default true).
 *
 * SECURITY — SHAPE only, not privilege:
 * - `password` is validated for length here but hashing (bcrypt) happens in the
 *   route; a plaintext password is never stored/logged.
 * - Accepting `role`/`active`/`subteam` does NOT authorize changing them: role
 *   assignment + (de)activation are admin-only, a lead may edit only `name`/
 *   `photoUrl` of own-subteam members, and the last-admin guard all live in the
 *   route (see README "Privilege-escalation & safety rules").
 * - `photoUrl` matches the Backend check: a length-capped string, NOT a URL.
 */
const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(200, "Password is too long.");

export const panelMemberCreateSchema = z.object({
  name: requiredText(120, "Name"),
  email: emailField(),
  password: password.optional(),
  role: z.enum(ROLES).optional().default("member"),
  subteam: optionalText(120, "subteam"),
  photoUrl: optionalText(2048, "photoUrl"),
  active: z.boolean().optional().default(true),
});

export const panelMemberUpdateSchema = z
  .object({
    name: optionalText(120, "name"),
    email: emailField().optional(),
    password: password.optional(),
    role: z.enum(ROLES).optional(),
    subteam: clearableText(120, "subteam"),
    photoUrl: clearableText(2048, "photoUrl"),
    active: z.boolean().optional(),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelMemberCreate = z.infer<typeof panelMemberCreateSchema>;
export type PanelMemberUpdate = z.infer<typeof panelMemberUpdateSchema>;
