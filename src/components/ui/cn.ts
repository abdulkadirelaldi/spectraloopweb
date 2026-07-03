/**
 * Minimal className joiner for UI primitives. Filters out falsy values so
 * conditional classes can be passed inline without a runtime dependency.
 * (Shared helpers in `src/lib/utils` are Backend-owned; this stays local to UI.)
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
