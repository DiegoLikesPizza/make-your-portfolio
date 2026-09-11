/**
 * Referrer sources for page-view counting.
 *
 * `/api/hit` is unauthenticated, and every distinct source is its own row per
 * site per day. Left as free text, a loop of made-up sources grows the table
 * without bound, so what is stored is constrained twice: a source has to look
 * like a hostname, and a site has a daily cap on how many distinct ones it
 * records.
 */

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
