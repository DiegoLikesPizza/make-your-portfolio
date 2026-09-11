import { promises as dns } from "node:dns";
import { APP_DOMAIN } from "@/lib/hosts";

/**
 * Checking that a customer's domain actually points at us — and that it is
 * actually theirs.
 *
 * Verification gates certificate issuance, so this has to be a real lookup
 * rather than a trust-the-user checkbox — and it has to check where the name
 * *resolves*, not what shape of record it has.
 *
 * The distinction is not academic. This used to accept any `CNAME` whose target
 * string was APP_DOMAIN. Put a CDN in front of APP_DOMAIN — as the deployed box
 * does — and that CNAME resolves to the CDN, which has never heard of the
 * customer's hostname, so the domain goes green in the dashboard and serves an
 * error to the world. A check that can pass while the thing it checks is broken
 * is worse than no check.
 *
 * Resolving here is still not ownership. Every customer's domain points at the
 * same address, so "this name reaches the platform" says nothing about *which*
 * account may serve it: a domain whose owner removed it, or pointed it here
 * before adding it, could be claimed by anyone. The TXT record carries the
 * per-domain token, and only the person who controls the zone can publish it.
 */

export type DnsCheck = { ok: true } | { ok: false; found: string[]; reason: string };

export type DnsRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string };

/** The label the ownership TXT record lives under, in front of the hostname. */
const OWNERSHIP_LABEL = "_portfolio-verify";

const UNKNOWN_SERVER: DnsCheck = {
  ok: false,
  found: [],
  reason: "This server doesn't know its own address — set SERVER_IP.",
};

/** An apex domain (`diego.dev`) cannot use CNAME, so it needs an A record. */
export function isApex(hostname: string): boolean {
  return hostname.split(".").length === 2;
}

/** A record name as a registrar's panel wants it: relative to the zone. */
function relativeName(hostname: string, label?: string): string {
  const host = isApex(hostname) ? "" : hostname.split(".")[0];
  return [label, host].filter(Boolean).join(".") || "@";
}

/**
 * The addresses this app answers on.
 *
 * SERVER_IP is authoritative. Without it the app can still find itself —
 * whatever APP_DOMAIN resolves to is where visitors reach us — but that answer
 * is only right when nothing is proxying APP_DOMAIN.
 */
export async function serverAddresses(serverIp?: string): Promise<string[]> {
  if (serverIp) return [serverIp];
  return dns.resolve4(APP_DOMAIN).catch(() => [] as string[]);
}

/**
 * What the user should create, in words the DNS panel uses.
 *
 * An A record for every kind of name, not just apex, whenever we know our own
 * address: a CNAME to APP_DOMAIN only reaches us if APP_DOMAIN itself resolves
 * to this server, and that is a property of someone else's DNS settings which
 * can change without warning.
 */
export function requiredRecord(hostname: string, serverIp: string | undefined): DnsRecord {
  const name = relativeName(hostname);

  if (serverIp) return { type: "A", name, value: serverIp };
  if (isApex(hostname)) return { type: "A", name, value: "your server's IP address" };
  return { type: "CNAME", name, value: APP_DOMAIN };
}

/** The TXT record that proves the person adding `hostname` controls its zone. */
export function ownershipRecord(hostname: string, token: string): DnsRecord {
  return { type: "TXT", name: relativeName(hostname, OWNERSHIP_LABEL), value: `portfolio-verify=${token}` };
}

/**
 * Does any TXT answer carry the token?
 *
 * Resolvers hand each TXT record back as an array of chunks — a value longer
 * than 255 bytes is split — so the chunks are one value and must be joined
 * before comparing.
 */
export function hasOwnershipToken(records: string[][], token: string): boolean {
  const expected = `portfolio-verify=${token}`;
  return records.some((chunks) => chunks.join("") === expected);
}

/** Full verification: the zone is the user's, and the name reaches this server. */
export async function checkDomain(hostname: string, token: string, serverIp?: string): Promise<DnsCheck> {
  try {
    const ours = await serverAddresses(serverIp);
    if (ours.length === 0) return UNKNOWN_SERVER;

    // Ownership first: pointing at us is necessary, but it is the TXT token
    // that says this account is the one allowed to serve the name.
    const txt = await dns.resolveTxt(`${OWNERSHIP_LABEL}.${hostname}`).catch(() => [] as string[][]);
    if (!hasOwnershipToken(txt, token)) {
      return {
        ok: false,
        found: txt.map((chunks) => chunks.join("")),
        reason: "The TXT record that proves you own this domain is missing or doesn't match.",
      };
    }

    return await pointsHere(hostname, ours);
  } catch (error) {
    return { ok: false, found: [], reason: (error as Error).message };
  }
}

/**
 * Does `hostname` still reach this server? The daily re-check's question —
 * ownership was already proven when the domain verified.
 */
export async function checkPointsHere(hostname: string, serverIp?: string): Promise<DnsCheck> {
  try {
    const ours = await serverAddresses(serverIp);
    if (ours.length === 0) return UNKNOWN_SERVER;
    return await pointsHere(hostname, ours);
  } catch (error) {
    return { ok: false, found: [], reason: (error as Error).message };
  }
}

async function pointsHere(hostname: string, ours: string[]): Promise<DnsCheck> {
  // Resolvers follow CNAMEs, so this one lookup covers both record shapes and
  // is the only question that matters: does traffic for this name arrive here?
  const addresses = await dns.resolve4(hostname).catch(() => [] as string[]);
  if (addresses.some((address) => ours.includes(address))) return { ok: true };

  const cname = (await dns.resolveCname(hostname).catch(() => [] as string[]))
    .map((c) => c.replace(/\.$/, "").toLowerCase());

  if (addresses.length === 0 && cname.length === 0) {
    return { ok: false, found: [], reason: "Nothing resolves for this name yet." };
  }

  // Name the specific trap rather than saying "points elsewhere": this one
  // looks correct to the person who set it up, and the record they were told
  // to create is the one that produced it.
  if (cname.includes(APP_DOMAIN)) {
    return {
      ok: false,
      found: [...cname, ...addresses],
      reason:
        `This is a CNAME to ${APP_DOMAIN}, but that name doesn't resolve to this server ` +
        `— it's behind a proxy or CDN. Use the A record shown above instead.`,
    };
  }

  return { ok: false, found: [...cname, ...addresses], reason: "Points somewhere that isn't this server." };
}
