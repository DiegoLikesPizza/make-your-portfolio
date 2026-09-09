import { notFound } from "next/navigation";
import { requireSiteOwner } from "@/lib/auth";
import { migrate } from "@/lib/schema/portfolio";
import { PreviewFrame } from "@/components/editor/PreviewFrame";

/**
 * The editor's preview pane.
 *
 * Server-renders the saved draft so the frame is never blank, then hands over
 * to the client, which re-renders from postMessage on every keystroke.
 */
export default async function PreviewPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  return <PreviewFrame initialDoc={migrate(owned.site.draftDoc)} />;
}
