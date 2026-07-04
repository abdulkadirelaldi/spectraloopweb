import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";
import { controlBase } from "./Input";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native select primitive. Pairs with `Field` for label + error wiring. */
export function Select({ className, ...rest }: SelectProps) {
  return <select className={cn(controlBase, "pr-9", className)} {...rest} />;
}
