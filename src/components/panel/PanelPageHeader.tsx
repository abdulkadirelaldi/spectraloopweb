import type { ReactNode } from "react";

export type PanelPageHeaderProps = {
  title: string;
  description?: string;
  /** Optional right-aligned actions (e.g. a "New" button). */
  action?: ReactNode;
};

/** Consistent page header for panel pages (2.F2+). */
export function PanelPageHeader({
  title,
  description,
  action,
}: PanelPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-muted mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
