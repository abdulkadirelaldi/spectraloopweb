import type { ApplicationStatus, BaseEntity } from "./common";

/**
 * "Bize Katıl" (Join Us) application. Source: PROGRAM.md §8
 * `Application { name, email, subteamPref, message, status, createdAt }`.
 */
export interface Application extends BaseEntity {
  name: string;
  email: string;
  /** Preferred subteam (free text or subteam name from the public form). */
  subteamPref: string;
  message: string;
  status: ApplicationStatus;
}

/**
 * Request body posted by the public "Bize Katıl" form (task 1.B1).
 * `status`, `id`, and `createdAt` are assigned server-side, not by the client.
 */
export type ApplicationInput = Pick<
  Application,
  "name" | "email" | "subteamPref" | "message"
>;
