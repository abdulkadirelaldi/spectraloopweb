"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge, cn } from "@/components/ui";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { Role } from "@/types";
import { ROLE_LABEL, type PanelIconKey, type PanelNavItem } from "./nav";

type PanelUser = {
  name?: string | null;
  email?: string | null;
  role: Role;
};

const ICONS: Record<PanelIconKey, ReactNode> = {
  dashboard: (
    <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z" />
  ),
  announcements: (
    <path d="M4 9v6h3l6 4V5L7 9H4Zm13 3a4 4 0 0 0-2-3.5v7A4 4 0 0 0 17 12Z" />
  ),
  tasks: (
    <path d="M9 5h11M9 12h11M9 19h11M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2" />
  ),
  documents: <path d="M6 2h8l4 4v16H6V2Zm8 0v4h4M9 13h6M9 17h6" />,
  calendar: <path d="M3 8h18M7 3v3m10-3v3M5 5h14v16H5V5Z" />,
  members: (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 0a3 3 0 1 0 0-6M3 20a6 6 0 0 1 12 0M15 14a6 6 0 0 1 6 6" />
  ),
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/panel") return pathname === "/panel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
  items,
  pathname,
  onNavigate,
}: {
  items: readonly PanelNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-brand flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                  : "text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5",
              )}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 shrink-0"
              >
                {ICONS[item.icon]}
              </svg>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Brand() {
  return (
    <Link
      href="/panel"
      className="focus-visible:ring-brand flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="text-foreground text-lg font-bold tracking-tight">
        Spectra<span className="text-brand-500">loop</span>
      </span>
      <Badge variant="brand">Panel</Badge>
    </Link>
  );
}

export function PanelChrome({
  user,
  navItems,
  children,
}: {
  user: PanelUser;
  navItems: PanelNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);

  return (
    <div className="bg-background flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="border-border bg-surface hidden w-64 shrink-0 flex-col border-r lg:flex">
        <div className="border-border flex h-16 items-center border-b px-5">
          <Brand />
        </div>
        <nav aria-label="Panel menüsü" className="flex-1 overflow-y-auto p-3">
          <NavList items={navItems} pathname={pathname} />
        </nav>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={closeMenu}
            className="absolute inset-0 bg-black/40"
          />
          <div className="border-border bg-surface absolute top-0 left-0 flex h-full w-64 flex-col border-r">
            <div className="border-border flex h-16 items-center justify-between border-b px-5">
              <Brand />
            </div>
            <nav
              aria-label="Panel menüsü"
              className="flex-1 overflow-y-auto p-3"
            >
              <NavList
                items={navItems}
                pathname={pathname}
                onNavigate={closeMenu}
              />
            </nav>
          </div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-background/80 sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Menüyü aç"
            className="text-foreground focus-visible:ring-brand inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:ring-2 focus-visible:outline-none lg:hidden dark:hover:bg-white/10"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-6 w-6"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-foreground text-sm font-medium">
                {user.name ?? user.email ?? "Kullanıcı"}
              </p>
            </div>
            <Badge variant={user.role === "admin" ? "brand" : "neutral"}>
              {ROLE_LABEL[user.role]}
            </Badge>
            <LogoutButton variant="ghost" />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
