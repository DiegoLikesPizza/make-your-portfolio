import { db } from "@/lib/db";
import { normalizeHost, resolveHost } from "@/lib/hosts";

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
 */

/** Midnight UTC today, which is the granularity of a row. */
function today(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/** Is `host` one of the addresses this site is served on? */
async function servesSite(host: string, siteId: string, subdomain: string) {
  if (!host) return false;
  const target = resolveHost(host);

  // The app's own domain (and localhost in development) serves /u/<handle>.
  if (target.kind === "app") return true;
  if (target.kind === "subdomain") return target.subdomain === subdomain;

  const domain = await db.domain.findFirst({
    where: { hostname: target.hostname, siteId, verified: true },
    select: { id: true },
  });
  return Boolean(domain);
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

  // sendBeacon sends Origin; a few browsers only send Referer.
  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  let host = "";
  try {
    host = normalizeHost(new URL(origin).host);
  } catch {
    host = "";
  }
  if (!(await servesSite(host, site.id, site.subdomain))) {
    return new Response(null, { status: 204 });
  }

  const source = typeof payload.source === "string" ? payload.source.slice(0, 120) : "";

  await db.siteView.upsert({
    where: { siteId_day_source: { siteId: site.id, day: today(), source } },
    create: { siteId: site.id, day: today(), source, count: 1 },
    update: { count: { increment: 1 } },
  });

  // 204: the browser has nothing to do with the answer, and this is fired from
  // sendBeacon, which discards the response anyway.
  return new Response(null, { status: 204 });
}
