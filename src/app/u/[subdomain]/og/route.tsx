import { getPublishedSiteByHandle } from "@/lib/sites";
import { resolveDynamic } from "@/lib/dynamic";
import { shareCard } from "@/lib/share-card";

/**
 * The generated share card for a published portfolio.
 *
 * A plain route rather than the opengraph-image file convention: that one
 * outranks the metadata, so an image the owner uploaded could never replace it,
 * and on a custom domain its relative URL would resolve to the portfolio page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const site = await getPublishedSiteByHandle(subdomain);
  if (!site) return new Response(null, { status: 404 });
  return shareCard(resolveDynamic(site.doc));
}
