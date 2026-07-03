import Link from "next/link";
import { cn } from "@/components/ui/cn";

/**
 * Spectraloop wordmark + loop mark. Placeholder brand asset — swap the mark
 * / colors once the final brand identity is provided.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Spectraloop ana sayfa"
      className={cn(
        "inline-flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="h-7 w-7 shrink-0"
        fill="none"
      >
        <rect width="32" height="32" rx="8" fill="var(--color-brand-500)" />
        <path
          d="M9 16c0-2.2 1.8-4 4-4 1.6 0 2.6 1 3 2 .4-1 1.4-2 3-2 2.2 0 4 1.8 4 4s-1.8 4-4 4c-1.6 0-2.6-1-3-2-.4 1-1.4 2-3 2-2.2 0-4-1.8-4-4Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-lg font-bold tracking-tight text-foreground">
        Spectra<span className="text-brand-500">loop</span>
      </span>
    </Link>
  );
}
