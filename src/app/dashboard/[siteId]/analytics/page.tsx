import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { Card, DashboardShell } from "@/components/dashboard/Shell";
import { ViewsChart, type DayCount } from "@/components/dashboard/ViewsChart";

export const metadata = { title: "Analytics" };

const WINDOW_DAYS = 30;

/** `YYYY-MM-DD` for a Date, read in UTC — the same bucket the rows are keyed by. */
function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Every day in the window, including the ones with no row.
 *
 * Charting only the days that have data is the classic way to draw a flat line
 * through a fortnight of silence: the gaps *are* the information.
 */
function fillDays(rows: { day: Date; count: number }[]): DayCount[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = isoDay(row.day);
    totals.set(key, (totals.get(key) ?? 0) + row.count);
  }

  const today = new Date();
  const days: DayCount[] = [];
  for (let back = WINDOW_DAYS - 1; back >= 0; back -= 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - back));
    const key = isoDay(date);
    days.push({ day: key, count: totals.get(key) ?? 0 });
  }
  return days;
}

export default async function AnalyticsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (WINDOW_DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const [recent, allTime, sources] = await Promise.all([
    db.siteView.findMany({
      where: { siteId, day: { gte: since } },
      select: { day: true, count: true },
    }),
    db.siteView.aggregate({ where: { siteId }, _sum: { count: true } }),
    db.siteView.groupBy({
      by: ["source"],
      where: { siteId, day: { gte: since } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 8,
    }),
  ]);

  const days = fillDays(recent);
  const windowTotal = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <DashboardShell siteId={siteId} current="analytics" title="Analytics">
      {!owned.site.publishedAt && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          This site isn&apos;t published, so nothing is being counted yet.{" "}
          <Link href={`/dashboard/${siteId}/edit`} className="underline underline-offset-2">
            Open the editor
          </Link>{" "}
          and press Publish.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Stat label={`Views, last ${WINDOW_DAYS} days`} value={windowTotal} />
        <Stat label="Views, all time" value={allTime._sum.count ?? 0} />
      </div>

      <Card title={`Daily views · last ${WINDOW_DAYS} days`}>
        <ViewsChart days={days} />
      </Card>

      <Card title={`Where they came from · last ${WINDOW_DAYS} days`}>
        {sources.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Nothing yet.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-neutral-500">
                <th className="pb-2 font-medium">Source</th>
                <th className="pb-2 text-right font-medium">Views</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source || "direct"} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="py-2 font-mono">{s.source || "direct"}</td>
                  <td className="py-2 text-right tabular-nums">{s._sum.count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p className="mt-8 text-xs text-neutral-500 dark:text-neutral-400">
        Counted in the visitor&apos;s browser and aggregated per day. No cookie, no IP address and no
        device fingerprint is stored — which is why there is no &ldquo;unique visitors&rdquo; number
        here, and why the page needs no consent banner.
      </p>
    </DashboardShell>
  );
}

/**
 * A single number, big.
 *
 * A two-point trend is a stat, not a chart — drawing it as one would imply a
 * shape that two numbers cannot have.
 */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">{label}</span>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value.toLocaleString()}</p>
    </div>
  );
}
