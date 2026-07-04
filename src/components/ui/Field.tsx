"use client";

import { cloneElement, isValidElement, useId, type ReactElement } from "react";
import { cn } from "./cn";

type ControlProps = {
  id?: string;
  required?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export type FieldProps = {
  label: string;
  /** Error message; when present the control is marked invalid. */
  error?: string;
  /** Optional helper text under the label. */
  hint?: string;
  required?: boolean;
  className?: string;
  /** A single form control (Input, Textarea, select, …). */
  children: ReactElement<ControlProps>;
};

/**
 * Accessible label + control + error wrapper. Generates an id and wires
 * `htmlFor`, `aria-describedby`, `aria-invalid` and `required` onto the child
 * control via cloneElement, so callers only pass `label`/`error`/`hint`.
 */
export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
      {control}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
