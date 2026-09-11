"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { revalidateSite } from "@/lib/sites";
import { clearRelease, isReservedForSomeoneElse, releaseHandle } from "@/lib/handle-releases";
import { newPreviewToken } from "@/lib/preview-links";
import { normalizeSubdomain, SUBDOMAIN_MESSAGES, validateSubdomain } from "@/lib/reserved-subdomains";

/** Site-level settings: the things that are about the site, not its content. */

export type SiteState = { error?: string; ok?: string };

/**
 * Change the handle a site is published under.
 *
 * The old URL stops working immediately — there is no redirect, because a
 * freed handle has to become claimable by someone else, and a permanent
 * redirect from a name that now belongs to a different person is worse than a
 * 404. It stays reserved for its previous owner for a while first, though, so
 * nobody else can take it the same second (src/lib/handles.ts).
 */
export async function renameHandle(siteId: string, _prev: SiteState, formData: FormData): Promise<SiteState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  const next = normalizeSubdomain(String(formData.get("subdomain") ?? ""));
  if (next === owned.site.subdomain) return { ok: "That's already the handle." };

  const problem = validateSubdomain(next);
  if (problem) return { error: SUBDOMAIN_MESSAGES[problem] };

  // A reservation reads as "taken", the same as a handle in use: whose it was
  // is not something to tell a stranger.
  const taken = await db.site.findUnique({ where: { subdomain: next }, select: { id: true } });
  if (taken || (await isReservedForSomeoneElse(next, owned.user.id))) {
    return { error: "That handle is taken." };
  }

  const previous = owned.site.subdomain;
  await db.site.update({ where: { id: siteId }, data: { subdomain: next } });
  await releaseHandle(previous, owned.user.id);
  await clearRelease(next);

  // Both handles have to be dropped: the old one so it stops serving, the new
  // one because a 404 for it may already be cached from before it existed.
  const hostnames = (
    await db.domain.findMany({ where: { siteId }, select: { hostname: true } })
  ).map((d) => d.hostname);
  await revalidateSite(previous, hostnames);
  await revalidateSite(next, hostnames);

  revalidatePath(`/dashboard/${siteId}/settings`);
  return { ok: `Now published at /u/${next}.` };
}

/**
 * Unpublish without deleting: clears the published document, keeps the draft.
 *
 * The alternative — a `published` boolean — would leave a stale document in the
 * row that a later bug could serve. There is nothing to serve after this.
 */
export async function unpublishSite(siteId: string): Promise<SiteState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  await db.site.update({
    where: { id: siteId },
    // Prisma.DbNull, not `null`: on a Json column `null` means "JSON null" and
    // `undefined` means "leave it alone" — neither of which clears the column.
    data: { publishedDoc: Prisma.DbNull, publishedAt: null },
  });

  const hostnames = (
    await db.domain.findMany({ where: { siteId }, select: { hostname: true } })
  ).map((d) => d.hostname);
  await revalidateSite(owned.site.subdomain, hostnames);

  revalidatePath(`/dashboard/${siteId}/settings`);
  return { ok: "Taken offline. Your draft is untouched — press Publish to put it back." };
}

/**
 * Create the private draft preview link, or replace it: the old link stops
 * working the moment a new token exists.
 */
export async function createPreviewLink(siteId: string): Promise<SiteState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  await db.site.update({ where: { id: siteId }, data: { previewToken: newPreviewToken() } });

  revalidatePath(`/dashboard/${siteId}/settings`);
  return { ok: owned.site.previewToken ? "New link created. The old one no longer works." : "Preview link created." };
}

/** Turn the draft preview link off. */
export async function revokePreviewLink(siteId: string): Promise<SiteState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  await db.site.update({ where: { id: siteId }, data: { previewToken: null } });

  revalidatePath(`/dashboard/${siteId}/settings`);
  return { ok: "Preview link turned off." };
}

/** Delete the site and everything under it. Domains, assets and views cascade. */
export async function deleteSite(siteId: string, _prev: SiteState, formData: FormData): Promise<SiteState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  const typed = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (typed !== owned.site.subdomain.toLowerCase()) {
    return { error: "Type the handle exactly to confirm." };
  }

  const hostnames = (
    await db.domain.findMany({ where: { siteId }, select: { hostname: true } })
  ).map((d) => d.hostname);

  await db.site.delete({ where: { id: siteId } });
  await releaseHandle(owned.site.subdomain, owned.user.id);
  await revalidateSite(owned.site.subdomain, hostnames);

  redirect("/dashboard");
}
