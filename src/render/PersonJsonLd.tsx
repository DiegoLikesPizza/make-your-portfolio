import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { AssetMap } from "./context";
import { jsonForScript, personJsonLd } from "@/lib/seo";

/**
 * Structured data about the portfolio's owner, for search engines.
 *
 * Rendered by the public page routes rather than by <Portfolio>, so the editor
 * preview and the layout picker don't emit it. A data block, not script: the
 * browser never runs it, so the Content-Security-Policy doesn't apply.
 */
export function PersonJsonLd({ doc, assets, origin }: { doc: PortfolioDoc; assets: AssetMap; origin: string | null }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonForScript(personJsonLd(doc, assets, origin)) }}
    />
  );
}
