"use client";

import { useState } from "react";
import { formatDay } from "@/lib/dates";

/**
 * Daily views for the last N days.
 *
 * A bar per day rather than a line: the days are discrete buckets and a new
 * site's data is mostly zeros, where a line would draw slopes between points
 * that don't exist. One series, so no legend — the heading names it — and the
 * axis is a single max label rather than a ruled grid, because the shape is the
 * message and the exact number is in the tooltip.
 */

export type DayCount = { day: string; count: number };

export function ViewsChart({ days }: { days: DayCount[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        No views recorded yet. Numbers start the first time somebody who isn&apos;t you opens the
        published page.
      </p>
    );
  }

  const active = hover === null ? null : days[hover];

  return (
    <figure className="mt-4">
      {/* The bar colour is stated per scheme rather than flipped automatically:
          the light step is too dark to read against a near-black surface. */}
      <style>{`
        .views-chart { --bar: #3b6ef5; --bar-dim: #3b6ef5; }
        @media (prefers-color-scheme: dark) { .views-chart { --bar: #5f8ae4; --bar-dim: #5f8ae4; } }
      `}</style>

      <div className="views-chart">
        <div className="flex h-8 items-end justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span aria-hidden>{max} max</span>
          <span className="tabular-nums" aria-live="polite">
            {active ? `${formatDay(active.day)} · ${active.count} ${active.count === 1 ? "view" : "views"}` : ""}
          </span>
        </div>

        <div className="flex h-32 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {days.map((d, i) => (
            <div
              key={d.day}
              // The hit target is the whole column, not the bar: a one-view day
              // is three pixels tall and would be impossible to hover otherwise.
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              role="img"
              aria-label={`${formatDay(d.day)}: ${d.count} views`}
              className="flex h-full flex-1 cursor-default items-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <div
                className="w-full rounded-t-[4px] transition-opacity"
                style={{
                  // A floor of 2px so a zero day is still a visible baseline
                  // tick rather than a gap you have to count to locate.
                  height: `${Math.max(2, (d.count / max) * 100)}%`,
                  background: d.count === 0 ? "var(--bar-dim)" : "var(--bar)",
                  opacity: d.count === 0 ? 0.18 : hover === null || hover === i ? 1 : 0.45,
                }}
              />
            </div>
          ))}
        </div>

        <div className="mt-2 flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{formatDay(days[0]?.day ?? "")}</span>
          <span>{formatDay(days[days.length - 1]?.day ?? "")}</span>
        </div>
      </div>
    </figure>
  );
}
