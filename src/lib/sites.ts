import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { migrate } from "@/lib/schema/portfolio";
import type { AssetMap } from "@/render/context";
import { resolveHost, SITES_ON_SUBDOMAINS, APP_DOMAIN } from "@/lib/hosts";

/** Loading and publishing sites. */

export type PublishedSite = { id: string; doc: PortfolioDoc; assets: AssetMap };

type SiteRow = { id: string; publishedDoc: unknown } | null;

function toPublished(site: SiteRow): PublishedSite | null {
  // No row, or the owner has never pressed Publish.
  if (!site?.publishedDoc) return null;
  return { id: site.id, doc: migrate(site.publishedDoc), assets: {} };
}

/**
 * By handle — the `/u/<handle>` path, which every site has from the moment it
 * is published. Deliberately *not* routed through host resolution: that
 * conflated the path with subdomain hosting, so turning subdomains off 404'd
 * every published site.
 */
async function loadByHandle(handle: string): Promise<PublishedSite | null> {
  return toPublished(await db.site.findUnique({ where: { subdomain: handle } }));
}

/** By hostname — a custom domain, or a subdomain when that mode is enabled. */
async function loadByHost(host: string): Promise<PublishedSite | null> {
  const target = resolveHost(host);
  if (target.kind === "app") return null;

  if (target.kind === "subdomain") return loadByHandle(target.subdomain);

  return toPublished(
    await db.site.findFirst({
      // An unverified custom domain must not resolve: verification is what
      // gates certificate issuance, so serving it would be inconsistent.
      where: { domains: { some: { hostname: target.hostname, verified: true } } },
    }),
  );
}

export function getPublishedSiteByHandle(handle: string): Promise<PublishedSite | null> {
  return unstable_cache(() => loadByHandle(handle), ["site-handle", handle], {
    tags: [`site:handle:${handle}`],
  })();
}

export function getPublishedSite(host: string): Promise<PublishedSite | null> {
  return unstable_cache(() => loadByHost(host), ["site-host", host], {
    tags: [`site:host:${host}`],
  })();
}

/**
 * Drop whatever is cached for one hostname.
 *
 * Needed on every change to a Domain row, not just on publish. `loadByHost`
 * caches its *misses* too, so the natural sequence — connect the domain, visit
 * it to see whether it works yet, then verify — poisons the cache with a null
 * that nothing would ever clear, and the domain 404s forever afterwards.
 */
export async function revalidateHost(hostname: string) {
  revalidateTag(`site:host:${hostname}`, { expire: 0 });
}

/** Called after publishing so every route serving this site picks it up. */
export async function revalidateSite(handle: string, hostnames: string[]) {
  const tags = [
    `site:handle:${handle}`,
    ...hostnames.map((h) => `site:host:${h}`),
  ];
  if (SITES_ON_SUBDOMAINS) tags.push(`site:host:${handle}.${APP_DOMAIN}`);

  for (const tag of tags) {
    // expire: 0 — a publish must be visible immediately; there is no window in
    // which serving the previous document is acceptable.
    revalidateTag(tag, { expire: 0 });
  }
}
