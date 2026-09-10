import { permanentRedirect } from "next/navigation";

/**
 * The old standalone Domains page.
 *
 * Kept as a redirect rather than deleted: the editor linked here, and so did
 * anything anyone bookmarked. Domains are now one card on Settings.
 */
export default async function DomainsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  permanentRedirect(`/dashboard/${siteId}/settings#domains`);
}
