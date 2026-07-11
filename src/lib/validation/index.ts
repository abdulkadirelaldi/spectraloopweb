/**
 * Public form validation — single entry point.
 *
 * Import from `@/lib/validation`:
 *   import { applicationSchema, contactSchema, firstErrorMessage } from "@/lib/validation";
 *
 * Backend (task 1.B5) uses `applicationSchema` / `contactSchema` with
 * `.safeParse()` and maps failures to a human-safe `error` string via
 * `firstErrorMessage`.
 */
import type { z } from "zod";
import type {
  ApplicationInput as ContractApplicationInput,
  ContactInput as ContractContactInput,
} from "@/types";
import { applicationSchema } from "./application";
import { contactSchema } from "./contact";

export {
  applicationSchema,
  APPLICATION_LIMITS,
  type ApplicationInput,
} from "./application";
export { contactSchema, CONTACT_LIMITS, type ContactInput } from "./contact";

// Panel input schemas (task 2.Q0) — bound by Backend in 2.B6.
export * from "./panel";

// Upload request validation + key hygiene (task 3.S1) — bound by Backend in 3.B6.
export * from "./upload";

/**
 * Returns the first validation issue's message — a human-safe string with no
 * internal details. Falls back to a generic message for an empty error.
 */
export function firstErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

/* -------------------------------------------------------------------------- */
/* Compile-time guards: keep the schemas in lock-step with the shared @/types  */
/* contract. If a schema and its `@/types` counterpart ever diverge, one of     */
/* these assignments stops compiling (caught by `npm run build`).               */
/* -------------------------------------------------------------------------- */

// Invariant type equality (stricter than mutual `extends`; respects optionality).
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _applicationMatchesContract: Equals<
  z.infer<typeof applicationSchema>,
  ContractApplicationInput
> = true;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _contactMatchesContract: Equals<
  z.infer<typeof contactSchema>,
  ContractContactInput
> = true;
