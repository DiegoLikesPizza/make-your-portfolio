import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { APP_DOMAIN } from "@/lib/hosts";
import { requiredRecord } from "@/lib/dns";
import { DomainManager } from "./DomainManager";

export const metadata = { title: "Domains" };

export default async function DomainsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  const domains = await db.domain.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const serverIp = process.env.SERVER_IP;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href={`/dashboard/${siteId}/edit`} className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
        ← Back to editor
      </Link>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Domains</h1>

      <section className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">Always available</h2>
        <p className="mt-2 font-mono text-sm text-neutral-900 dark:text-white">
          {APP_DOMAIN}/u/{owned.site.subdomain}
        </p>
      </section>

      <DomainManager
        siteId={siteId}
        serverIp={serverIp}
        domains={domains.map((d) => ({
          id: d.id,
          hostname: d.hostname,
          verified: d.verified,
          lastCheckedAt: d.lastCheckedAt?.toISOString() ?? null,
          record: requiredRecord(d.hostname, serverIp),
        }))}
      />
    </main>
  );
}
