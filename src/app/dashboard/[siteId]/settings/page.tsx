import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { APP_DOMAIN } from "@/lib/hosts";
import { ownershipRecord, requiredRecord } from "@/lib/dns";
import { Card, DashboardShell } from "@/components/dashboard/Shell";
import { DomainManager } from "./DomainManager";
import { DeleteSiteForm, HandleForm, PublishState } from "./SiteForms";

export const metadata = { title: "Settings" };

/**
 * Everything about the site that isn't its content.
 *
 * This replaces the standalone Domains page. Domains were never a subject of
 * their own — they are one of several answers to "where does this site live",
 * and splitting them out meant the handle, the publish state and the custom
 * hostname were each edited somewhere different.
 */
export default async function SettingsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const owned = await requireSiteOwner(siteId);
  if (!owned) notFound();

  const domains = await db.domain.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } });
  const serverIp = process.env.SERVER_IP;

  return (
    <DashboardShell siteId={siteId} current="settings" title="Settings">
      <Card title="Handle" hint="The URL your site always has, whatever else points at it.">
        <HandleForm siteId={siteId} subdomain={owned.site.subdomain} appDomain={APP_DOMAIN} />
      </Card>

      <Card title="Published">
        <PublishState siteId={siteId} publishedAt={owned.site.publishedAt?.toISOString() ?? null} />
      </Card>

      <Card
        id="domains"
        title="Your own domain"
        hint="Point a domain you own at this site. HTTPS is issued automatically once the DNS record verifies."
      >
        <DomainManager
          siteId={siteId}
          serverIp={serverIp}
          domains={domains.map((d) => ({
            id: d.id,
            hostname: d.hostname,
            verified: d.verified,
            lastCheckedAt: d.lastCheckedAt?.toISOString() ?? null,
            records: [ownershipRecord(d.hostname, d.verifyToken), requiredRecord(d.hostname, serverIp)],
          }))}
        />
      </Card>

      <Card
        title="Delete site"
        tone="danger"
        hint="Removes the site, its draft, every connected domain and every view it has recorded. Your account stays."
      >
        <DeleteSiteForm siteId={siteId} subdomain={owned.site.subdomain} />
      </Card>
    </DashboardShell>
  );
}
