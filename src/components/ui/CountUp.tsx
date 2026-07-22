"use client";

import { useEffect, useRef, useState } from "react";

export type CountUpProps = {
  /** Display value, e.g. "2022", "40+", "3". Non-digit prefix/suffix are kept. */
  value: string;
  /** Animation duration in milliseconds. */
  duration?: number;
  className?: string;
};

/** Split "40+" → { prefix:"", digits:"40", number:40, suffix:"+" }. */
function parseValue(value: string): {
  prefix: string;
  suffix: string;
  target: number;
  hasNumber: boolean;
} {
  const match = value.match(/^(\D*)(\d[\d.]*)(.*)$/);
  if (!match) return { prefix: value, suffix: "", target: 0, hasNumber: false };
  const [, prefix, digits, suffix] = match;
  return {
    prefix,
    suffix,
    target: Number(digits.replace(/\.(?=.*\.)/g, "")),
    hasNumber: true,
  };
}

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Counts up to a numeric value when it scrolls into view. The final value is
 * rendered in SSR/HTML, so it is always present (SEO/no-JS). Animation is
 * skipped entirely for reduced-motion users or when the value is already on
 * screen at load — it only ever enhances, never hides, the number.
 */
export function CountUp({ value, duration = 1400, className }: CountUpProps) {
  const { prefix, suffix, target, hasNumber } = parseValue(value);
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState<string>(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNumber) return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") return;

    // Only animate elements below the fold to avoid a visible "reset" flash.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;

    let raf = 0;
    let start = 0;
    const decimals = value.match(/\.(\d+)/)?.[1].length ?? 0;

    const run = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / duration, 1);
      const current = target * easeOut(t);
      setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`);
      if (t < 1) raf = requestAnimationFrame(run);
      else setDisplay(value);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setDisplay(`${prefix}${(0).toFixed(decimals)}${suffix}`);
            raf = requestAnimationFrame(run);
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
