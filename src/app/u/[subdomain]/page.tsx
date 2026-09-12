import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Portfolio } from "@/render/Portfolio";
import { PersonJsonLd } from "@/render/PersonJsonLd";
import { getPublishedSiteByHandle } from "@/lib/sites";
import { referenceDemoDoc } from "@/lib/reference-demo";
import { resolveDynamic } from "@/lib/dynamic";
import { appOrigin } from "@/lib/hosts";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

/**
 * Path-based access to the same published site.
 *
 * Every site has this URL from the moment it is published, so a user can share
 * their portfolio before any DNS exists. `/u/demo` is the one address that can
 * render with no site behind it — see src/lib/reference-demo.ts.
 */

type Props = { params: Promise<{ subdomain: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params;
  const cardPath = `/u/${subdomain}/og`;

  const site = await getPublishedSiteByHandle(subdomain);
  if (site) {
    return portfolioMetadata(resolveDynamic(site.doc), { cardPath, assets: site.assets, origin: appOrigin() });
  }

  const reference = await referenceDemoDoc(subdomain);
  return reference ? portfolioMetadata(resolveDynamic(reference), { cardPath, origin: appOrigin() }) : {};
}

export default async function UserSitePage({ params }: Props) {
  const { subdomain } = await params;
  const site = await getPublishedSiteByHandle(subdomain);

  if (!site) {
    const reference = await referenceDemoDoc(subdomain);
    if (!reference) notFound();
    // No analytics and no structured data: there is no site row to count views
    // against, and the person it describes has their own page to be found by.
    return <Portfolio ctx={{ doc: resolveDynamic(reference), assets: {} }} />;
  }

  // Resolved per request, not per cache entry: `{{date}}` on a page served
  // from a cached document must still be today.
  const doc = resolveDynamic(site.doc);
  return (
    <>
      <PersonJsonLd doc={doc} assets={site.assets} origin={appOrigin()} />
      <Portfolio ctx={{ doc, assets: site.assets, siteId: site.id }} analyticsSiteId={site.id} />
    </>
  );
}
