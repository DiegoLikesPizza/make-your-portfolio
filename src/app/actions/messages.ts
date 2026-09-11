"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";

/** The owner's side of the contact form: reading and deleting messages. */

export type MessageState = { error?: string };

/** Changes one message — matched on both ids, so a message id alone reaches nothing. */
async function onOwnedMessage(siteId: string, change: () => Promise<{ count: number }>): Promise<MessageState> {
  if (!(await requireSiteOwner(siteId))) return { error: "Not found." };
  const { count } = await change();
  revalidatePath(`/dashboard/${siteId}/messages`);
  return count > 0 ? {} : { error: "That message no longer exists." };
}

export async function markMessageRead(siteId: string, messageId: string): Promise<MessageState> {
  return onOwnedMessage(siteId, () =>
    db.contactMessage.updateMany({ where: { id: messageId, siteId }, data: { readAt: new Date() } }),
  );
}

export async function deleteMessage(siteId: string, messageId: string): Promise<MessageState> {
  return onOwnedMessage(siteId, () => db.contactMessage.deleteMany({ where: { id: messageId, siteId } }));
}
