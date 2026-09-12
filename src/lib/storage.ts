import "server-only";

import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { ASSET_LIMITS, assetFiles, renditionWidths, type AssetVariants } from "@/lib/assets";

/**
 * Uploaded files on disk: validating an upload, writing its renditions, and
 * removing them again.
 */

const run = promisify(execFile);

/**
 * Where uploads live. Caddy serves this directory at /assets without touching
 * Node; under nginx, src/app/assets/[...path] serves it.
 *
 * Only known at runtime, which the build's file tracing can't scope: without the
 * turbopackIgnore marks it traced the whole project into the standalone output —
 * source, docs, and any `.env.*` file lying in the app folder. Every upload path
 * goes through `uploadPath` for that reason.
 */
export const ASSETS_DIR = path.resolve(
  /* turbopackIgnore: true */ process.env.ASSETS_DIR || path.join(process.cwd(), "data", "assets"),
);

/** A path under ASSETS_DIR. */
function uploadPath(...segments: string[]): string {
  return path.join(/* turbopackIgnore: true */ ASSETS_DIR, ...segments);
}

/** A problem with the upload itself, worded for the person who uploaded it. */
export class UploadError extends Error {}

export type ProcessedAsset = {
  kind: "IMAGE" | "ANIMATED";
  mime: string;
  width: number;
  height: number;
  bytes: number;
  variants: AssetVariants;
};

/**
 * Formats accepted, as sharp names them once it has decoded the bytes (AVIF
 * reports as heif). SVG is not among them: it can carry script, and it would be
 * served from the same origin as the dashboard.
 */
const ACCEPTED = new Set(["jpeg", "png", "webp", "gif", "heif"]);

/**
 * Validate an upload and write everything the renderer needs.
 *
 * The bytes are trusted, never the file name or the declared type: whatever
 * sharp decodes is what the file is. Stills are re-encoded, which also drops
 * EXIF — including GPS — because sharp only keeps metadata when asked to.
 */
export async function processUpload(siteId: string, assetId: string, input: Buffer): Promise<ProcessedAsset> {
  const meta = await sharp(input, { animated: true })
    .metadata()
    .catch(() => {
      throw new UploadError("That file isn't an image this can read.");
    });
  if (!meta.format || !ACCEPTED.has(meta.format)) {
    throw new UploadError("Upload a JPEG, PNG, WebP, AVIF or GIF.");
  }

  const limit = meta.format === "gif" ? ASSET_LIMITS.gifBytes : ASSET_LIMITS.imageBytes;
  if (input.length > limit) {
    throw new UploadError(`That file is over ${limit / 1024 / 1024} MB.`);
  }

  // An animated image reports the height of every frame stacked; one frame is pageHeight.
  const frameHeight = meta.pageHeight ?? meta.height ?? 0;
  // EXIF orientations 5–8 are rotated a quarter turn, which swaps the sides.
  const [width, height] = (meta.orientation ?? 1) >= 5 ? [frameHeight, meta.width ?? 0] : [meta.width ?? 0, frameHeight];
  if (!width || !height) throw new UploadError("That image has no size.");

  const animated = (meta.pages ?? 1) > 1;
  const widths = renditionWidths(width);
  const dir = uploadPath(siteId);
  await mkdir(dir, { recursive: true });

  try {
    for (const w of widths) {
      await sharp(input, { page: 0 })
        .rotate()
        .resize({ width: w })
        .webp({ quality: 82 })
        .toFile(uploadPath(siteId, assetFiles.still(assetId, w)));
    }

    let video = false;
    if (animated) {
      await sharp(input, { animated: true })
        .resize({ width: Math.min(width, 1200) })
        .webp({ quality: 75 })
        .toFile(uploadPath(siteId, assetFiles.animated(assetId)));
      video = await gifToVideo(input, uploadPath(siteId, assetFiles.video(assetId)));
    }

    const largest = widths[widths.length - 1];
    return {
      kind: animated ? "ANIMATED" : "IMAGE",
      mime: `image/${meta.format}`,
      width: largest,
      height: Math.round((height * largest) / width),
      bytes: await sizeOnDisk(dir, assetId),
      variants: { widths, animated, video },
    };
  } catch (error) {
    await removeAssetFiles(siteId, assetId);
    throw error;
  }
}

/**
 * GIF → mp4, when ffmpeg is installed. An animated background as video is a
 * fraction of the GIF's weight. Without ffmpeg the looping webp still plays, so
 * its absence is expected rather than an error.
 */
async function gifToVideo(input: Buffer, output: string): Promise<boolean> {
  const temp = await mkdtemp(path.join(tmpdir(), "upload-"));
  const source = path.join(temp, "source.gif");
  try {
    await writeFile(source, input);
    await run(
      "ffmpeg",
      [
        "-y", "-loglevel", "error", "-i", source,
        "-an", "-movflags", "+faststart", "-pix_fmt", "yuv420p",
        // H.264 in yuv420p needs even dimensions.
        "-vf", "scale='trunc(min(1280,iw)/2)*2':-2",
        output,
      ],
      { timeout: 120_000 },
    );
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`[uploads] ffmpeg: ${(error as Error).message}`);
    }
    await rm(output, { force: true });
    return false;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

/** Asset ids contain no hyphen, so `<id>-` and `<id>.` only ever match that asset's own files. */
async function filesOf(dir: string, assetId: string): Promise<string[]> {
  const files = await readdir(dir).catch(() => [] as string[]);
  return files.filter((file) => file.startsWith(`${assetId}-`) || file.startsWith(`${assetId}.`));
}

async function sizeOnDisk(dir: string, assetId: string): Promise<number> {
  const sizes = await Promise.all((await filesOf(dir, assetId)).map((file) => stat(path.join(dir, file))));
  return sizes.reduce((total, file) => total + file.size, 0);
}

export async function removeAssetFiles(siteId: string, assetId: string) {
  const files = await filesOf(uploadPath(siteId), assetId);
  await Promise.all(files.map((file) => rm(uploadPath(siteId, file), { force: true })));
}

/** Everything a site uploaded, for when the site itself is deleted. */
export async function removeSiteAssets(siteId: string) {
  await rm(uploadPath(siteId), { recursive: true, force: true });
}

/** A file's location; only call with segments that passed `isSafeAssetPath`. */
export function assetFilePath(siteId: string, file: string): string {
  return uploadPath(siteId, file);
}

export function contentTypeFor(file: string): string {
  return file.endsWith(".mp4") ? "video/mp4" : "image/webp";
}
