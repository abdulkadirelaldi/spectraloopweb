/**
 * Dependency-free auth constants.
 *
 * Kept separate from `./index` (which pulls in NextAuth + Mongoose) so the
 * proxy can import these without dragging the whole auth/DB graph into the
 * proxy bundle.
 */

/** Frontend-owned sign-in page (task 2.F0). Auth.js redirects here. */
export const SIGN_IN_PATH = "/giris";

/**
 * Auth.js session-cookie names. Auth.js prefixes the cookie with `__Secure-`
 * when it issues it over HTTPS (production), and uses the bare name over HTTP
 * (local dev). We check both for the optimistic proxy gate.
 */
export const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;
