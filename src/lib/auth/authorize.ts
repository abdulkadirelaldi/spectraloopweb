import { connectToDatabase } from "@/lib/db/connect";
import { verifyPassword } from "@/lib/utils/password";
import { User } from "@/models/User";
import type { Role } from "@/types";

/** The object returned to Auth.js on a successful login (shape of augmented `User`). */
export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  subteam?: string;
}

/** Minimal projection of the User document needed to authenticate. */
type AuthUserRecord = {
  _id: unknown;
  name: string;
  email: string;
  passwordHash?: string | null;
  role: Role;
  subteam?: string | null;
  active: boolean;
};

/**
 * Credentials `authorize` implementation, extracted so it can be unit-tested
 * without booting Auth.js.
 *
 * Returns the user on success or `null` on ANY failure — unknown email,
 * inactive account, and wrong password are treated identically so the response
 * never enables account enumeration. Infra errors also fail closed to `null`,
 * and no credentials are ever logged.
 */
export async function authorizeCredentials(
  credentials: Partial<Record<"email" | "password", unknown>>,
): Promise<AuthorizedUser | null> {
  const email =
    typeof credentials?.email === "string"
      ? credentials.email.trim().toLowerCase()
      : "";
  const password =
    typeof credentials?.password === "string" ? credentials.password : "";

  if (!email || !password) return null;

  try {
    await connectToDatabase();

    // passwordHash is `select: false` on the schema, so opt in explicitly.
    const user = await User.findOne({ email })
      .select("+passwordHash")
      .lean<AuthUserRecord | null>();

    // Reject unknown or deactivated accounts (same null result as bad password).
    if (!user || user.active === false) return null;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      subteam: user.subteam ?? undefined,
    };
  } catch {
    // Fail closed on infra errors; never leak details or credentials.
    return null;
  }
}
