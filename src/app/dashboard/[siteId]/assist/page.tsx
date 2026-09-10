import { notFound, redirect } from "next/navigation";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { Card, DashboardShell } from "@/components/dashboard/Shell";
import { ASSIST_ENABLED } from "@/lib/assist/generate";
import { AssistForm } from "./AssistForm";

export const metadata = { title: "Write it for me" };

export default async function AssistPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  // Reaching this URL on a server with no key is a 404 rather than a disabled
  // page: the feature does not exist here, and a greyed-out form that can never
  // work is worse than no page at all.
  if (!ASSIST_ENABLED) notFound();

  return (
    <DashboardShell siteId={siteId} current="assist" title="Write it for me">
      <Card
        title="Describe yourself"
        hint="Claude turns this into the words on your page — the headline, the about text, your projects and roles. Your design, colours and layout are left exactly as they are."
      >
        <AssistForm siteId={siteId} />
      </Card>

      <Card title="What it won't do">
        <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
          <li>
            It won&apos;t make things up. Employers, dates, clients and numbers come from what you
            write here and nowhere else, so a thin description gets you a short page rather than an
            invented one.
          </li>
          <li>
            It replaces the whole draft in one go. If you&apos;ve already written something you like,
            copy it somewhere first.
          </li>
          <li>It never publishes. Everything lands in the draft for you to edit.</li>
        </ul>
      </Card>
    </DashboardShell>
  );
}
