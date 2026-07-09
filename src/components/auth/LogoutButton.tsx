"use client";

import { Button, type ButtonVariant } from "@/components/ui";
import { logoutAction } from "./logout-action";

/**
 * Drop-in sign-out button for the panel (task 2.F1+). Submits a server action
 * that calls Auth.js `signOut` and redirects to /giris.
 */
export function LogoutButton({
  className,
  variant = "outline",
  label = "Çıkış yap",
}: {
  className?: string;
  variant?: ButtonVariant;
  label?: string;
}) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant={variant} className={className}>
        {label}
      </Button>
    </form>
  );
}
