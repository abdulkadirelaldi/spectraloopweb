import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelPageHeader } from "@/components/panel";
import { DocumentsManager } from "@/components/panel/DocumentsManager";
import type { Document, Role } from "@/types";

export const metadata: Metadata = {
  title: "Dokümanlar — Panel",
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

export default async function PanelDocumentsPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";
  const userSubteam = session?.user?.subteam;
  const canCreate = role === "admin" || role === "lead";

  const cookieHeader = (await cookies()).toString();
  const [docsRes, membersRes] = await Promise.all([
    panelGet<{ ok?: boolean; documents?: Document[] }>(
      "/api/panel/documents",
      cookieHeader,
    ),
    panelGet<{ ok?: boolean; members?: MemberView[] }>(
      "/api/panel/members",
      cookieHeader,
    ),
  ]);

  const documents =
    docsRes.ok && docsRes.data?.ok && Array.isArray(docsRes.data.documents)
      ? docsRes.data.documents
      : [];
  const documentsError = !(docsRes.ok && docsRes.data?.ok);

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
        title="Dokümanlar"
        description={
          canCreate
            ? "Doküman arşivini yönetin; bağlantı ile yeni doküman ekleyin."
            : "Takım doküman arşivini görüntüleyin."
        }
      />
      <DocumentsManager
        role={role}
        userSubteam={userSubteam}
        subteamOptions={subteamOptions}
        initialItems={documents}
        initialError={documentsError}
      />
    </div>
  );
}
