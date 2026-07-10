import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelPageHeader } from "@/components/panel";
import { EventsManager } from "@/components/panel/EventsManager";
import type { Event, Role } from "@/types";

export const metadata: Metadata = {
  title: "Takvim — Panel",
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function fetchEvents(): Promise<{ events: Event[]; error: boolean }> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${getBaseUrl()}/api/panel/events`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      events?: Event[];
    } | null;
    if (res.ok && data?.ok && Array.isArray(data.events)) {
      return { events: data.events, error: false };
    }
    return { events: [], error: true };
  } catch {
    return { events: [], error: true };
  }
}

export default async function PanelCalendarPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";
  const canManage = role === "admin" || role === "lead";

  const { events, error } = await fetchEvents();

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Takvim"
        description={
          canManage
            ? "Etkinlik ve son teslim tarihlerini yönetin."
            : "Yaklaşan etkinlikleri ve son teslim tarihlerini görüntüleyin."
        }
      />
      <EventsManager role={role} initialItems={events} initialError={error} />
    </div>
  );
}
