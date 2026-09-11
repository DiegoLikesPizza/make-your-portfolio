/**
 * Rate limiting, in memory.
 *
 * One process serves the whole app — pm2, systemd or a single container — so a
 * Map is the entire store: nothing to run, nothing to expire by hand. That stops
 * being true the moment there are two processes, each of which would allow the
 * full limit on its own, and at that point this is the one file to swap for a
 * shared store.
 *
 * A sliding window over timestamps rather than fixed buckets: a fixed window
 * lets `limit` requests through at the end of one window and `limit` more at the
 * start of the next.
 */

export type RateLimitWindow = { limit: number; windowMs: number };
export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const LIMITS = {
  /** Enough to retry a mistyped address; not enough to flood someone's inbox. */
  signInPerEmail: { limit: 5, windowMs: HOUR },
  signInPerIp: { limit: 30, windowMs: HOUR },
  /** Each generation is a large model call billed to the server's key. */
  assistPerUser: { limit: 10, windowMs: DAY },
  /** Each upload is decoded and resized several times, which is real work. */
  uploadsPerUser: { limit: 60, windowMs: HOUR },
  /** A real visitor loads a page a handful of times a minute at most. */
  hitPerIp: { limit: 30, windowMs: MINUTE },
} satisfies Record<string, RateLimitWindow>;

type Entry = { windowMs: number; stamps: number[] };

const entries = new Map<string, Entry>();

/** Past this many keys, drop the ones with nothing left in their window. */
const SWEEP_AT = 10_000;

/** Record one attempt under `key`, or refuse it if the window is full. */
export function rateLimit(key: string, { limit, windowMs }: RateLimitWindow, now: number = Date.now()): RateLimitResult {
  const stamps = (entries.get(key)?.stamps ?? []).filter((t) => t > now - windowMs);

  if (stamps.length >= limit) {
    entries.set(key, { windowMs, stamps });
    return { ok: false, retryAfterMs: stamps[0] + windowMs - now };
  }

  stamps.push(now);
  entries.set(key, { windowMs, stamps });
  if (entries.size > SWEEP_AT) sweep(now);
  return { ok: true };
}

function sweep(now: number) {
  for (const [key, entry] of entries) {
    if (entry.stamps.every((t) => t <= now - entry.windowMs)) entries.delete(key);
  }
}

/**
 * The visitor's address, as the reverse proxy in front of us saw it.
 *
 * The *last* `X-Forwarded-For` entry is the one our proxy added from the
 * socket; anything before it is whatever the client sent. nginx appends to the
 * header and Caddy replaces it for untrusted clients, so the last hop is right
 * behind both. `X-Real-IP` is deliberately not read: Caddy passes a
 * client-supplied one straight through.
 */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
}

/** "12 minutes", "3 hours" — for telling someone when to come back. */
export function describeWait(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / MINUTE));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
