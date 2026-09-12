/**
 * Page-view counting: what `/api/hit` may store, and how the analytics pages
 * read the counts back.
 */

// ------------------------------------------------------- referrer sources
//
// `/api/hit` is unauthenticated, and every distinct source is its own row per
// site per day. Left as free text, a loop of made-up sources grows the table
// without bound, so what is stored is constrained twice: a source has to look
// like a hostname, and a site has a daily cap on how many distinct ones it
// records.

/** Distinct sources recorded per site per day; later ones count as `other`. */
export const MAX_SOURCES_PER_DAY = 50;

export const OVERFLOW_SOURCE = "other";

/** `host` or `host:port`, the shape `URL#host` gives the beacon. */
const HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)*(:\d{1,5})?$/;

/** A referrer hostname, or "" (a direct visit) for anything that isn't one. */
export function normalizeSource(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const source = raw.trim().toLowerCase();
  return source.length <= 120 && HOST.test(source) ? source : "";
}

// ------------------------------------------------------- reading them back
//
// Rows are keyed by UTC day, so every window here is counted in UTC days too:
// a window of N days is today and the N - 1 days before it.

const DAY_MS = 86_400_000;

/** The windows the analytics pages offer, in days. */
export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];
export const DEFAULT_RANGE: Range = 30;

/** `?days=` as one of RANGES, and the default for anything else. */
export function parseRange(raw: unknown): Range {
  return RANGES.find((days) => String(days) === raw) ?? DEFAULT_RANGE;
}

/** One bar of a daily chart. */
export type DayCount = { day: string; count: number };

/** `YYYY-MM-DD` for a Date, read in UTC — the same bucket the rows are keyed by. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** UTC midnight on the first day of a window of `days` days that ends today. */
export function windowStart(days: number, now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1)));
}

/**
 * Every day in the window, including the ones with no row.
 *
 * Charting only the days that have data is the classic way to draw a flat line
 * through a fortnight of silence: the gaps *are* the information. Rows that
 * share a day are added up, so one row per source and one row per signup both
 * work.
 */
export function fillDays(rows: { day: Date; count: number }[], days: number, now: Date = new Date()): DayCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = isoDay(row.day);
    totals.set(key, (totals.get(key) ?? 0) + row.count);
  }

  const start = windowStart(days, now).getTime();
  return Array.from({ length: days }, (_, i) => {
    const day = isoDay(new Date(start + i * DAY_MS));
    return { day, count: totals.get(day) ?? 0 };
  });
}

/**
 * A window against the one of the same length before it, in words.
 *
 * Undefined when both are empty. When only the earlier one is, there is no
 * percentage to give — any rise from zero is infinite — so it says that instead.
 */
export function describeChange(current: number, previous: number, days: number): string | undefined {
  const before = `the previous ${days} days`;
  if (previous === 0) return current === 0 ? undefined : `None in ${before}`;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return `Same as ${before}`;
  return `${change > 0 ? "↑" : "↓"} ${Math.abs(change)}% vs ${before}`;
}
