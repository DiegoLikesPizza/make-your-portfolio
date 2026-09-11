import { db } from "@/lib/db";
import { normalizeHost, resolveHost } from "@/lib/hosts";

/**
 * Did a request come from a page of this site?
 *
 * For the unauthenticated endpoints a published page calls — the view counter
 * and the contact form — which stops them being driven from anywhere on the
 * internet. It is not proof: an Origin can be forged outside a browser. What a
 * forged request can do is bounded by each endpoint's rate limits instead.
 */

/** The host of the page a request came from, or "" when there is none. */
export function requestHost(request: Request): string {
  // fetch and sendBeacon send Origin; a few browsers only send Referer.
  const origin = request.headers.get("origin") ?? request.headers.get("referer") ?? "";
  try {
    return normalizeHost(new URL(origin).host);
  } catch {
    return "";
  }
}

/** Is `host` one of the addresses this site is served on? */
export async function servesSite(host: string, siteId: string, subdomain: string) {
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
