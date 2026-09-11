"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import { safeParseDoc } from "@/lib/schema/portfolio";
import type { AssetMap } from "@/render/context";
import { Portfolio } from "@/render/Portfolio";
import { resolveDynamic } from "@/lib/dynamic";

/** Nothing to subscribe to: the server and client snapshots are the whole point. */
const subscribe = () => () => {};

/**
 * Renders the document the editor posts in.
 *
 * Messages are checked against the window origin and re-validated with the
 * schema: this frame renders whatever it is handed, so "it came from our own
 * editor" has to be verified rather than assumed.
 */
export function PreviewFrame({ initialDoc, initialAssets }: { initialDoc: PortfolioDoc; initialAssets: AssetMap }) {
  const [doc, setDoc] = useState(initialDoc);
  const [assets, setAssets] = useState(initialAssets);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== "portfolio:doc") return;

      const parsed = safeParseDoc(e.data.doc);
      // An in-progress edit can be momentarily invalid (an empty required
      // field). Keep showing the last good document rather than blanking.
      if (parsed.success) setDoc(parsed.data);

      // Uploads made since the frame loaded: the editor sends its whole map.
      if (e.data.assets && typeof e.data.assets === "object") setAssets(e.data.assets as AssetMap);
    };

    window.addEventListener("message", onMessage);
    // Tell the editor we are listening; it replies with the current document.
    window.parent?.postMessage({ type: "portfolio:ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Dynamic values read the clock, and the clock on the server that rendered
  // this frame is not the clock in the browser that hydrates it. Resolving only
  // once hydration is over keeps the first client render identical to the HTML.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const shown = hydrated ? resolveDynamic(doc) : doc;

  return <Portfolio ctx={{ doc: shown, assets, preview: true }} />;
}
