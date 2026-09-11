import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { APP_DOMAIN, appOrigin } from "@/lib/hosts";
import { portfolioSitemapEntries } from "@/lib/seo";

/**
 * The app's own public pages, and every published portfolio that hasn't asked
 * to stay out of search (src/lib/seo.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Per request, not prerendered: a build-time sitemap would never list a site
  // published after the deploy, and the build would need the database.
  await connection();
  const origin = appOrigin() ?? `https://${APP_DOMAIN}`;

  const sites = await db.site.findMany({
    where: { publishedAt: { not: null } },
    select: { subdomain: true, publishedAt: true, publishedDoc: true },
  });

  return [{ url: `${origin}/` }, { url: `${origin}/layouts` }, ...portfolioSitemapEntries(sites, origin)];
}
