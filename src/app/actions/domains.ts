"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSiteOwner } from "@/lib/auth";
import { normalizeHost, APP_DOMAIN } from "@/lib/hosts";
import { checkDomain } from "@/lib/dns";

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

  const taken = await db.domain.findUnique({ where: { hostname } });
  if (taken) return { error: "That domain is already connected to a site." };

  await db.domain.create({
    data: { siteId, hostname, verifyToken: randomBytes(16).toString("hex") },
  });

  revalidatePath(`/dashboard/${siteId}/domains`);
  return { ok: "Added. Create the DNS record below, then verify." };
}

export async function verifyDomain(siteId: string, domainId: string): Promise<DomainState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  const domain = await db.domain.findFirst({ where: { id: domainId, siteId } });
  if (!domain) return { error: "Not found." };

  const result = await checkDomain(domain.hostname, SERVER_IP);

  await db.domain.update({
    where: { id: domain.id },
    data: { verified: result.ok, lastCheckedAt: new Date() },
  });

  revalidatePath(`/dashboard/${siteId}/domains`);

  if (result.ok) return { ok: "Verified. HTTPS is issued automatically on the first visit." };
  return {
    error: `${result.reason}${result.found.length ? ` Found: ${result.found.join(", ")}.` : ""} DNS can take a few minutes.`,
  };
}

export async function removeDomain(siteId: string, domainId: string): Promise<DomainState> {
  const owned = await requireSiteOwner(siteId);
  if (!owned) return { error: "Not found." };

  await db.domain.deleteMany({ where: { id: domainId, siteId } });
  revalidatePath(`/dashboard/${siteId}/domains`);
  return { ok: "Removed." };
}
