"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * A scroll-snap list that can advance itself.
 *
 * The list is still a plain scroll container — dragging, the scrollbar, arrow
 * keys and the snap points all work exactly as they did, because none of that
 * is reimplemented here. Autoplay only nudges `scrollLeft` on a timer.
 *
 * It stops on hover and on focus, because advancing the thing somebody is
 * currently reading or tabbing through is the failure mode that makes carousels
 * hated, and it never starts at all under `prefers-reduced-motion`.
 */
export function AutoScroll({
  enabled,
  className,
  children,
  intervalMs = 5000,
}: {
  enabled: boolean;
  className?: string;
  children: React.ReactNode;
  intervalMs?: number;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!enabled || reduce || paused) return;

    const id = window.setInterval(() => {
      const el = ref.current;
      const first = el?.firstElementChild as HTMLElement | null;
      if (!el || !first) return;

      const gap = Number.parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const step = first.getBoundingClientRect().width + gap;
      // A couple of pixels of slack: fractional layout widths mean scrollLeft
      // rarely reaches scrollWidth exactly, and without it the last slide never
      // wraps.
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;

      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + step, behavior: "smooth" });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [enabled, reduce, paused, intervalMs]);

  return (
    <ul
      ref={ref}
      className={className}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {children}
    </ul>
  );
}
