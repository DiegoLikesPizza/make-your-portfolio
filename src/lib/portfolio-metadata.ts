import type { Metadata } from "next";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { AssetMap } from "@/render/context";
import { plain } from "@/lib/text";
import { SHARE_CARD_SIZE } from "@/lib/seo";

/**
 * A published portfolio's <head>: title, description, search visibility and
 * link preview.
 *
 * Shared by every route a portfolio is reached by — /u/<handle>, a custom
 * domain, the demos — because a page has to present itself the same way
 * whichever URL someone shared. A route without it silently inherits the app's
 * own title from the root layout, which is what /u/<handle> used to do.
 *
 * Expects a document whose dynamic values are already resolved.
 */

export type PortfolioMetadataOptions = {
  /** The generated share card for this page, e.g. `/u/diego/og`. */
  cardPath?: string;
  /** The site's uploads, for an uploaded share image. */
  assets?: AssetMap;
  /**
   * Where to make image URLs absolute. A custom domain needs it: every path
   * there is the portfolio page, so a relative card URL would never resolve.
   */
  origin?: string | null;
};

export function portfolioMetadata(
  { meta, profile }: PortfolioDoc,
  { cardPath, assets = {}, origin }: PortfolioMetadataOptions = {},
): Metadata {
  const title = meta.title || `${profile.name} — Portfolio`;
  const description = meta.description || plain(profile.headline);

  const absolute = (path: string) => (origin ? `${origin}${path}` : path);
  // An uploaded share image wins over the generated card.
  const uploaded = meta.ogAssetId ? assets[meta.ogAssetId] : undefined;
  const image = uploaded
    ? { url: absolute(uploaded.poster ?? uploaded.src), width: uploaded.width, height: uploaded.height }
    : cardPath
      ? { url: absolute(cardPath), ...SHARE_CARD_SIZE }
      : undefined;

  return {
    title,
    description,
    robots: meta.noindex ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", title, description, siteName: profile.name, ...(image && { images: [image] }) },
    ...(image && { twitter: { card: "summary_large_image", title, description, images: [image.url] } }),
  };
}
