"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { migrate } from "@/lib/schema/portfolio";
import { publishDocument } from "@/lib/sites";

/** Going back to an earlier published version of a site. */

export type VersionState = { error?: string; ok?: string };

/** A version of a site the current user owns — looked up by both ids, never the version id alone. */
async function ownedVersion(siteId: string, versionId: string) {
  if (!(await requireSiteOwner(siteId))) return null;
  return db.siteVersion.findFirst({ where: { id: versionId, siteId }, select: { doc: true } });
}

/**
 * Load an old version into the editor, replacing the draft. The live page
 * doesn't change until the owner presses Publish.
 *
 * Through `migrate`, so a version saved under older rules comes back meeting
 * today's (unsafe links emptied, new defaults filled in).
 */
export async function restoreToDraft(siteId: string, versionId: string): Promise<VersionState> {
  const version = await ownedVersion(siteId, versionId);
  if (!version) return { error: "Not found." };

  await db.site.update({ where: { id: siteId }, data: { draftDoc: migrate(version.doc) } });

  revalidatePath(`/dashboard/${siteId}/edit`);
  return { ok: "Loaded into the editor. Nothing changes on the live page until you press Publish." };
}

/**
 * Put an old version live again. It is recorded as a new version, so going
 * back is itself something you can undo.
 */
export async function republishVersion(siteId: string, versionId: string): Promise<VersionState> {
  const version = await ownedVersion(siteId, versionId);
  if (!version) return { error: "Not found." };

  await publishDocument(siteId, migrate(version.doc));

  revalidatePath(`/dashboard/${siteId}/settings`);
  return { ok: "That version is live again." };
}
