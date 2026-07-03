/**
 * Public navigation config — single source for header and footer links.
 * Paths follow PROGRAM.md §3 route folders; pages land in tasks 1.2+.
 */
export type NavLink = {
  href: string;
  label: string;
};

export const NAV_LINKS: readonly NavLink[] = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/arac", label: "Araç" },
  { href: "/basarilar", label: "Başarılar" },
  { href: "/ekipler", label: "Ekipler" },
  { href: "/sponsorluk", label: "Sponsorluk" },
  { href: "/haberler", label: "Haberler" },
  { href: "/iletisim", label: "İletişim" },
];

/** Primary call-to-action link, highlighted separately from the main nav. */
export const CTA_LINK: NavLink = { href: "/katil", label: "Bize Katıl" };
