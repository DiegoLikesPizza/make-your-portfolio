import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireSiteOwner } from "@/lib/auth";
import { assetMap } from "@/lib/assets";
import { db } from "@/lib/db";
import { resolveDynamic } from "@/lib/dynamic";
import { exportDoc } from "@/lib/export";
import { portfolioMetadata } from "@/lib/portfolio-metadata";
import { migrate } from "@/lib/schema/portfolio";
import { Portfolio } from "@/render/Portfolio";

/**
 * The published page as it goes into an HTML export.
 *
 * Not a page anyone is meant to visit: GET /api/sites/<siteId>/export fetches
 * it and inlines everything it references. Owner-only, and rendered from
 * `exportDoc`, which takes out what needs JavaScript the file won't have.
 *
 * The metadata is the portfolio's own — the file becomes somebody's website —
 * without a share image, whose URL would point back at this app.
 */

type Props = { params: Promise<{ siteId: string }> };

async function exportable(siteId: string) {
  const owned = await requireSiteOwner(siteId);
  if (!owned?.site.publishedDoc) return null;
  const assets = await db.asset.findMany({ where: { siteId } });
  return { doc: exportDoc(resolveDynamic(migrate(owned.site.publishedDoc))), assets: assetMap(assets) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteId } = await params;
  const site = await exportable(siteId);
  return site ? portfolioMetadata(site.doc) : {};
}

export default async function ExportPage({ params }: Props) {
  const { siteId } = await params;
  const site = await exportable(siteId);
  if (!site) notFound();

  // No siteId and no analyticsSiteId: the file has no server to post a message
  // or count a view to.
  return <Portfolio ctx={{ doc: site.doc, assets: site.assets }} />;
}
