import { promises as dns } from "node:dns";
import { APP_DOMAIN } from "@/lib/hosts";

/**
 * Checking that a customer's domain actually points at us.
 *
 * Verification is what gates certificate issuance, so this has to be a real
 * lookup rather than a trust-the-user checkbox.
 */

export type DnsCheck = { ok: true } | { ok: false; found: string[]; reason: string };

/** An apex domain (`diego.dev`) cannot use CNAME, so it needs an A record. */
export function isApex(hostname: string): boolean {
  return hostname.split(".").length === 2;
}

/** What the user should create, in words the DNS panel uses. */
export function requiredRecord(hostname: string, serverIp: string | undefined) {
  return isApex(hostname)
    ? { type: "A" as const, name: "@", value: serverIp ?? "your server's IP address" }
    : { type: "CNAME" as const, name: hostname.split(".")[0], value: APP_DOMAIN };
}

export async function checkDomain(hostname: string, serverIp?: string): Promise<DnsCheck> {
  const wanted = requiredRecord(hostname, serverIp);

  try {
    if (wanted.type === "CNAME") {
      const found = await dns.resolveCname(hostname).catch(() => [] as string[]);
      const normalized = found.map((f) => f.replace(/\.$/, "").toLowerCase());
      if (normalized.includes(APP_DOMAIN)) return { ok: true };

      // A CNAME flattened by the DNS provider (Cloudflare does this) resolves
      // to our address instead, which is equally valid.
      if (serverIp) {
        const a = await dns.resolve4(hostname).catch(() => [] as string[]);
        if (a.includes(serverIp)) return { ok: true };
        return { ok: false, found: [...normalized, ...a], reason: `Points elsewhere.` };
      }
      return { ok: false, found: normalized, reason: "No CNAME to this app was found." };
    }

    const a = await dns.resolve4(hostname).catch(() => [] as string[]);
    if (serverIp && a.includes(serverIp)) return { ok: true };
    return { ok: false, found: a, reason: a.length ? "Points to a different address." : "No A record found." };
  } catch (error) {
    return { ok: false, found: [], reason: (error as Error).message };
  }
}
