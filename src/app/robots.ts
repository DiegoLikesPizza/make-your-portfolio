import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { appOrigin } from "@/lib/hosts";

/**
 * Crawlers may read every public page, but never the dashboard, the API, private
 * draft previews, exports or the sign-in flow.
 *
 * Also served on customers' domains — the proxy leaves paths with a dot alone —
 * where the same rules are the right ones.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  // Per request, so the sitemap URL comes from the running server's AUTH_URL
  // rather than whatever the build environment had.
  await connection();
  const origin = appOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/p/", "/export/", "/onboarding", "/signin"],
    },
    ...(origin && { sitemap: `${origin}/sitemap.xml` }),
  };
}
