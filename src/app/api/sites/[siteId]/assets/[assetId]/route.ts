import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { documentsUseAsset } from "@/lib/assets";
import { removeAssetFiles } from "@/lib/storage";

/**
 * Delete an upload nothing uses any more. Owner only.
 *
 * Saved versions count as users: deleting a file one of them needs would leave
 * "Publish this version" putting a page live with a hole in it.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ siteId: string; assetId: string }> }) {
  const { siteId, assetId } = await params;

  const owned = await requireSiteOwner(siteId);
  if (!owned) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const asset = await db.asset.findFirst({ where: { id: assetId, siteId }, select: { id: true } });
  if (!asset) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const versions = await db.siteVersion.findMany({ where: { siteId }, select: { doc: true } });
  const documents = [owned.site.draftDoc, owned.site.publishedDoc, ...versions.map((version) => version.doc)];
  if (documentsUseAsset(documents, assetId)) {
    return NextResponse.json(
      { error: "It's still used by your draft, the live page or a saved version." },
      { status: 409 },
    );
  }

  await db.asset.delete({ where: { id: assetId } });
  await removeAssetFiles(siteId, assetId);
  return new Response(null, { status: 204 });
}
