import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { hasSmtp } from "@/lib/mail";
import { Card, DashboardShell } from "@/components/dashboard/Shell";
import { MessageList } from "./MessageList";

export const metadata = { title: "Messages" };

/** More than anyone reads in one sitting; older ones are still kept. */
const SHOWN = 200;

export default async function MessagesPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  const [messages, unread] = await Promise.all([
    db.contactMessage.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      take: SHOWN,
      select: { id: true, name: true, email: true, body: true, createdAt: true, readAt: true },
    }),
    db.contactMessage.count({ where: { siteId, readAt: null } }),
  ]);

  return (
    <DashboardShell siteId={siteId} current="messages" title="Messages">
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        From the contact form on your published page
        {hasSmtp ? `. Each one is also emailed to ${owned.user.email}.` : "."}
      </p>

      <Card title={unread > 0 ? `Inbox · ${unread} new` : "Inbox"}>
        <MessageList
          siteId={siteId}
          messages={messages.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
            read: m.readAt !== null,
          }))}
        />
      </Card>
    </DashboardShell>
  );
}
