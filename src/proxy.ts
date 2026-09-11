import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/csp";
import { normalizeHost, resolveHost } from "@/lib/hosts";

/**
 * One app serves both the dashboard and every published portfolio; which one
 * you get depends entirely on the Host header.
 *
 * Published sites are one-pagers, so there is no per-site routing to do — every
 * site host rewrites to the single `/site/[host]` route, which re-resolves the
 * host with the same function and renders the site.
 *
 * Every page also gets its Content-Security-Policy here, because the policy
 * carries a nonce that must be new for each response (see src/lib/csp.ts). It
 * is set on the forwarded request, which is where Next reads the nonce from to
 * stamp its scripts, and on the response, which is what the browser enforces.
 */
export default function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");

  const headers = new Headers(request.headers);
  headers.set("Content-Security-Policy", policy);

  const response = route(request, headers);
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

/** The dashboard as-is, or a site host rewritten to its page. */
function route(request: NextRequest, headers: Headers) {
  const host = normalizeHost(request.headers.get("host") ?? "");

  if (resolveHost(host).kind === "app") return NextResponse.next({ request: { headers } });

  const url = new URL(`/site/${encodeURIComponent(host)}`, request.url);
  url.search = request.nextUrl.search;

  // Behind a TLS-terminating proxy the request URL's protocol comes from
  // X-Forwarded-Proto — `https` — while this process listens on plain HTTP.
  // A rewrite whose origin differs from the server's own is treated as an
  // *external* proxy, so Next tries to speak TLS to an HTTP port and the
  // request dies with EPROTO ("wrong version number") as a 500.
  //
  // The presence of the header is exactly the signal that something else
  // terminated TLS and is talking to us over an internal hop. Both shipped
  // front ends — the Caddyfile here and the nginx config on the deployed box —
  // proxy to 127.0.0.1 over plain HTTP, so that hop is http.
  if (url.protocol === "https:" && request.headers.get("x-forwarded-proto")) {
    url.protocol = "http:";
  }

  return NextResponse.rewrite(url, { request: { headers } });
}

// Everything except Next internals, the API, and paths that look like a file.
// API routes are excluded on purpose: /api/caddy/authorize is called with the
// custom domain as a query param, not as the Host.
//
// The backslash in `\\.` has to be doubled. Written `"\."`, JavaScript drops
// the backslash it doesn't recognise and the regex receives a bare `.`, so the
// last alternative became `.*..*` — "any two characters" — and the negative
// lookahead then rejected every path of two or more characters. The proxy only
// ever ran on `/`, which meant every other path on a customer's domain served
// the dashboard instead of their site.
//
// The literal stays inline: Next reads `config.matcher` by static analysis at
// build time and cannot follow a reference.
export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\..*).*)"],
};
