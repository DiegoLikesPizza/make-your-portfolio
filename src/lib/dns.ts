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

/**
 * The addresses this app answers on.
 *
 * SERVER_IP is authoritative when it's set. When it isn't, the app can still
 * find itself: whatever APP_DOMAIN resolves to is by definition where visitors
 * reach us, so an apex domain pointing at the same address is pointing at us.
 * Without this an apex domain could never verify on a deployment that hadn't
 * set SERVER_IP — the check had no address to compare against at all.
 */
async function serverAddresses(serverIp?: string): Promise<string[]> {
  if (serverIp) return [serverIp];
  return dns.resolve4(APP_DOMAIN).catch(() => [] as string[]);
}

export async function checkDomain(hostname: string, serverIp?: string): Promise<DnsCheck> {
  const wanted = requiredRecord(hostname, serverIp);

  try {
    const ours = await serverAddresses(serverIp);

    if (wanted.type === "CNAME") {
      const found = await dns.resolveCname(hostname).catch(() => [] as string[]);
      const normalized = found.map((f) => f.replace(/\.$/, "").toLowerCase());
      if (normalized.includes(APP_DOMAIN)) return { ok: true };

      // A CNAME flattened by the DNS provider (Cloudflare does this) resolves
      // to our address instead, which is equally valid.
      const a = await dns.resolve4(hostname).catch(() => [] as string[]);
      if (a.some((address) => ours.includes(address))) return { ok: true };

      if (normalized.length === 0 && a.length === 0) {
        return { ok: false, found: [], reason: "Nothing resolves for this name yet." };
      }
      return { ok: false, found: [...normalized, ...a], reason: "Points elsewhere." };
    }

    const a = await dns.resolve4(hostname).catch(() => [] as string[]);
    if (a.some((address) => ours.includes(address))) return { ok: true };
    if (ours.length === 0) {
      return {
        ok: false,
        found: a,
        reason: "This server doesn't know its own address — set SERVER_IP.",
      };
    }
    return { ok: false, found: a, reason: a.length ? "Points to a different address." : "No A record found." };
  } catch (error) {
    return { ok: false, found: [], reason: (error as Error).message };
  }
}
