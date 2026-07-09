import type { ReactNode } from "react";
import { cn } from "@/components/ui";

export type PanelCardProps = {
  /** Optional card title (rendered as a header row). */
  title?: string;
  /** Optional right-aligned header action (e.g. a link). */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/** Surface panel container with an optional title/action header row. */
export function PanelCard({
  title,
  action,
  className,
  children,
}: PanelCardProps) {
  return (
    <section
      className={cn(
        "border-border bg-surface rounded-xl border p-5 shadow-sm",
        className,
      )}
    >
      {title || action ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-foreground text-sm font-semibold">{title}</h2>
          ) : (
            <span />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
};

/** Compact metric card for panel dashboards. */
export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="border-border bg-surface rounded-xl border p-5 shadow-sm">
      <p className="text-muted text-sm font-medium">{label}</p>
      <p className="text-foreground mt-2 text-3xl font-bold tracking-tight">
        {value}
      </p>
      {hint ? <p className="text-muted mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
