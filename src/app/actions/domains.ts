"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { normalizeHost, APP_DOMAIN } from "@/lib/hosts";
import { checkDomain } from "@/lib/dns";
import { isStaleClaim } from "@/lib/domain-claims";
import { revalidateHost } from "@/lib/sites";
import { issueCertificate } from "@/lib/certs";

export type DomainState = { error?: string; ok?: string };

const SERVER_IP = process.env.SERVER_IP;

/** Basic shape check — the DNS lookup is the real verification. */
function looksLikeHostname(host: string) {
  return /^(?!-)[a-z0-9-]{1,63}(\.(?!-)[a-z0-9-]{1,63})+$/.test(host) && !host.endsWith(".");
}

export async function addDomain(siteId: string, _prev: DomainState, formData: FormData): Promise<DomainState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  const hostname = normalizeHost(String(formData.get("hostname") ?? ""));

  if (!looksLikeHostname(hostname)) return { error: "That doesn't look like a domain name." };
  if (hostname === APP_DOMAIN || hostname.endsWith(`.${APP_DOMAIN}`)) {
    return { error: "That domain belongs to this app." };
  }

  const existing = await db.domain.findUnique({ where: { hostname } });
  if (existing) {
    // Re-adding would mint a new token and invalidate a TXT record the owner
    // may already have created.
    if (existing.siteId === siteId) return { error: "That domain is already on this site." };
    if (!isStaleClaim(existing)) return { error: "That domain is already connected to a site." };

    // Nobody proved they own it in time, so it no longer reserves the name.
    await db.domain.delete({ where: { id: existing.id } });
  }

  await db.domain.create({
    data: { siteId, hostname, verifyToken: randomBytes(16).toString("hex") },
  });

  // A miss for this hostname may already be cached — from Caddy's TLS probe, or
  // from the owner checking whether it works yet. Clearing it here means the
  // domain starts responding the moment it is verified rather than never.
  await revalidateHost(hostname);
  revalidatePath(`/dashboard/${siteId}/domains`);
  return { ok: "Added. Create the DNS records below, then verify." };
}

export async function verifyDomain(siteId: string, domainId: string): Promise<DomainState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  const domain = await db.domain.findFirst({ where: { id: domainId, siteId } });
  if (!domain) return { error: "Not found." };

  const result = await checkDomain(domain.hostname, domain.verifyToken, SERVER_IP);

  const now = new Date();
  await db.domain.update({
    where: { id: domain.id },
    // A manual check is the owner asking "does it work now?", so it answers at
    // once. It's the daily re-check that waits for a second failure.
    data: { verified: result.ok, lastCheckedAt: now, failedChecks: 0, ...(result.ok && { verifiedAt: now }) },
  });

  await revalidateHost(domain.hostname);
  revalidatePath(`/dashboard/${siteId}/domains`);

  if (result.ok) {
    // Kicked off after the row is verified, never before: issuance is gated on
    // verification, and asking Let's Encrypt for a name we haven't confirmed is
    // how an ACME rate limit gets burned.
    issueCertificate(domain.hostname);
    return { ok: "Verified. The certificate is being issued now — give it a minute, then reload." };
  }
  return {
    error: `${result.reason}${result.found.length ? ` Found: ${result.found.join(", ")}.` : ""} DNS can take a few minutes.`,
  };
}

export async function removeDomain(siteId: string, domainId: string): Promise<DomainState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  // Read the hostname before deleting it: after the delete there is nothing
  // left to tell us which cache entry to drop, and a stale entry would keep
  // serving the site on a domain the owner just disconnected.
  const domain = await db.domain.findFirst({ where: { id: domainId, siteId } });
  await db.domain.deleteMany({ where: { id: domainId, siteId } });
  if (domain) await revalidateHost(domain.hostname);
  revalidatePath(`/dashboard/${siteId}/domains`);
  return { ok: "Removed." };
}
