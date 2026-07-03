import Link from "next/link";
import { Badge, Card, Container, Section } from "@/components/ui";
import type { Sponsor } from "@/types";

type SponsorsResponse =
  | { ok: true; sponsors: Sponsor[] }
  | { ok: false; error: string };

/** Origin for internal API calls (build/runtime, local/Vercel). */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Fetch active sponsors from the internal read-only API. Never throws — any
 * failure (no DB, network, non-200, error payload) resolves to an empty list
 * so the page renders a graceful fallback instead of crashing.
 */
async function getSponsors(): Promise<Sponsor[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/sponsors`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SponsorsResponse;
    return data.ok ? data.sponsors : [];
  } catch {
    return [];
  }
}

/**
 * Sponsor strip — server component. Consumes GET /api/sponsors (already sorted
 * gold → silver → bronze). Renders a fallback when there are no sponsors yet.
 */
export async function SponsorStrip() {
  const sponsors = await getSponsors();

  return (
    <Section muted>
      <Container>
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bizi destekleyenler
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Spectraloop&apos;u mümkün kılan sponsorlarımıza teşekkür ederiz.
          </p>
        </div>

        {sponsors.length > 0 ? (
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sponsors.map((sponsor) => {
              const logo = (
                <>
                  {/* External logo URLs (placehold.co / R2) — plain <img> avoids
                      next.config remotePatterns coupling. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logoUrl}
                    alt={`${sponsor.name} logosu`}
                    loading="lazy"
                    className="h-12 w-auto max-w-full object-contain"
                  />
                  <span className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {sponsor.name}
                    </span>
                    <Badge variant={sponsor.tier}>{sponsor.tier}</Badge>
                  </span>
                </>
              );

              return (
                <li key={sponsor.id}>
                  <Card
                    interactive={Boolean(sponsor.website)}
                    className="flex h-full flex-col items-center justify-center text-center"
                  >
                    {sponsor.website ? (
                      <Link
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                        aria-label={`${sponsor.name} web sitesi (yeni sekmede açılır)`}
                      >
                        {logo}
                      </Link>
                    ) : (
                      <div className="flex flex-col items-center">{logo}</div>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-10 text-center">
            <p className="text-muted">
              Sponsorlarımız yakında burada olacak.
            </p>
            <Link
              href="/sponsorluk"
              className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-300"
            >
              Sponsorluk fırsatlarını inceleyin →
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
