import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Portfolio } from "@/render/Portfolio";
import { PersonJsonLd } from "@/render/PersonJsonLd";
import { getPublishedSiteByHandle } from "@/lib/sites";
import { resolveDynamic } from "@/lib/dynamic";
import { appOrigin } from "@/lib/hosts";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

/**
 * Path-based access to the same published site.
 *
 * Every site has this URL from the moment it is published, so a user can share
 * their portfolio before any DNS exists.
 */

type Props = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const site = await getPublishedSiteByHandle(subdomain);
  if (!site) return {};
  return portfolioMetadata(resolveDynamic(site.doc), {
    cardPath: `/u/${subdomain}/og`,
    assets: site.assets,
    origin: appOrigin(),
  });
}

export default async function UserSitePage({ params }: Props) {
  const { subdomain } = await params;
  const site = await getPublishedSiteByHandle(subdomain);
  if (!site) notFound();
  // Resolved per request, not per cache entry: `{{date}}` on a page served
  // from a cached document must still be today.
  const doc = resolveDynamic(site.doc);
  return (
    <>
      <PersonJsonLd doc={doc} assets={site.assets} origin={appOrigin()} />
      <Portfolio ctx={{ doc, assets: site.assets }} analyticsSiteId={site.id} />
    </>
  );
}
