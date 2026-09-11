import { customAlphabet } from "nanoid";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { ASSET_LIMITS, quotaProblem, resolveAsset } from "@/lib/assets";
import { processUpload, removeAssetFiles, UploadError } from "@/lib/storage";
import { describeWait, LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * Upload one image or GIF to a site. Owner only.
 *
 * A Route Handler rather than a Server Action: actions cap a request body at
 * 1 MB, and a GIF can be fifteen.
 */

/** Lowercase letters and digits: a hyphen in an id would let one asset's file prefix match another's. */
const newAssetId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);

/** Multipart framing around the file; generous, since it only gates the obviously oversized. */
const FORM_OVERHEAD = 64 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const owned = await requireSiteOwner(siteId);
  if (!owned) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Refused on the declared length, before the body is read.
  if (Number(request.headers.get("content-length") ?? 0) > ASSET_LIMITS.gifBytes + FORM_OVERHEAD) {
    return NextResponse.json({ error: "That file is too large." }, { status: 413 });
  }

  const allowed = rateLimit(`upload:${owned.user.id}`, LIMITS.uploadsPerUser);
  if (!allowed.ok) {
    return NextResponse.json({ error: `Too many uploads. Try again in ${describeWait(allowed.retryAfterMs)}.` }, { status: 429 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file was sent." }, { status: 400 });

  const used = await db.asset.aggregate({ where: { siteId }, _count: true, _sum: { bytes: true } });
  const problem = quotaProblem({ count: used._count, bytes: used._sum.bytes ?? 0 }, file.size);
  if (problem) return NextResponse.json({ error: problem }, { status: 413 });

  const id = newAssetId();
  try {
    const processed = await processUpload(siteId, id, Buffer.from(await file.arrayBuffer()));
    const asset = await db.asset
      .create({ data: { id, siteId, storageKey: `${siteId}/${id}`, ...processed } })
      .catch(async (error) => {
        // Files without a row are unreachable and uncounted; don't leave them behind.
        await removeAssetFiles(siteId, id);
        throw error;
      });

    return NextResponse.json({ id: asset.id, asset: resolveAsset(asset) }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: 422 });
    throw error;
  }
}
