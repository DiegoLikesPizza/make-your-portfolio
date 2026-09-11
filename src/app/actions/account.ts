"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { signOut } from "@/auth";
import { getCurrentUser } from "@/lib/auth";
import { releaseHandle } from "@/lib/handle-releases";
import { removeSiteAssets } from "@/lib/storage";

/** Account-level actions: the things that are about the person, not the site. */

export type AccountState = { error?: string; ok?: string };

export async function renameAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim().slice(0, 120);

  await db.user.update({ where: { id: user.id }, data: { name: name || null } });
  revalidatePath("/dashboard/account");
  return { ok: "Saved." };
}

/**
 * Delete the account and everything under it.
 *
 * Sites, domains, assets and sessions all cascade from the User row, so this is
 * one delete rather than a cleanup routine that can half-fail. The typed
 * confirmation is the whole safety mechanism — this is not reversible and there
 * is no trash to restore from, so it asks for the one string the user has to
 * read the page to know.
 */
export async function deleteAccount(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };

  const typed = String(formData.get("confirm") ?? "").trim().toLowerCase();
  if (typed !== user.email.toLowerCase()) {
    return { error: "Type your email address exactly to confirm." };
  }

  // Read before the cascade removes them: the handles stay reserved after the
  // account is gone, and uploaded files live on disk, outside the cascade.
  const sites = await db.site.findMany({ where: { userId: user.id }, select: { id: true, subdomain: true } });

  await db.user.delete({ where: { id: user.id } });
  await Promise.all(sites.map((site) => releaseHandle(site.subdomain, user.id)));
  await Promise.all(sites.map((site) => removeSiteAssets(site.id)));

  // Signing out redirects, so nothing after this runs.
  await signOut({ redirectTo: "/" });
  return {};
}
