import { db } from "@/lib/db";
import { MAX_SOURCES_PER_DAY, normalizeSource, OVERFLOW_SOURCE } from "@/lib/analytics";
import { clientIp, LIMITS, rateLimit } from "@/lib/rate-limit";
import { requestHost, servesSite } from "@/lib/site-origin";

/**
 * One page view, counted.
 *
 * Aggregated straight into a per-day, per-source counter — nothing per-visitor
 * is written, so there is no retention question and nothing to anonymise later.
 *
 * The endpoint is unauthenticated by necessity: the visitor is a stranger. What
 * it does check is that the request came from a page that is actually this
 * site, which stops the counter being driven from anywhere on the internet with
 * a curl loop. It is not proof — a determined person can forge an Origin from
 * outside a browser — and this is a vanity number, not billing, so that trade is
 * the right one to state rather than to over-engineer.
 *
 * What a forged request can do is bounded instead: a rate limit per client per
 * site caps how fast a count can be inflated, and sources are validated and
 * capped per day so the table can't be grown with made-up referrers.
 */

/** Midnight UTC today, which is the granularity of a row. */
function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * The source a view is recorded under: its own row if it already has one or
 * there is room for a new one today, `other` once the day's cap is reached.
 */
async function bucketFor(siteId: string, day: Date, source: string) {
  if (!source) return source;

  const existing = await db.siteView.findUnique({
    where: { siteId_day_source: { siteId, day, source } },
    select: { id: true },
  });
  if (existing) return source;

  const recorded = await db.siteView.count({ where: { siteId, day } });
  return recorded < MAX_SOURCES_PER_DAY ? source : OVERFLOW_SOURCE;
}

export async function POST(request: Request) {
  let payload: { siteId?: unknown; source?: unknown };
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }

  const siteId = typeof payload.siteId === "string" ? payload.siteId : "";
  if (!siteId) return new Response(null, { status: 204 });

  const site = await db.site.findUnique({
    where: { id: siteId },
    select: { id: true, subdomain: true, publishedAt: true },
  });
  // A draft has no public URL, so a view of one is either a preview or a forgery.
  if (!site?.publishedAt) return new Response(null, { status: 204 });

  if (!(await servesSite(requestHost(request), site.id, site.subdomain))) {
    return new Response(null, { status: 204 });
  }

  if (!rateLimit(`hit:${site.id}:${clientIp(request.headers)}`, LIMITS.hitPerIp).ok) {
    return new Response(null, { status: 204 });
  }

  const day = today();
  const source = await bucketFor(site.id, day, normalizeSource(payload.source));

  await db.siteView.upsert({
    where: { siteId_day_source: { siteId: site.id, day, source } },
    create: { siteId: site.id, day, source, count: 1 },
    update: { count: { increment: 1 } },
  });

  // 204: the browser has nothing to do with the answer, and this is fired from
  // sendBeacon, which discards the response anyway.
  return new Response(null, { status: 204 });
}
