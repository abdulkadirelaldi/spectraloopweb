import Link from "next/link";
import { Container, Reveal, Section } from "@/components/ui";
import type { Sponsor } from "@/types";
import { SponsorMarquee } from "./SponsorMarquee";

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
        <Reveal as="div" className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bizi destekleyenler
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Spectraloop&apos;u mümkün kılan sponsorlarımıza teşekkür ederiz.
          </p>
        </Reveal>

        {sponsors.length > 0 ? (
          <SponsorMarquee sponsors={sponsors} />
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
