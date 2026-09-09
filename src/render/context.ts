import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { Section, SectionType } from "@/lib/schema/sections";

/**
 * Uploaded media, already resolved to URLs.
 *
 * Variants are server components, so React context is unavailable; the map is
 * passed explicitly instead. Keeping it one object means adding a field later
 * doesn't touch sixty component signatures.
 */
export type ResolvedAsset = {
  /** Best available still image. */
  src: string;
  /** Responsive sources, widest last. */
  srcSet?: string;
  /** For ANIMATED assets: the transcoded video and its first frame. */
  video?: string;
  poster?: string;
  width: number;
  height: number;
  alt?: string;
};

export type AssetMap = Record<string, ResolvedAsset>;

export type RenderCtx = {
  doc: PortfolioDoc;
  assets: AssetMap;
  /** True inside the editor preview: disables anchor navigation hijacking. */
  preview?: boolean;
};

export type SectionProps<T extends SectionType = SectionType> = {
  section: Extract<Section, { type: T }>;
  /** 1-based, used for the "01 / About" index labels. */
  index: number;
  ctx: RenderCtx;
};

export function asset(ctx: RenderCtx, id: string | undefined): ResolvedAsset | undefined {
  return id ? ctx.assets[id] : undefined;
}
