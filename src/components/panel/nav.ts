import type { Role } from "@/types";

/**
 * Panel navigation config — single source for the sidebar. New panel pages
 * (2.F2–2.F5) are added here. `minRole` hides an item below that role in the
 * hierarchy (UX only — the API is the real security boundary).
 */
export type PanelNavItem = {
  href: string;
  label: string;
  /** Icon key resolved in the sidebar. */
  icon: PanelIconKey;
  /** Lowest role that may see this item (default: everyone). */
  minRole?: Role;
};

export type PanelIconKey =
  | "dashboard"
  | "announcements"
  | "tasks"
  | "documents"
  | "calendar"
  | "members"
  | "applications";

const RANK: Record<Role, number> = { member: 1, lead: 2, admin: 3 };

export const PANEL_NAV: readonly PanelNavItem[] = [
  { href: "/panel", label: "Panel", icon: "dashboard" },
  { href: "/panel/duyurular", label: "Duyurular", icon: "announcements" },
  { href: "/panel/gorevler", label: "Görevler", icon: "tasks" },
  { href: "/panel/dokumanlar", label: "Dokümanlar", icon: "documents" },
  { href: "/panel/takvim", label: "Takvim", icon: "calendar" },
  { href: "/panel/uyeler", label: "Üyeler", icon: "members" },
  // Applications hold applicant PII → lead and up only (members never see it).
  {
    href: "/panel/basvurular",
    label: "Başvurular",
    icon: "applications",
    minRole: "lead",
  },
];

/** Nav items visible to `role`, honoring each item's `minRole`. */
export function visibleNavFor(role: Role): PanelNavItem[] {
  return PANEL_NAV.filter(
    (item) => !item.minRole || RANK[role] >= RANK[item.minRole],
  );
}

/** Human-readable Turkish role labels for the UI. */
export const ROLE_LABEL: Record<Role, string> = {
  admin: "Yönetici",
  lead: "Birim Lideri",
  member: "Üye",
};
