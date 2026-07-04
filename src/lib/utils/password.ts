import bcrypt from "bcryptjs";

/**
 * Password hashing helpers (bcryptjs).
 *
 * bcryptjs is a pure-JS implementation, so it works in any serverless/edge-less
 * Node runtime without native bindings. Security & QA's Auth.js `authorize()`
 * callback (task 2.S1) uses {@link verifyPassword} to check a submitted password
 * against the stored `passwordHash`.
 */

/** Cost factor for bcrypt. 12 is a sensible default (secure, ~sub-100ms). */
const SALT_ROUNDS = 12;

/** Hash a plaintext password for storage in `User.passwordHash`. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * Returns `false` (never throws) when the hash is empty/invalid, so callers can
 * treat "no credential on file" as a failed login.
 */
export async function verifyPassword(
  plain: string,
  hash: string | undefined | null,
): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
