import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

/** Shared control styling for text inputs, textareas, and selects. */
export const controlBase =
  "block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 " +
  "text-sm text-foreground placeholder:text-muted transition-colors " +
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 " +
  "focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60 " +
  "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus-visible:ring-red-500";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

/** Text input primitive. Pairs with `Field` for label + error wiring. */
export function Input({ className, ...rest }: InputProps) {
  return <input className={cn(controlBase, className)} {...rest} />;
}

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Multi-line text input primitive. Pairs with `Field`. */
export function Textarea({ className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(controlBase, "min-h-32 resize-y", className)}
      {...rest}
    />
  );
}
