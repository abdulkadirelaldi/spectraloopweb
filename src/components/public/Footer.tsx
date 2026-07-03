import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CTA_LINK, NAV_LINKS } from "./nav-links";
import { Logo } from "./Logo";

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://www.linkedin.com", label: "LinkedIn" },
  { href: "https://x.com", label: "X" },
  { href: "https://www.youtube.com", label: "YouTube" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <Container size="wide" className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand blurb */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted">
              Spectraloop, geleceğin ulaşımını tasarlayan öğrenci hyperloop
              takımıdır. Mekanik, elektronik ve yazılım birimleriyle yüksek
              hızlı ulaşım teknolojileri geliştiriyoruz.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="text-sm font-semibold text-foreground">Site Haritası</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {[...NAV_LINKS, CTA_LINK].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & social */}
          <div>
            <h2 className="text-sm font-semibold text-foreground">İletişim</h2>
            <ul className="mt-4 flex flex-col gap-2">
              <li>
                <a
                  href="mailto:info@spectraloop.com"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  info@spectraloop.com
                </a>
              </li>
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-muted">
            © {year} Spectraloop. Tüm hakları saklıdır.
          </p>
        </div>
      </Container>
    </footer>
  );
}
