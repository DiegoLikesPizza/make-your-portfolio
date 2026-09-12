import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireSiteOwner } from "@/lib/auth";
import { APP_DOMAIN } from "@/lib/hosts";
import { ownershipRecord, requiredRecord } from "@/lib/dns";
import { documentsUseAsset, resolveAsset } from "@/lib/assets";
import { Card, DashboardShell } from "@/components/dashboard/Shell";
import { DomainManager } from "./DomainManager";
import { DeleteSiteForm, HandleForm, PreviewLink, PublishState, UploadsManager, VersionHistory } from "./SiteForms";

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

  const [domains, versions, uploads] = await Promise.all([
    db.domain.findMany({ where: { siteId }, orderBy: { createdAt: "asc" } }),
    db.siteVersion.findMany({
      where: { siteId },
      orderBy: { publishedAt: "desc" },
      select: { id: true, publishedAt: true, doc: true },
    }),
    db.asset.findMany({ where: { siteId }, orderBy: { createdAt: "desc" } }),
  ]);
  const serverIp = process.env.SERVER_IP;

  // Everything that can still point at an upload: the draft, the live page and every saved version.
  const documents = [owned.site.draftDoc, owned.site.publishedDoc, ...versions.map((v) => v.doc)];

  return (
    <DashboardShell siteId={siteId} current="settings" title="Settings">
      <Card title="Handle" hint="The URL your site always has, whatever else points at it.">
        <HandleForm siteId={siteId} subdomain={owned.site.subdomain} appDomain={APP_DOMAIN} />
      </Card>

      <Card title="Published">
        <PublishState siteId={siteId} publishedAt={owned.site.publishedAt?.toISOString() ?? null} />
      </Card>

      <Card
        title="Preview link"
        hint="Share the draft before you publish. Anyone with the link can see it; it isn't indexed or counted in analytics."
      >
        <PreviewLink siteId={siteId} token={owned.site.previewToken} />
      </Card>

      <Card
        title="Published versions"
        hint="Every publish is kept, newest 20. Open one in the editor, or put it live again."
      >
        <VersionHistory
          siteId={siteId}
          versions={versions.map((v) => ({ id: v.id, publishedAt: v.publishedAt.toISOString() }))}
          livePublishedAt={owned.site.publishedAt?.toISOString() ?? null}
        />
      </Card>

      <Card
        title="Download as HTML"
        hint="The published page as one file, with its styles, fonts, images and videos inside, that opens offline and can be hosted anywhere. It has no scripts: no animations, theme toggle or view counting, and the contact form opens the visitor's email app."
      >
        {owned.site.publishedAt ? (
          <a
            href={`/api/sites/${siteId}/export`}
            className="mt-3 inline-block rounded-lg bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Download portfolio-{owned.site.subdomain}.html
          </a>
        ) : (
          <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
            Publish the site first. The export is the live page.
          </p>
        )}
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
            verifiedAt: d.verifiedAt?.toISOString() ?? null,
            failedChecks: d.failedChecks,
            records: [ownershipRecord(d.hostname, d.verifyToken), requiredRecord(d.hostname, serverIp)],
          }))}
        />
      </Card>

      <Card
        title="Uploads"
        hint="Images and GIFs uploaded in the editor. One that your draft, the live page or a saved version still uses can't be deleted."
      >
        <UploadsManager
          siteId={siteId}
          uploads={uploads.map((asset) => ({
            id: asset.id,
            src: resolveAsset(asset).src,
            bytes: asset.bytes,
            inUse: documentsUseAsset(documents, asset.id),
          }))}
        />
      </Card>

      <Card
        title="Delete site"
        tone="danger"
        hint="Removes the site, its draft, every connected domain, every upload and every view it has recorded. Your account stays."
      >
        <DeleteSiteForm siteId={siteId} subdomain={owned.site.subdomain} />
      </Card>
    </DashboardShell>
  );
}
