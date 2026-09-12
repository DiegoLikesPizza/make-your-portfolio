import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { describeChange, fillDays, parseRange, windowStart } from "@/lib/analytics";
import { Card, DashboardShell } from "@/components/dashboard/Shell";
import { CountTable } from "@/components/dashboard/CountTable";
import { RangePicker } from "@/components/dashboard/RangePicker";
import { Stat } from "@/components/dashboard/Stat";
import { ViewsChart } from "@/components/dashboard/ViewsChart";

export const metadata = { title: "Analytics" };

type Props = {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<{ days?: string | string[] }>;
};

export default async function AnalyticsPage({ params, searchParams }: Props) {
  const { siteId } = await params;
  const range = parseRange((await searchParams).days);

  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  const now = new Date();
  const since = windowStart(range, now);
  // The window of the same length just before this one, for the comparison.
  const before = windowStart(range * 2, now);

  const [recent, previous, allTime, sources] = await Promise.all([
    db.siteView.findMany({
      where: { siteId, day: { gte: since } },
      select: { day: true, count: true },
    }),
    db.siteView.aggregate({ where: { siteId, day: { gte: before, lt: since } }, _sum: { count: true } }),
    db.siteView.aggregate({ where: { siteId }, _sum: { count: true } }),
    db.siteView.groupBy({
      by: ["source"],
      where: { siteId, day: { gte: since } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 8,
    }),
  ]);

  const days = fillDays(recent, range, now);
  const windowTotal = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <DashboardShell siteId={siteId} current="analytics" title="Analytics">
      <RangePicker basePath={`/dashboard/${siteId}/analytics`} current={range} />

      {!owned.site.publishedAt && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          This site isn&apos;t published, so nothing is being counted yet.{" "}
          <Link href={`/dashboard/${siteId}/edit`} className="underline underline-offset-2">
            Open the editor
          </Link>{" "}
          and press Publish.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Stat
          label={`Views, last ${range} days`}
          value={windowTotal}
          detail={describeChange(windowTotal, previous._sum.count ?? 0, range)}
        />
        <Stat label="Views, all time" value={allTime._sum.count ?? 0} />
      </div>

      <Card title={`Daily views · last ${range} days`}>
        <ViewsChart days={days} />
      </Card>

      <Card title={`Where they came from · last ${range} days`}>
        <CountTable
          label="Source"
          rows={sources.map((s) => ({
            key: `source:${s.source}`,
            label: s.source || "direct",
            count: s._sum.count ?? 0,
          }))}
        />
      </Card>

      <p className="mt-8 text-xs text-neutral-500 dark:text-neutral-400">
        Counted in the visitor&apos;s browser and aggregated per day. No cookie, no IP address and no
        device fingerprint is stored — which is why there is no &ldquo;unique visitors&rdquo; number
        here, and why the page needs no consent banner.
      </p>
    </DashboardShell>
  );
}
