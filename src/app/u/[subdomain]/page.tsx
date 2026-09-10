import { notFound } from "next/navigation";
import { Portfolio } from "@/render/Portfolio";
import { getPublishedSiteByHandle } from "@/lib/sites";
import { resolveDynamic } from "@/lib/dynamic";

/**
 * Path-based access to the same published site.
 *
 * Every site has this URL from the moment it is published, so a user can share
 * their portfolio before any DNS exists.
 */
export default async function UserSitePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const site = await getPublishedSiteByHandle(subdomain);
  if (!site) notFound();
  // Resolved per request, not per cache entry: `{{date}}` on a page served
  // from a cached document must still be today.
  return <Portfolio ctx={{ doc: resolveDynamic(site.doc), assets: site.assets }} analyticsSiteId={site.id} />;
}
