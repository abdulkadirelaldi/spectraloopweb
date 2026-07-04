import { Card } from "@/components/ui";

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
 * can later be driven by real data. Single column and responsive on all sizes.
 */
export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="relative flex flex-col gap-8 border-l-2 border-border pl-8">
      {items.map((item) => (
        <li key={`${item.year}-${item.title}`} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1.5 -left-[2.55rem] h-4 w-4 rounded-full border-4 border-background bg-brand-500"
          />
          <Card>
            <span className="text-sm font-bold text-brand-600 dark:text-brand-300">
              {item.year}
            </span>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{item.description}</p>
          </Card>
        </li>
      ))}
    </ol>
  );
}
