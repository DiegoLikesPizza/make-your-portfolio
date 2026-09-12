import { requireSiteOwner } from "@/lib/auth";
import { exportFileName, inlineExport } from "@/lib/export";

/**
 * Download the published portfolio as one self-contained HTML file.
 *
 * The page is rendered by the app itself — `/export/<siteId>`, fetched over
 * loopback with the owner's cookie — rather than with react-dom/server here.
 * A portfolio is server and client components with next/font stylesheets, and
 * only the real route produces exactly what the live page is.
 *
 * Loopback is always 127.0.0.1: nothing in the request chooses the host. And
 * only this app's own static files and uploads are ever fetched for embedding.
 */

const TIMEOUT_MS = 30_000;

/** Where this server listens. `next dev -p` doesn't set PORT, so development reads it off the request. */
function loopback(request: Request): string {
  const port = process.env.PORT || (process.env.NODE_ENV === "development" ? new URL(request.url).port : "");
  return `http://127.0.0.1:${port || 3000}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;

  const owned = await requireSiteOwner(siteId);
  if (!owned) return Response.json({ error: "Not found" }, { status: 404 });
  if (!owned.site.publishedDoc) return Response.json({ error: "Publish the site first." }, { status: 409 });

  const base = loopback(request);
  const page = await fetch(`${base}/export/${siteId}`, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  }).catch(() => null);
  if (!page?.ok) return Response.json({ error: "The page couldn't be rendered for export." }, { status: 502 });

  const result = await inlineExport(await page.text(), async (path) => {
    if (!path.startsWith("/_next/static/") && !path.startsWith("/assets/")) return null;
    const response = await fetch(`${base}${path}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null);
    if (!response?.ok) return null;
    return {
      body: new Uint8Array(await response.arrayBuffer()),
      type: response.headers.get("content-type") ?? "application/octet-stream",
    };
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: 413 });

  return new Response(result.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(owned.site.subdomain)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
