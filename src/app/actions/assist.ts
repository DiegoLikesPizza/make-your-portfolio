"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { migrate, portfolioDoc } from "@/lib/schema/portfolio";
import { applyBrief } from "@/lib/assist/brief";
import { generateBrief } from "@/lib/assist/generate";
import { describeWait, LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * "Write it for me".
 *
 * Writes to the *draft* and never publishes. What comes back from a model is a
 * first draft by definition, and the whole editor exists to fix it — putting it
 * straight on the public page would be the one irreversible thing this feature
 * could do.
 */

export type AssistState = { error?: string; ok?: string };

export async function writeDraft(siteId: string, _prev: AssistState, formData: FormData): Promise<AssistState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  const about = String(formData.get("about") ?? "").trim();
  if (about.length < 40) {
    return { error: "Give it a bit more to work with — a few sentences at least." };
  }
  if (about.length > 8000) {
    return { error: "That's longer than this needs. Trim it to the highlights." };
  }

  // After validation, so a rejected description doesn't use up an attempt, and
  // before the model call, which is the expensive part being limited.
  const allowed = rateLimit(`assist:${owned.user.id}`, LIMITS.assistPerUser);
  if (!allowed.ok) {
    return { error: `That's the daily limit for generated drafts. Try again in ${describeWait(allowed.retryAfterMs)}.` };
  }

  const result = await generateBrief(about);
  if (!result.ok) return { error: result.error };

  const next = applyBrief(migrate(owned.site.draftDoc), result.brief);

  // The same gate publish uses. A draft that can't be parsed is a draft the
  // editor can't open, so an invalid one must never be written.
  const parsed = portfolioDoc.safeParse(next);
  if (!parsed.success) {
    return { error: "The generated content didn't fit the portfolio schema. Nothing was changed." };
  }

  await db.site.update({ where: { id: siteId }, data: { draftDoc: parsed.data } });
  revalidatePath(`/dashboard/${siteId}/edit`);

  return { ok: "Draft rewritten. Open the editor to see it — nothing is published until you press Publish." };
}
