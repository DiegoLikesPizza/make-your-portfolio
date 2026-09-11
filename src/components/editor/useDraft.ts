"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { AssetMap } from "@/render/context";

export type SaveState = "idle" | "saving" | "saved" | "conflict" | "error";

/**
 * Draft state, autosave, and the preview channel.
 *
 * Two different debounces on purpose: the preview updates almost immediately so
 * typing feels live, while the server write waits long enough that a sentence
 * is one request rather than forty.
 */
const PREVIEW_MS = 150;
const SAVE_MS = 800;

export function useDraft(siteId: string, initialDoc: PortfolioDoc, initialUpdatedAt: string, assets: AssetMap) {
  const [doc, setDoc] = useState(initialDoc);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const updatedAt = useRef(initialUpdatedAt);
  const previewFrame = useRef<HTMLIFrameElement | null>(null);
  const dirty = useRef(false);

  /** Push the current document, and the uploads it may use, into the preview iframe. */
  const pushPreview = useCallback(
    (next: PortfolioDoc) => {
      previewFrame.current?.contentWindow?.postMessage({ type: "portfolio:doc", doc: next, assets }, window.location.origin);
    },
    [assets],
  );

  const save = useCallback(
    async (next: PortfolioDoc) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/sites/${siteId}/draft`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doc: next, baseUpdatedAt: updatedAt.current }),
        });

        if (res.status === 409) {
          // Another tab (or window) saved in between. Stop autosaving rather
          // than overwrite work that is not on screen here.
          setSaveState("conflict");
          return;
        }
        if (!res.ok) {
          setSaveState("error");
          return;
        }

        const json = (await res.json()) as { updatedAt: string };
        updatedAt.current = json.updatedAt;
        dirty.current = false;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [siteId],
  );

  // Debounced autosave. Re-runs whenever the document changes.
  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => void save(doc), SAVE_MS);
    return () => clearTimeout(t);
  }, [doc, save]);

  // Debounced preview push, on a document change or a new upload.
  useEffect(() => {
    const t = setTimeout(() => pushPreview(doc), PREVIEW_MS);
    return () => clearTimeout(t);
  }, [doc, pushPreview]);

  // Warn before losing an unsaved change on a hard navigation.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const update = useCallback((next: PortfolioDoc) => {
    dirty.current = true;
    setSaveState("idle");
    setDoc(next);
  }, []);

  /** The iframe asks for the document once it has mounted its listener. */
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "portfolio:ready") pushPreview(doc);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [doc, pushPreview]);

  return { doc, update, saveState, previewFrame, saveNow: () => save(doc) };
}
