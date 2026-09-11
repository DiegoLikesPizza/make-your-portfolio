import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Portfolio } from "@/render/Portfolio";
import { getPublishedSite } from "@/lib/sites";
import { resolveDynamic } from "@/lib/dynamic";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

/**
 * Every published portfolio, whatever host it was reached by.
 *
 * Sites are one-pagers, so this single route is the entire public surface —
 * the middleware rewrites `diego.example.com` and `diego.dev` alike to here.
 */

type Props = { params: Promise<{ host: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { host } = await params;
  const site = await getPublishedSite(decodeURIComponent(host));
  return site ? portfolioMetadata(resolveDynamic(site.doc)) : {};
}

export default async function SitePage({ params }: Props) {
  const { host } = await params;
  const site = await getPublishedSite(decodeURIComponent(host));

  // An unknown host, or one whose owner has never pressed Publish, is a 404 —
  // a draft must never be reachable on a public hostname.
  if (!site) notFound();

  return <Portfolio ctx={{ doc: resolveDynamic(site.doc), assets: site.assets }} analyticsSiteId={site.id} />;
}
