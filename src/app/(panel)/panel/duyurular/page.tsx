import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelPageHeader } from "@/components/panel";
import { AnnouncementsManager } from "@/components/panel/AnnouncementsManager";
import type { Announcement, Role } from "@/types";

export const metadata: Metadata = {
  title: "Duyurular — Panel",
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Server-side initial load. Forwards the session cookie so the protected API
 * authenticates the request. Never throws — failures resolve to an error flag
 * and the client manager offers a retry.
 */
async function fetchAnnouncements(): Promise<{
  items: Announcement[];
  error: boolean;
}> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${getBaseUrl()}/api/panel/announcements`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      announcements?: Announcement[];
    } | null;
    if (res.ok && data?.ok && Array.isArray(data.announcements)) {
      return { items: data.announcements, error: false };
    }
    return { items: [], error: true };
  } catch {
    return { items: [], error: true };
  }
}

export default async function PanelAnnouncementsPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";
  const canWrite = role === "admin" || role === "lead";

  const { items, error } = await fetchAnnouncements();

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Duyurular"
        description={
          canWrite
            ? "Duyuruları görüntüleyin, oluşturun ve yayınlayın."
            : "Takım duyurularını buradan takip edin."
        }
      />
      <AnnouncementsManager
        role={role}
        initialItems={items}
        initialError={error}
      />
    </div>
  );
}
