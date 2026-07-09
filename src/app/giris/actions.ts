"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type LoginState = { error: string | null };

/**
 * Only allow internal, non-protocol-relative paths as a post-login target,
 * to avoid open-redirect abuse via `?callbackUrl=`.
 */
function safeRedirectTo(raw: FormDataEntryValue | null): string {
  if (typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/panel";
}

/**
 * Credentials login server action (Auth.js v5). On success `signIn` throws a
 * redirect (NEXT_REDIRECT) which must propagate; on bad credentials it throws
 * an `AuthError`, which we map to a single, non-enumerating message.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectTo(formData.get("callbackUrl"));

  if (!email || !password) {
    return { error: "Lütfen e-posta ve parolanızı girin." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      // Same message regardless of unknown email vs. wrong password.
      return { error: "E-posta veya parola hatalı." };
    }
    // Re-throw NEXT_REDIRECT (successful login) and any other control-flow error.
    throw error;
  }

  // Unreachable on success (signIn redirects); kept for type completeness.
  return { error: null };
}
