"use client";

import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * A continuously scrolling row.
 *
 * The content is duplicated so the loop has no visible seam, and the copy is
 * `aria-hidden` so screen readers hear the list once. Reduced motion turns it
 * into a plain wrapping row rather than a stopped animation.
 */
export function Marquee({ children, speed = 40 }: { children: ReactNode; speed?: number }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="flex flex-wrap gap-x-8 gap-y-3">{children}</div>;
  }

  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-[marquee_var(--marquee-duration)_linear_infinite] gap-8" style={{ ["--marquee-duration" as string]: `${speed}s` }}>
        <div className="flex shrink-0 gap-8">{children}</div>
        <div className="flex shrink-0 gap-8" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
