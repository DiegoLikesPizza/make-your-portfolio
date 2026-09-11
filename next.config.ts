import type { NextConfig } from "next";

/**
 * Read when the config is evaluated — at build and at server start — so a build
 * made for one domain sends HSTS for that domain.
 */
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "example.localhost";

/**
 * Sent on every response, dashboard and portfolios alike: they share an origin
 * whenever a site is viewed at /u/<handle>.
 *
 * `frame-ancestors 'self'` rather than `'none'`, because the editor renders its
 * preview in a same-origin iframe. Any other site framing a page is refused,
 * which is what stops one-click actions like *Take offline* being clickjacked.
 *
 * There is deliberately no `script-src`. One worth having needs a nonce per
 * request, and Next can only attach nonces while rendering dynamically — every
 * page, the prerendered /d/<preset> demos included. That is a change to how the
 * app renders, not a header.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  // For browsers that predate frame-ancestors.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Links out still tell the destination which site sent the visitor, never the path.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Required by the Dockerfile's runtime stage.
  output: "standalone",

  // Dev only: Next blocks cross-origin requests to its HMR endpoints unless the
  // origin is listed, which breaks hot reload when testing from another device
  // on the LAN (a phone). Private ranges only — this never applies in a build.
  allowedDevOrigins: ["192.168.178.69", "192.168.178.*", "10.*", "172.16.*"],

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // HSTS on the app's own domain only. A customer's domain is served here
        // only while it points here, and pinning visitors' browsers to HTTPS for
        // a name we may not answer for next year is not ours to decide.
        source: "/:path*",
        has: [{ type: "host", value: APP_DOMAIN.replace(/\./g, "\\.") }],
        headers: [{ key: "Strict-Transport-Security", value: "max-age=31536000" }],
      },
    ];
  },
};

export default nextConfig;
