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
        interactive && "transition-shadow hover:shadow-md",
        className,
      )}
      {...rest}
    />
  );
}
