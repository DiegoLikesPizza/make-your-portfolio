import { db } from "@/lib/db";
import { normalizeHost, APP_DOMAIN } from "@/lib/hosts";

/**
 * Caddy's on-demand TLS gate.
 *
 * Caddy calls this before issuing a certificate for a hostname it has never
 * seen. Answering 200 for anything would let anyone point DNS at this server
 * and burn the ACME rate limit, so only hostnames we have verified get through.
 *
 * This must not be reachable from the public internet — the Caddyfile calls it
 * on 127.0.0.1 and the app binds to loopback only.
 */
export async function GET(request: Request) {
  const domain = new URL(request.url).searchParams.get("domain");
  if (!domain) return new Response("missing domain", { status: 400 });

  const host = normalizeHost(domain);

  // Our own hostname is issued through the normal challenge, not on demand.
  if (host === APP_DOMAIN) return new Response("ok", { status: 200 });

  const verified = await db.domain.findFirst({
    where: { hostname: host, verified: true },
    select: { id: true },
  });

  // 404 rather than 403: Caddy treats any non-2xx as "do not issue", and this
  // reveals nothing about which hostnames exist.
  return verified ? new Response("ok", { status: 200 }) : new Response("unknown host", { status: 404 });
}
