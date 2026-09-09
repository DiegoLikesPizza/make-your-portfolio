"use client";

import { useEffect, useState } from "react";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { safeParseDoc } from "@/lib/schema/portfolio";
import { Portfolio } from "@/render/Portfolio";

/**
 * Renders the document the editor posts in.
 *
 * Messages are checked against the window origin and re-validated with the
 * schema: this frame renders whatever it is handed, so "it came from our own
 * editor" has to be verified rather than assumed.
 */
export function PreviewFrame({ initialDoc }: { initialDoc: PortfolioDoc }) {
  const [doc, setDoc] = useState(initialDoc);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "portfolio:doc") return;

      const parsed = safeParseDoc(e.data.doc);
      // An in-progress edit can be momentarily invalid (an empty required
      // field). Keep showing the last good document rather than blanking.
      if (parsed.success) setDoc(parsed.data);
    };

    window.addEventListener("message", onMessage);
    // Tell the editor we are listening; it replies with the current document.
    window.parent?.postMessage({ type: "portfolio:ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <Portfolio ctx={{ doc, assets: {}, preview: true }} />;
}
