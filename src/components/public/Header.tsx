"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { cn } from "@/components/ui/cn";
import { Logo } from "./Logo";
import { CTA_LINK, NAV_LINKS } from "./nav-links";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => setOpen(false);

  // Intensify the header background/shadow once the page is scrolled. A passive
  // listener that only reads scrollY (no layout reads) keeps this cheap; an rAF
  // guard coalesces bursts of scroll events into one state update per frame.
  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 8);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled
          ? "border-border bg-background/90 shadow-sm backdrop-blur-md"
          : "border-transparent bg-background/70 backdrop-blur",
      )}
    >
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          {/* Desktop navigation */}
          <nav
            aria-label="Ana menü"
            className="hidden items-center gap-1 lg:flex"
          >
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-brand after:transition-transform after:duration-300",
                    active
                      ? "text-brand-600 after:scale-x-100 dark:text-brand-300"
                      : "text-muted after:scale-x-0 hover:text-foreground hover:after:scale-x-100",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block">
            <Button href={CTA_LINK.href} size="sm">
              {CTA_LINK.label}
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden dark:hover:bg-white/10"
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
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {/* Mobile navigation panel */}
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobil menü"
          className="border-t border-border bg-background lg:hidden"
        >
          <Container size="wide" className="py-4">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                        active
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200"
                          : "text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="mt-2">
                <Button
                  href={CTA_LINK.href}
                  onClick={closeMenu}
                  className="w-full"
                >
                  {CTA_LINK.label}
                </Button>
              </li>
            </ul>
          </Container>
        </nav>
      )}
    </header>
  );
}
