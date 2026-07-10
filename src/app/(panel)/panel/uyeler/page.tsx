import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelPageHeader } from "@/components/panel";
import {
  MembersManager,
  type MemberView,
} from "@/components/panel/MembersManager";
import type { Role } from "@/types";

export const metadata: Metadata = {
  title: "Üyeler — Panel",
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function fetchMembers(): Promise<{
  members: MemberView[];
  error: boolean;
}> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${getBaseUrl()}/api/panel/members`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      members?: MemberView[];
    } | null;
    if (res.ok && data?.ok && Array.isArray(data.members)) {
      return { members: data.members, error: false };
    }
    return { members: [], error: true };
  } catch {
    return { members: [], error: true };
  }
}

export default async function PanelMembersPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";
  const userSubteam = session?.user?.subteam;

  const { members, error } = await fetchMembers();

  const subteamOptions = Array.from(
    new Set(members.map((m) => m.subteam).filter((s): s is string => !!s)),
  ).sort();

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Üyeler"
        description={
          role === "admin"
            ? "Üye dizinini görüntüleyin; üye ekleyin, rollerini ve durumlarını yönetin."
            : "Takım üye dizinini görüntüleyin."
        }
      />
      <MembersManager
        role={role}
        userSubteam={userSubteam}
        subteamOptions={subteamOptions}
        initialMembers={members}
        initialError={error}
      />
    </div>
  );
}
