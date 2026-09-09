import { notFound } from "next/navigation";
import { Portfolio } from "@/render/Portfolio";
import { getPublishedSiteByHandle } from "@/lib/sites";

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
  return <Portfolio ctx={{ doc: site.doc, assets: site.assets }} />;
}
