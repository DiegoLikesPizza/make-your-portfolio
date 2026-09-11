import type { AssetMap, ResolvedAsset } from "@/render/context";

/**
 * Uploaded media: the rules, and how a stored asset becomes URLs.
 *
 * No database and no filesystem in here, so the editor can use it and the tests
 * can reach it. The files themselves are written by src/lib/storage.ts.
 */

export const ASSET_LIMITS = {
  /** A still image, before it is resized. */
  imageBytes: 5 * 1024 * 1024,
  /** A GIF: animated ones are large until they are converted. */
  gifBytes: 15 * 1024 * 1024,
  assetsPerSite: 100,
  bytesPerSite: 200 * 1024 * 1024,
};

/** Widths every still is written at. */
const WIDTHS = [400, 800, 1600];

/** The widths to write for an image this wide: never wider than the original. */
export function renditionWidths(originalWidth: number): number[] {
  const largest = Math.min(originalWidth, WIDTHS[WIDTHS.length - 1]);
  return [...WIDTHS.filter((width) => width < largest), largest];
}

/** What is on disk for one asset — the `variants` column. */
export type AssetVariants = {
  /** A `<id>-<width>.webp` still for each. For an animated upload, its first frame. */
  widths: number[];
  /** Animated: a looping `<id>-anim.webp` exists. */
  animated: boolean;
  /** Animated: an `<id>.mp4` exists too (only where ffmpeg was available). */
  video: boolean;
};

/** File names, in one place: the writer, the server and the URLs all agree. */
export const assetFiles = {
  still: (id: string, width: number) => `${id}-${width}.webp`,
  animated: (id: string) => `${id}-anim.webp`,
  video: (id: string) => `${id}.mp4`,
};

export type StoredAsset = { id: string; siteId: string; width: number; height: number; variants: unknown };

/** One stored asset as URLs a renderer can use. */
export function resolveAsset(asset: StoredAsset): ResolvedAsset {
  const variants = asset.variants as AssetVariants;
  const url = (file: string) => `/assets/${asset.siteId}/${file}`;
  const largest = variants.widths[variants.widths.length - 1];
  const still = url(assetFiles.still(asset.id, largest));

  if (variants.animated) {
    return {
      // An <img> plays the looping webp; backgrounds prefer the video when there is one.
      src: url(assetFiles.animated(asset.id)),
      video: variants.video ? url(assetFiles.video(asset.id)) : undefined,
      poster: still,
      width: asset.width,
      height: asset.height,
    };
  }

  return {
    src: still,
    srcSet: variants.widths.map((width) => `${url(assetFiles.still(asset.id, width))} ${width}w`).join(", "),
    width: asset.width,
    height: asset.height,
  };
}

export function assetMap(assets: StoredAsset[]): AssetMap {
  return Object.fromEntries(assets.map((asset) => [asset.id, resolveAsset(asset)]));
}

const SITE_SEGMENT = /^[a-z0-9]+$/;
const FILE_SEGMENT = /^[a-z0-9]+(-\d{1,4}|-anim)?\.(webp|mp4)$/;

/**
 * `/assets/<siteId>/<file>`: exactly two segments, shaped like names uploads
 * are written under. Anything else — `..`, a slash, another extension — is
 * refused before a path is ever built from it.
 */
export function isSafeAssetPath(segments: string[]): boolean {
  return segments.length === 2 && SITE_SEGMENT.test(segments[0]) && FILE_SEGMENT.test(segments[1]);
}

/** Why this upload would take the site past its quota, or null if it fits. */
export function quotaProblem(used: { count: number; bytes: number }, incomingBytes: number): string | null {
  if (used.count >= ASSET_LIMITS.assetsPerSite) {
    return `This site already has ${ASSET_LIMITS.assetsPerSite} uploads. Delete unused ones in Settings first.`;
  }
  if (used.bytes + incomingBytes > ASSET_LIMITS.bytesPerSite) {
    return "That would take this site's uploads past 200 MB. Delete unused ones in Settings first.";
  }
  return null;
}

/** Does any of these documents use the asset? Asset ids only ever appear as whole JSON strings. */
export function documentsUseAsset(documents: unknown[], assetId: string): boolean {
  const needle = JSON.stringify(assetId);
  return documents.some((doc) => doc != null && JSON.stringify(doc).includes(needle));
}
