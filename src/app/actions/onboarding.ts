"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeSubdomain, validateSubdomain, SUBDOMAIN_MESSAGES } from "@/lib/reserved-subdomains";
import { starterDoc } from "@/lib/fixtures/starter";

export type ClaimState = { error?: string };

/** Claim a subdomain and create the user's first site. */
export async function claimSubdomain(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const subdomain = normalizeSubdomain(String(formData.get("subdomain") ?? ""));

  // Validated here, not just in the browser: the UI check is a convenience.
  const problem = validateSubdomain(subdomain);
  if (problem) return { error: SUBDOMAIN_MESSAGES[problem] };

  // One site per user for now; a second submit shouldn't create a second.
  const existing = await db.site.findFirst({ where: { userId: user.id } });
  if (existing) redirect(`/dashboard/${existing.id}/edit`);

  const taken = await db.site.findUnique({ where: { subdomain } });
  if (taken) return { error: "That address is taken. Try another." };

  const site = await db.site.create({
    data: {
      userId: user.id,
      subdomain,
      draftDoc: starterDoc(user.name ?? "Your name", user.email) as unknown as object,
    },
  });

  redirect(`/dashboard/${site.id}/edit`);
}
