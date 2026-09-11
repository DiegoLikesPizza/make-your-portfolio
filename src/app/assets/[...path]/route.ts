import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { isSafeAssetPath } from "@/lib/assets";
import { assetFilePath, contentTypeFor } from "@/lib/storage";

/**
 * Uploaded files, straight off disk.
 *
 * Caddy serves /assets itself and never reaches this; nginx proxies everything,
 * so there this answers. Only paths shaped exactly like the names uploads are
 * written under are served, so nothing outside the assets directory can be
 * named.
 *
 * Byte ranges are supported because Safari won't play a video without them.
 */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (!isSafeAssetPath(segments)) return new Response(null, { status: 404 });

  const [siteId, file] = segments;
  const location = assetFilePath(siteId, file);
  const info = await stat(location).catch(() => null);
  if (!info?.isFile()) return new Response(null, { status: 404 });

  const headers = {
    "Content-Type": contentTypeFor(file),
    "Accept-Ranges": "bytes",
    // A file name belongs to one upload and is never rewritten.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    // `bytes=-500` means the last 500 bytes.
    const start = range[1] ? Number(range[1]) : Math.max(info.size - Number(range[2]), 0);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    }
    return new Response(Readable.toWeb(createReadStream(location, { start, end })) as ReadableStream, {
      status: 206,
      headers: { ...headers, "Content-Length": String(end - start + 1), "Content-Range": `bytes ${start}-${end}/${info.size}` },
    });
  }

  return new Response(Readable.toWeb(createReadStream(location)) as ReadableStream, {
    headers: { ...headers, "Content-Length": String(info.size) },
  });
}
