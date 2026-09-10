import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getMySite } from "@/lib/auth";
import { Card, DashboardShell } from "@/components/dashboard/Shell";
import { formatDate } from "@/lib/dates";
import { NameForm, DeleteAccountForm } from "./AccountForms";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const me = await getMySite();
  if (!me?.user) redirect("/signin");

  const { user, site } = me;

  const [sessions, providers] = await Promise.all([
    db.session.count({ where: { userId: user.id } }),
    db.account.findMany({ where: { userId: user.id }, select: { provider: true } }),
  ]);

  return (
    <DashboardShell siteId={site?.id} current="account" title="Account">
      <Card title="Signed in as">
        <p className="mt-2 font-mono text-sm">{user.email}</p>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          This address is the account — it is what a sign-in link is sent to and what identifies you
          across devices, so it can&apos;t be swapped out in place. Signing in with a different address
          creates a separate account.
        </p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-neutral-500">Joined</dt>
          <dd>{formatDate(user.createdAt)}</dd>
          <dt className="text-neutral-500">Sign-in methods</dt>
          <dd>{providers.length ? providers.map((p) => p.provider).join(", ") : "email link"}</dd>
          <dt className="text-neutral-500">Active sessions</dt>
          <dd>{sessions}</dd>
        </dl>
      </Card>

      <Card title="Profile" hint="Only used inside the dashboard. Your portfolio's name is edited in the editor.">
        <NameForm name={user.name ?? ""} />
      </Card>

      <Card
        title="Delete account"
        tone="danger"
        hint={
          site
            ? `This removes your account, the site at /u/${site.subdomain}, every connected domain and every upload. It cannot be undone.`
            : "This removes your account and everything attached to it. It cannot be undone."
        }
      >
        <DeleteAccountForm email={user.email} />
      </Card>
    </DashboardShell>
  );
}
