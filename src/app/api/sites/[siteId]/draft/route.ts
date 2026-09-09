import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { portfolioDoc } from "@/lib/schema/portfolio";
import { z } from "zod";

/**
 * Autosave. The editor sends the whole document rather than a patch — it is a
 * few KB, and a full replace has no merge semantics to get wrong.
 */

const body = z.object({
  doc: portfolioDoc,
  /**
   * The `updatedAt` the editor last saw. If the row has moved on since, another
   * tab saved in between and this write would silently clobber it.
   */
  baseUpdatedAt: z.string(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const owned = await requireSiteOwner(siteId);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid document", issues: parsed.error.issues }, { status: 422 });
  }

  if (owned.site.updatedAt.toISOString() !== parsed.data.baseUpdatedAt) {
    return NextResponse.json(
      { error: "conflict", updatedAt: owned.site.updatedAt.toISOString() },
      { status: 409 },
    );
  }

  const updated = await db.site.update({
    where: { id: siteId },
    data: { draftDoc: parsed.data.doc },
    select: { updatedAt: true },
  });

  return NextResponse.json({ updatedAt: updated.updatedAt.toISOString() });
}
