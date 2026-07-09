import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PanelChrome } from "@/components/panel/PanelChrome";
import { visibleNavFor } from "@/components/panel/nav";

/**
 * Protected panel layout (server). Layered security (PROGRAM.md §11): the proxy
 * gate is optimistic, so we re-check the real session here with `auth()`. No
 * session (or an auth infra error) → send the user to the login page.
 */
export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth().catch(() => null);
  if (!session?.user) {
    redirect("/giris?callbackUrl=/panel");
  }

  const { role } = session.user;
  const navItems = visibleNavFor(role);

  return (
    <PanelChrome
      user={{
        name: session.user.name,
        email: session.user.email,
        role,
      }}
      navItems={navItems}
    >
      {children}
    </PanelChrome>
  );
}
