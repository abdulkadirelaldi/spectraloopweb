import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

/**
 * Auth.js (NextAuth v5) TypeScript module augmentation.
 *
 * Adds our domain fields (`role`, `subteam`, `id`) onto the Auth.js `User`,
 * `Session.user`, and `JWT` shapes so the panel's RBAC/UI can read
 * `session.user.role` with full type safety.
 *
 * This augments Auth.js's own module types only — it does NOT touch the shared
 * `@/types` domain types (those are chief-coordinated). `Role` is imported from
 * `@/types` so the role union stays the single source of truth.
 */

declare module "next-auth" {
  /** Object returned by `authorize()` and passed to the `jwt` callback. */
  interface User {
    role: Role;
    /** Subteam id (FK -> Subteam.id). Absent for admins. */
    subteam?: string;
  }

  /** The session exposed to the client / server components. */
  interface Session {
    user: {
      id: string;
      role: Role;
      subteam?: string;
    } & DefaultSession["user"];
  }
}

// JWT is declared in `@auth/core/jwt`; `next-auth/jwt` only re-exports it, so we
// augment the declaring module for interface merging to take effect.
declare module "@auth/core/jwt" {
  /** Encrypted JWT payload (session strategy: "jwt"). */
  interface JWT {
    id: string;
    role: Role;
    subteam?: string;
  }
}

// Ensure this file is treated as a module so the `declare module` blocks apply.
export {};
