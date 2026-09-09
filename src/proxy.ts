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

export const config = {
  matcher: [
    // Everything except Next internals, the API, and static files. API routes
    // are excluded on purpose: /api/caddy/authorize is called with the
    // custom domain as a query param, not as the Host.
    "/((?!api/|_next/|favicon.ico|.*\..*).*)",
  ],
};
