import { db } from "@/lib/db";
import { auth } from "@/auth";

/**
 * Who is making this request, and what they are allowed to touch.
 *
 * Everything that reads or writes a site goes through `requireSiteOwner`, so
 * there is exactly one place where "is this yours?" is answered.
 */

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}

/**
 * Load a site the current user owns, or return null.
 *
 * Callers must never look a site up by id alone — that is how one user ends up
 * editing another's portfolio. Returning null (rather than throwing) lets pages
 * render a 404, which also avoids confirming that an id exists.
 */
export async function requireSiteOwner(siteId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const site = await db.site.findFirst({ where: { id: siteId, userId: user.id } });
  return site ? { user, site } : null;
}

/** The signed-in user's site, if they have finished onboarding. */
export async function getMySite() {
  const user = await getCurrentUser();
  if (!user) return null;
  const site = await db.site.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  return site ? { user, site } : { user, site: null };
}
