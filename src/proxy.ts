import { NextResponse, type NextRequest } from "next/server";
import { normalizeHost, resolveHost } from "@/lib/hosts";

/**
 * One app serves both the dashboard and every published portfolio; which one
 * you get depends entirely on the Host header.
 *
 * Published sites are one-pagers, so there is no per-site routing to do — every
 * site host rewrites to the single `/site/[host]` route, which re-resolves the
 * host with the same function and renders the site.
 */
export default function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host") ?? "");

  if (resolveHost(host).kind === "app") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/site/${encodeURIComponent(host)}`;
  return NextResponse.rewrite(url);
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
