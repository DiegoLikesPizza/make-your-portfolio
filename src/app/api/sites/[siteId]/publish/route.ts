import { NextResponse } from "next/server";
import { requireSiteOwner } from "@/lib/auth";
import { portfolioDoc } from "@/lib/schema/portfolio";
import { publishDocument } from "@/lib/sites";

/**
 * Publish: copy the draft to the published document.
 *
 * The draft is re-validated here rather than trusted. It was validated when it
 * was saved, but a document can also reach the row through a seed, a restore or
 * a future migration, and an invalid one must not become the public page.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const owned = await requireSiteOwner(siteId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = portfolioDoc.safeParse(owned.site.draftDoc);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Draft is not publishable", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { publishedAt, subdomain } = await publishDocument(siteId, parsed.data);

  return NextResponse.json({
    publishedAt: publishedAt.toISOString(),
    url: `/u/${subdomain}`,
  });
}
