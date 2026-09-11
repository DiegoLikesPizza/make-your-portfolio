import type { Metadata } from "next";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { plain } from "@/lib/text";

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
export function portfolioMetadata({ meta, profile }: PortfolioDoc): Metadata {
  const title = meta.title || `${profile.name} — Portfolio`;
  const description = meta.description || plain(profile.headline);

  return {
    title,
    description,
    robots: meta.noindex ? { index: false, follow: false } : undefined,
    openGraph: { type: "website", title, description, siteName: profile.name },
  };
}
