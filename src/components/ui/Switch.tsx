"use client";

import { useId } from "react";
import { cn } from "./cn";

export type SwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

/** Accessible on/off toggle (role="switch"). Self-contained label + control. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
  className,
}: SwitchProps) {
  const labelId = useId();
  const descId = useId();

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="flex flex-col">
        <span id={labelId} className="text-foreground text-sm font-medium">
          {label}
        </span>
        {description ? (
          <span id={descId} className="text-muted text-xs">
            {description}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-visible:ring-brand focus-visible:ring-offset-surface relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-brand-500" : "bg-black/20 dark:bg-white/20",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
