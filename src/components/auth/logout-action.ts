"use server";

import { signOut } from "@/lib/auth";

/** Sign out and return to the login page. Used by `LogoutButton`. */
export async function logoutAction() {
  await signOut({ redirectTo: "/giris" });
}
