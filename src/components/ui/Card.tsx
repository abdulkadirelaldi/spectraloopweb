import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Add a hover elevation (for clickable/linked cards). */
  interactive?: boolean;
};

/** Surface panel with border, rounding, and padding. */
export function Card({ interactive, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "border-border bg-surface rounded-2xl border p-6 shadow-sm",
        interactive &&
          "hover:border-brand-200 dark:hover:border-brand-500/40 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-md",
        className,
      )}
      {...rest}
    />
  );
}
