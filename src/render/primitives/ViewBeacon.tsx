"use client";

import { useEffect } from "react";

/**
 * Records one page view.
 *
 * Client-side rather than counted on the server because the public routes are
 * cached — the whole point of `unstable_cache` there is that most requests
 * never reach our code — so a server-side counter would only see cache misses.
 *
 * What leaves the browser is the site id and the referring hostname. No cookie,
 * no fingerprint, no IP kept: /api/hit adds one to a per-day counter and
 * forgets the request. That is also why this needs no consent banner.
 */

// StrictMode runs effects twice in development, and a soft navigation back to
// the same page would count again. One entry per page load is the intent.
const counted = new Set<string>();

export function ViewBeacon({ siteId }: { siteId: string }) {
  useEffect(() => {
    const key = `${siteId}:${window.location.pathname}`;
    if (counted.has(key)) return;
    counted.add(key);

    let source = "";
    try {
      const referrer = new URL(document.referrer);
      // Our own pages aren't a source; only somewhere else linking in is.
      if (referrer.host !== window.location.host) source = referrer.host.slice(0, 120);
    } catch {
      // No referrer, or one that isn't a URL — a direct visit.
    }

    const body = JSON.stringify({ siteId, source });
    const blob = new Blob([body], { type: "application/json" });

    if (!navigator.sendBeacon?.("/api/hit", blob)) {
      // sendBeacon returns false when the payload is refused, and is missing
      // entirely in a few browsers. keepalive so a click-through doesn't cancel
      // the request mid-flight.
      void fetch("/api/hit", {
        method: "POST",
        body,
        headers: { "content-type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [siteId]);

  return null;
}
