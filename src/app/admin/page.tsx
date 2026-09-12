import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isAdminEmail } from "@/lib/admin";
import { describeChange, fillDays, parseRange, windowStart } from "@/lib/analytics";
import { formatDate } from "@/lib/dates";
import { Card } from "@/components/dashboard/Shell";
import { CountTable } from "@/components/dashboard/CountTable";
import { RangePicker } from "@/components/dashboard/RangePicker";
import { Stat } from "@/components/dashboard/Stat";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { SignOutButton } from "@/components/editor/SignOutButton";

/**
 * The whole instance at a glance: accounts, sites and traffic.
 *
 * Read-only on purpose. Everything here is a count or a list the existing
 * tables already answer, and nothing on the page changes anybody's data.
 */

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const NEWEST_ACCOUNTS = 10;
const TOP_ROWS = 10;

function megabytes(bytes: number) {
  return `${(bytes / 1_048_576).toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ days?: string | string[] }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!isAdmin(user)) {
    // Listed but never proven: say what's missing rather than leave a 404 to
    // puzzle over. Only someone signed in with a listed address sees this.
    if (isAdminEmail(user.email)) return <Unproven email={user.email} />;
    // Anyone else gets the same 404 as a page that doesn't exist, rather than
    // a "forbidden" that confirms there is something here.
    notFound();
  }

  const range = parseRange((await searchParams).days);
  const now = new Date();
  const since = windowStart(range, now);
  // The window of the same length just before this one, for the comparison.
  const before = windowStart(range * 2, now);

  const [
    userCount,
    signups,
    siteCount,
    publishedCount,
    viewsByDay,
    previousViews,
    allTimeViews,
    viewsBySite,
    viewsBySource,
    publishes,
    messages,
    domainCount,
    verifiedDomains,
    uploads,
    newest,
  ] = await Promise.all([
    db.user.count(),
    db.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    db.site.count(),
    db.site.count({ where: { publishedAt: { not: null } } }),
    db.siteView.groupBy({ by: ["day"], where: { day: { gte: since } }, _sum: { count: true } }),
    db.siteView.aggregate({ where: { day: { gte: before, lt: since } }, _sum: { count: true } }),
    db.siteView.aggregate({ _sum: { count: true } }),
    db.siteView.groupBy({
      by: ["siteId"],
      where: { day: { gte: since } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: TOP_ROWS,
    }),
    db.siteView.groupBy({
      by: ["source"],
      where: { day: { gte: since } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: TOP_ROWS,
    }),
    db.siteVersion.count({ where: { publishedAt: { gte: since } } }),
    db.contactMessage.count({ where: { createdAt: { gte: since } } }),
    db.domain.count(),
    db.domain.count({ where: { verified: true } }),
    db.asset.aggregate({ _count: { _all: true }, _sum: { bytes: true } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: NEWEST_ACCOUNTS,
      select: {
        id: true,
        email: true,
        createdAt: true,
        sites: { select: { subdomain: true, publishedAt: true }, orderBy: { createdAt: "asc" }, take: 1 },
      },
    }),
  ]);

  // A groupBy can't select through a relation, so the busiest sites' handles
  // are a second lookup.
  const busiest = await db.site.findMany({
    where: { id: { in: viewsBySite.map((row) => row.siteId) } },
    select: { id: true, subdomain: true, publishedAt: true },
  });
  const siteById = new Map(busiest.map((site) => [site.id, site]));

  const views = fillDays(
    viewsByDay.map((row) => ({ day: row.day, count: row._sum.count ?? 0 })),
    range,
    now,
  );
  const viewTotal = views.reduce((sum, d) => sum + d.count, 0);
  const signupDays = fillDays(
    signups.map((account) => ({ day: account.createdAt, count: 1 })),
    range,
    now,
  );
  const last = `last ${range} days`;

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
          <Link href="/dashboard" className="text-sm font-semibold">
            Make Your Portfolio
          </Link>
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-white dark:text-neutral-900">
            Admin
          </span>
          <div className="ml-auto flex items-center gap-5">
            <Link
              href="/dashboard"
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white"
            >
              Your dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Every account, site and view on this instance.
        </p>
        <RangePicker basePath="/admin" current={range} />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Accounts" value={userCount} detail={`${signups.length.toLocaleString()} new in the ${last}`} />
          <Stat label="Published sites" value={publishedCount} detail={`of ${siteCount.toLocaleString()} created`} />
          <Stat
            label={`Views, ${last}`}
            value={viewTotal}
            detail={describeChange(viewTotal, previousViews._sum.count ?? 0, range)}
          />
          <Stat label="Views, all time" value={allTimeViews._sum.count ?? 0} />
          <Stat label={`Publishes, ${last}`} value={publishes} />
          <Stat label={`Messages, ${last}`} value={messages} detail="Sent through contact forms" />
          <Stat label="Verified domains" value={verifiedDomains} detail={`of ${domainCount.toLocaleString()} connected`} />
          <Stat label="Uploads" value={uploads._count._all} detail={megabytes(uploads._sum.bytes ?? 0)} />
        </div>

        <Card title={`Daily views · every site · ${last}`}>
          <ViewsChart days={views} empty="No views on any site in this window." />
        </Card>

        <Card title={`Daily signups · ${last}`}>
          <ViewsChart days={signupDays} unit={["signup", "signups"]} empty="Nobody signed up in this window." />
        </Card>

        <div className="grid gap-x-6 lg:grid-cols-2">
          <Card title={`Busiest sites · ${last}`}>
            <CountTable
              label="Site"
              rows={viewsBySite.flatMap((row) => {
                const site = siteById.get(row.siteId);
                if (!site) return [];
                return [
                  {
                    key: site.id,
                    label: site.publishedAt ? (
                      <a href={`/u/${site.subdomain}`} className="underline-offset-2 hover:underline">
                        {site.subdomain}
                      </a>
                    ) : (
                      <>
                        {site.subdomain}{" "}
                        <span className="font-sans text-xs text-neutral-500 dark:text-neutral-400">offline</span>
                      </>
                    ),
                    count: row._sum.count ?? 0,
                  },
                ];
              })}
            />
          </Card>

          <Card title={`Where views came from · ${last}`}>
            <CountTable
              label="Source"
              rows={viewsBySource.map((row) => ({
                key: `source:${row.source}`,
                label: row.source || "direct",
                count: row._sum.count ?? 0,
              }))}
            />
          </Card>
        </div>

        <Card title="Newest accounts">
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.08em] text-neutral-500">
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Site</th>
                  <th className="pb-2 text-right font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {newest.map((account) => {
                  const site = account.sites[0];
                  return (
                    <tr key={account.id} className="border-t border-neutral-200 dark:border-neutral-800">
                      <td className="py-2 pr-4 font-mono">{account.email}</td>
                      <td className="py-2 pr-4">
                        {!site ? (
                          <span className="text-neutral-500 dark:text-neutral-400">No site yet</span>
                        ) : site.publishedAt ? (
                          <a href={`/u/${site.subdomain}`} className="font-mono underline-offset-2 hover:underline">
                            /u/{site.subdomain}
                          </a>
                        ) : (
                          <span className="font-mono text-neutral-500 dark:text-neutral-400">
                            /u/{site.subdomain} · not published
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2 text-right tabular-nums">{formatDate(account.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="mt-8 text-xs text-neutral-500 dark:text-neutral-400">
          Views are counted on published portfolios only — <span className="font-mono">/u/&lt;handle&gt;</span> and
          custom domains. The homepage, /layouts, the demos and the dashboard aren&apos;t counted, and no visitor is
          identified, so there is no unique-visitors number here either. Days are UTC.
        </p>
      </main>
    </div>
  );
}

/** A listed address whose account has never signed in by email link. */
function Unproven({ email }: { email: string }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Confirm this address first</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        <span className="font-mono text-neutral-900 dark:text-neutral-50">{email}</span> is an admin address, but this
        account has never signed in with an email link, which is what proves it owns the address. Sign out and sign
        back in with your email address once — after that, this page opens however you sign in.
      </p>
      <div className="mt-6 flex items-center gap-5">
        <SignOutButton />
        <Link href="/dashboard" className="text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white">
          Back to the dashboard
        </Link>
      </div>
    </main>
  );
}
