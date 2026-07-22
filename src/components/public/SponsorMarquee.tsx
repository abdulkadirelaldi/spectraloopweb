"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import type { Sponsor } from "@/types";

/** A single sponsor tile (logo + name + tier badge, optionally linked). */
function SponsorTile({ sponsor }: { sponsor: Sponsor }) {
  const inner = (
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
    <div className="flex h-full w-56 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-surface p-6 text-center shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:hover:border-brand-500/40">
      {sponsor.website ? (
        <Link
          href={sponsor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          aria-label={`${sponsor.name} web sitesi (yeni sekmede açılır)`}
        >
          {inner}
        </Link>
      ) : (
        <div className="flex flex-col items-center">{inner}</div>
      )}
    </div>
  );
}

/**
 * Continuous, auto-scrolling sponsor marquee with pause-on-hover. The track is
 * duplicated for a seamless loop; the second copy is `aria-hidden` so screen
 * readers announce each sponsor once. Under `prefers-reduced-motion` the CSS
 * collapses this to a static, centered, wrapped row (duplicate copy hidden).
 */
export function SponsorMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  return (
    <div className="marquee relative mt-10">
      {/* Edge fade masks so tiles ease in/out at the container edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent"
      />
      <ul className="marquee__track gap-4 py-1">
        {sponsors.map((sponsor) => (
          <li key={sponsor.id} className="flex">
            <SponsorTile sponsor={sponsor} />
          </li>
        ))}
        {/* Duplicated copy for the seamless loop — hidden from a11y & reduced-motion. */}
        {sponsors.map((sponsor) => (
          <li
            key={`dupe-${sponsor.id}`}
            aria-hidden="true"
            className="marquee__dupe flex"
          >
            <SponsorTile sponsor={sponsor} />
          </li>
        ))}
      </ul>
    </div>
  );
}
