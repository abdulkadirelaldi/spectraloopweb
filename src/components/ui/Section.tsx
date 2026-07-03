import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type SectionProps = HTMLAttributes<HTMLElement> & {
  /** Use the raised surface background (for alternating sections). */
  muted?: boolean;
};

/** Vertical rhythm wrapper for a page section. */
export function Section({ muted, className, ...rest }: SectionProps) {
  return (
    <section
      className={cn("py-16 sm:py-20", muted && "bg-surface", className)}
      {...rest}
    />
  );
}
