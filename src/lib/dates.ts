/**
 * Date formatting that a server and a browser agree on.
 *
 * `toLocaleDateString()` reads the runtime's locale and time zone, and the
 * server's are not the visitor's — so any date rendered that way inside a
 * component that is server-rendered and then hydrated produces a hydration
 * mismatch, which React logs and refuses to patch up. Formatting from fixed
 * tables in UTC is deterministic on both sides.
 *
 * The cost is that times read as UTC rather than local, so anything that shows
 * a clock says so.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");

/** `Sep 10` — for an axis label or a compact list. */
export function formatDay(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "";
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** `10 Sep 2026` */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** `10 Sep 2026, 14:32 UTC` */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "";
  return `${formatDate(date)}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (!value) return null;
  // A bare `YYYY-MM-DD` is already UTC by spec; anything else carries its own
  // offset. Both land on the right instant.
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
