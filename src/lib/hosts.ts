/**
 * Host parsing, shared by the proxy and the public renderer.
 *
 * Two ways to reach a published site:
 *   example.com/u/diego → path, always available
 *   diego.dev           → verified custom domain
 *
 * Subdomain hosting (diego.example.com) is off by default. It needs a wildcard
 * certificate, which needs a DNS-01 challenge and a provider API token — real
 * setup cost for something the product does not currently promise. The code
 * path is kept and gated behind SITES_ON_SUBDOMAINS so turning it on later is
 * one environment variable rather than a rewrite.
 */

/** The root domain, e.g. "example.localhost" in dev. */
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "example.localhost";

/** Subdomains that address the product itself, never a user's site. */
const APP_HOSTS = new Set(["app", "www"]);

/** Off unless a wildcard certificate is actually in place. */
export const SITES_ON_SUBDOMAINS = process.env.NEXT_PUBLIC_SITES_ON_SUBDOMAINS === "true";

export type HostTarget =
  /** The dashboard / marketing app. */
  | { kind: "app" }
  /** A published site addressed by its subdomain. */
  | { kind: "subdomain"; subdomain: string }
  /** A published site addressed by a custom hostname. */
  | { kind: "custom"; hostname: string };

/**
 * Strip the port and normalise case. `Host` headers are not trustworthy input.
 *
 * IPv6 arrives bracketed (`[::1]:3100`), so splitting on the first colon would
 * mangle it — the brackets are stripped and the port removed separately.
 */
export function normalizeHost(host: string): string {
  const trimmed = host.trim().toLowerCase();
  const bracketed = trimmed.match(/^\[(.+)\](?::\d+)?$/);
  if (bracketed) return bracketed[1];
  return trimmed.split(":")[0];
}

/** IPv4 dotted-quad, or an IPv6 literal (which arrives bracket-stripped). */
function isIpLiteral(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":") || /^\[.*\]$/.test(host);
}

export function resolveHost(rawHost: string): HostTarget {
  const host = normalizeHost(rawHost);

  if (host === APP_DOMAIN) return { kind: "app" };

  if (host.endsWith(`.${APP_DOMAIN}`)) {
    if (!SITES_ON_SUBDOMAINS) return { kind: "app" };

    const label = host.slice(0, -(APP_DOMAIN.length + 1));
    // Only a single label is a site; anything deeper is not ours to serve.
    if (label.includes(".")) return { kind: "app" };
    return APP_HOSTS.has(label)
      ? { kind: "app" }
      : { kind: "subdomain", subdomain: label };
  }

  // A bare IP address is never a customer's custom domain — nobody points an
  // A record at a literal. It is how the app gets reached in development (over
  // the LAN from a phone, say), so it resolves to the app.
  if (isIpLiteral(host) || host === "localhost" || host.endsWith(".localhost")) {
    return { kind: "app" };
  }

  return { kind: "custom", hostname: host };
}
