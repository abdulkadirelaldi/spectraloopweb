import type { ReactNode } from "react";
import { Badge, Container } from "@/components/ui";

export type PageHeroProps = {
  /** Small eyebrow label above the title. */
  eyebrow?: string;
  title: string;
  /** Optional lead paragraph under the title. */
  subtitle?: ReactNode;
};

/**
 * Reusable page header band for inner public pages (about, teams, etc.).
 * Lighter than the landing `Hero`; keeps a consistent title treatment.
 */
export function PageHero({ eyebrow, title, subtitle }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      {/* Subtle brand glow — decorative, never affects text legibility. */}
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"
      />
      <Container className="relative py-16 sm:py-20">
        {eyebrow ? (
          <Badge variant="brand" className="animate-fade-rise">
            {eyebrow}
          </Badge>
        ) : null}
        <h1 className="animate-fade-rise mt-4 text-4xl font-bold tracking-tight text-foreground [animation-delay:80ms] sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="animate-fade-rise mt-4 max-w-2xl text-lg text-muted [animation-delay:160ms]">
            {subtitle}
          </p>
        ) : null}
      </Container>
    </section>
  );
}
