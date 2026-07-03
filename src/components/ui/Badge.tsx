import type { HTMLAttributes } from "react";
import { cn } from "./cn";

// `gold` / `silver` / `bronze` map to the Sponsor `tier` union (see @/types).
export type BadgeVariant = "brand" | "neutral" | "gold" | "silver" | "bronze";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  brand: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200",
  neutral: "bg-black/5 text-foreground dark:bg-white/10",
  gold: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  silver: "bg-zinc-200 text-zinc-700 dark:bg-zinc-400/15 dark:text-zinc-200",
  bronze:
    "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
};

/** Small pill label — e.g. sponsor tiers, categories, status. */
export function Badge({ variant = "neutral", className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantStyles[variant],
        className,
      )}
      {...rest}
    />
  );
}
