import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { assetMap } from "@/lib/assets";
import { migrate } from "@/lib/schema/portfolio";
import { PreviewFrame } from "@/components/editor/PreviewFrame";

/**
 * The editor's preview pane.
 *
 * Server-renders the saved draft, with the site's uploads, so the frame is never
 * blank; then hands over to the client, which re-renders from postMessage on
 * every keystroke and every new upload.
 */
export default async function PreviewPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  const assets = assetMap(await db.asset.findMany({ where: { siteId } }));

  return <PreviewFrame initialDoc={migrate(owned.site.draftDoc)} initialAssets={assets} />;
}
