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
    <section className="border-b border-border bg-surface">
      <Container className="py-16 sm:py-20">
        {eyebrow ? <Badge variant="brand">{eyebrow}</Badge> : null}
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 max-w-2xl text-lg text-muted">{subtitle}</p>
        ) : null}
      </Container>
    </section>
  );
}
