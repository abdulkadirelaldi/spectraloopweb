import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  PanelCard,
  PanelPageHeader,
  ROLE_LABEL,
  StatCard,
  visibleNavFor,
} from "@/components/panel";
import type { Role } from "@/types";

export const metadata: Metadata = {
  title: "Panel — Spectraloop",
};

function roleSummary(role: Role, subteam?: string): string {
  if (role === "admin") return "Yönetici olarak tüm birimlere erişebilirsin.";
  if (role === "lead")
    return `Birim liderisin${subteam ? ` — ${subteam}` : ""}. Biriminin görev ve dokümanlarını yönetebilirsin.`;
  return "Duyuruları, görevlerini ve dokümanları buradan takip edebilirsin.";
}

export default async function PanelDashboardPage() {
  const session = await auth().catch(() => null);
  const user = session?.user;
  const role: Role = user?.role ?? "member";
  const displayName = user?.name ?? user?.email ?? "Kullanıcı";

  // Quick links = visible nav minus the dashboard itself.
  const quickLinks = visibleNavFor(role).filter(
    (item) => item.href !== "/panel",
  );

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title={`Hoş geldin, ${displayName}`}
        description={`${ROLE_LABEL[role]} · ${roleSummary(role, user?.subteam)}`}
      />

      {/* Representative summary — deepens with live data in 2.F2+ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Birim"
          value={user?.subteam ?? (role === "admin" ? "Tümü" : "—")}
        />
        <StatCard label="Atanmış görev" value="0" hint="Yakında canlı veri" />
        <StatCard label="Yeni duyuru" value="0" hint="Yakında canlı veri" />
      </div>

      {/* Quick links to panel sections */}
      <PanelCard title="Hızlı erişim">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {quickLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-brand-500/10"
              >
                {item.label}
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
