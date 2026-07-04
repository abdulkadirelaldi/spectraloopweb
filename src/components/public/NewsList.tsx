import { Container, Section } from "@/components/ui";
import type { Announcement } from "@/types";
import { AnnouncementCard } from "./AnnouncementCard";

type AnnouncementsResponse =
  | { ok: true; announcements: Announcement[] }
  | { ok: false; error: string };

/** Origin for internal API calls (build/runtime, local/Vercel). */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Fetch public announcements from the internal read-only API. Never throws —
 * any failure resolves to an empty list so the page renders a graceful
 * fallback instead of crashing.
 */
async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/announcements`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as AnnouncementsResponse;
    return data.ok ? data.announcements : [];
  } catch {
    return [];
  }
}

/**
 * News/announcements list — server component. Consumes GET /api/announcements
 * (already newest-first). Renders a fallback when there is nothing to show.
 */
export async function NewsList() {
  const announcements = await getAnnouncements();

  return (
    <Section>
      <Container>
        {announcements.length > 0 ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {announcements.map((announcement) => (
              <li key={announcement.id}>
                <AnnouncementCard announcement={announcement} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-muted">
              Henüz haber yok. Yeni gelişmeler için bizi takip etmeye devam edin.
            </p>
          </div>
        )}
      </Container>
    </Section>
  );
}
