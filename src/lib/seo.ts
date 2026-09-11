import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { migrate } from "@/lib/schema/portfolio";
import type { AssetMap } from "@/render/context";
import { plain } from "@/lib/text";

/**
 * What search engines and link previews read about a portfolio, as pure
 * functions: the structured data, the sitemap entries and the share card size.
 */

/** The size every generated share card is drawn at. */
export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

/**
 * schema.org `Person` for a portfolio's owner.
 *
 * Only what the page already shows publicly: name, role, headline, portrait and
 * the http(s) links. An image URL has to be absolute, so there is none without
 * an origin.
 */
export function personJsonLd(doc: PortfolioDoc, assets: AssetMap, origin: string | null) {
  const { profile } = doc;
  const portrait = profile.avatarAssetId ? assets[profile.avatarAssetId] : undefined;
  const sameAs = profile.links.map((link) => link.href).filter((href) => /^https?:\/\//i.test(href));

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    ...(profile.eyebrow && { jobTitle: plain(profile.eyebrow) }),
    ...(profile.headline && { description: plain(profile.headline) }),
    ...(portrait && origin && { image: `${origin}${portrait.src}` }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}

/** JSON that can sit inside a <script>: `<` is escaped, so no value can close the tag. */
export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

type PublishedRow = { subdomain: string; publishedAt: Date | null; publishedDoc: unknown };

/**
 * Sitemap entries for published portfolios that haven't asked to stay out of
 * search. Only /u/<handle>: a sitemap may only list URLs on its own host, so
 * custom domains are described by their own pages' metadata instead.
 */
export function portfolioSitemapEntries(sites: PublishedRow[], origin: string) {
  return sites.flatMap((site) => {
    if (!site.publishedAt || !site.publishedDoc) return [];
    try {
      if (migrate(site.publishedDoc).meta.noindex) return [];
    } catch {
      // A document that no longer parses isn't a page anyone can see.
      return [];
    }
    return [{ url: `${origin}/u/${site.subdomain}`, lastModified: site.publishedAt }];
  });
}
