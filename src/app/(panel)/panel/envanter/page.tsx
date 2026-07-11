import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelPageHeader } from "@/components/panel";
import { InventoryManager } from "@/components/panel/InventoryManager";
import type { Inventory, Role } from "@/types";

export const metadata: Metadata = {
  title: "Envanter — Panel",
};

type MemberView = { subteam?: string };

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function panelGet<T>(
  path: string,
  cookieHeader: string,
): Promise<{ ok: boolean; data: T | null }> {
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export default async function PanelInventoryPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";
  const userSubteam = session?.user?.subteam;
  const canCreate = role === "admin" || role === "lead";

  const cookieHeader = (await cookies()).toString();
  const [invRes, membersRes] = await Promise.all([
    panelGet<{ ok?: boolean; items?: Inventory[] }>(
      "/api/panel/inventory",
      cookieHeader,
    ),
    panelGet<{ ok?: boolean; members?: MemberView[] }>(
      "/api/panel/members",
      cookieHeader,
    ),
  ]);

  const items =
    invRes.ok && invRes.data?.ok && Array.isArray(invRes.data.items)
      ? invRes.data.items
      : [];
  const itemsError = !(invRes.ok && invRes.data?.ok);

  const memberViews =
    membersRes.ok &&
    membersRes.data?.ok &&
    Array.isArray(membersRes.data.members)
      ? membersRes.data.members
      : [];
  const subteamOptions = Array.from(
    new Set(memberViews.map((m) => m.subteam).filter((s): s is string => !!s)),
  ).sort();

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Envanter"
        description={
          canCreate
            ? "Malzeme ve stokları takip edin; durum ve miktarları güncelleyin."
            : "Takım malzeme ve stok envanterini görüntüleyin."
        }
      />
      <InventoryManager
        role={role}
        userSubteam={userSubteam}
        subteamOptions={subteamOptions}
        initialItems={items}
        initialError={itemsError}
      />
    </div>
  );
}
