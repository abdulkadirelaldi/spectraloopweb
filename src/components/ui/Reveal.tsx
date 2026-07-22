"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "./cn";

export type RevealProps = {
  /** Element/tag to render (e.g. "li", "section"). Defaults to "div". */
  as?: ElementType;
  /** Stagger delay in milliseconds (used for lists/grids). */
  delay?: number;
  className?: string;
  children: ReactNode;
  /** Extra inline styles (merged with the reveal delay variable). */
  style?: CSSProperties;
};

/**
 * Progressive-enhancement scroll reveal.
 *
 * Content is rendered fully visible in SSR/HTML. On the client — only when
 * JavaScript runs, IntersectionObserver exists, and the user has NOT requested
 * reduced motion — elements that are below the fold are hidden and faded/slid
 * in as they scroll into view. Above-the-fold elements are left untouched (no
 * flash, no gating). If any precondition fails, the content simply stays
 * visible. It is therefore always present for SEO, no-JS, and reduced-motion.
 */
export function Reveal({
  as,
  delay = 0,
  className,
  children,
  style,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Bail out (stay visible) when motion is reduced or IO is unavailable.
    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") return;

    // Only prepare elements comfortably below the fold — this avoids hiding
    // (and flashing) anything already on screen at load.
    const rect = el.getBoundingClientRect();
    const alreadyOnScreen = rect.top < window.innerHeight * 0.9;
    if (alreadyOnScreen) return;

    el.dataset.reveal = "hidden";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.dataset.reveal = "shown";
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(className)}
      style={
        delay
          ? ({ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties)
          : style
      }
    >
      {children}
    </Tag>
  );
}
