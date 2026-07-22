import { Card, Reveal } from "@/components/ui";

export type TimelineItem = {
  year: string;
  title: string;
  description: string;
};

export type TimelineProps = {
  items: readonly TimelineItem[];
};

/**
 * Vertical, accessible timeline (ordered list). Fed by an `items` array so it
 * can later be driven by real data. Milestones fade/slide in with a stagger and
 * the connecting line draws downward as the timeline scrolls into view — all as
 * progressive enhancement (fully visible by default, disabled under
 * reduced-motion).
 */
export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative pl-8">
      {/* Connecting line — draws from the top when revealed. */}
      <Reveal
        as="div"
        className="pointer-events-none absolute top-1.5 bottom-1.5 left-0 w-0.5"
      >
        <span className="reveal-line block h-full w-full rounded-full bg-gradient-to-b from-brand-500 via-border to-border" />
      </Reveal>

      <ol className="relative flex flex-col gap-8">
        {items.map((item, i) => (
          <Reveal
            as="li"
            key={`${item.year}-${item.title}`}
            delay={i * 110}
            className="relative"
          >
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[2.55rem] h-4 w-4 rounded-full border-4 border-background bg-brand-500 shadow-sm shadow-brand-500/40"
            />
            <Card className="transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md dark:hover:border-brand-500/40">
              <span className="text-sm font-bold text-brand-600 dark:text-brand-300">
                {item.year}
              </span>
              <h3 className="mt-1 text-lg font-semibold text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
            </Card>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
