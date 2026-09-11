"use client";

import { useCallback, useMemo, useState } from "react";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { Section } from "@/lib/schema/sections";
import type { AssetMap, ResolvedAsset } from "@/render/context";
import { useDraft, type SaveState } from "./useDraft";
import { EditorAssetsContext } from "./assets-context";
import { SectionList } from "./SectionList";
import { SectionForm } from "./SectionForm";
import { ProfileForm } from "./ProfileForm";
import { OptionsPanel } from "./OptionsPanel";
import { DesignPanel } from "./DesignPanel";
import { BackgroundEditor } from "./BackgroundEditor";
import { TextInput } from "./fields";

type Tab = "content" | "design";
type Device = "desktop" | "tablet" | "phone";

const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", tablet: "820px", phone: "390px" };

/**
 * The editor: sections on the left, the selected thing in the middle, the real
 * page on the right.
 *
 * The preview renders through the same components as the published site, so
 * "what you see is what publishes" is structural rather than a promise.
 */
export function EditorApp({
  siteId, subdomain, initialDoc, initialUpdatedAt, initialAssets, publishedAt, signOutSlot,
}: {
  siteId: string;
  subdomain: string;
  initialDoc: PortfolioDoc;
  initialUpdatedAt: string;
  /** The site's uploads when the editor opened; uploads made here are added to it. */
  initialAssets: AssetMap;
  publishedAt: string | null;
  /** Rendered on the server: sign-out is a server action, not a link. */
  signOutSlot?: React.ReactNode;
}) {
  const [assets, setAssets] = useState(initialAssets);
  const addAsset = useCallback((id: string, asset: ResolvedAsset) => setAssets((current) => ({ ...current, [id]: asset })), []);
  const editorAssets = useMemo(() => ({ siteId, assets, addAsset }), [siteId, assets, addAsset]);

  const { doc, update, saveState, previewFrame, saveNow } = useDraft(siteId, initialDoc, initialUpdatedAt, assets);
  const [tab, setTab] = useState<Tab>("content");
  const [selected, setSelected] = useState<string>("profile");
  const [device, setDevice] = useState<Device>("desktop");
  const [published, setPublished] = useState(publishedAt);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const section = doc.sections.find((s) => s.id === selected);

  const setSections = (sections: Section[]) => update({ ...doc, sections });
  const setSection = (next: Section) =>
    update({ ...doc, sections: doc.sections.map((s) => (s.id === next.id ? next : s)) });

  const publish = async () => {
    setPublishing(true);
    setPublishError(null);
    // Flush the pending autosave first, or Publish copies the previous draft.
    await saveNow();
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, { method: "POST" });
      if (!res.ok) {
        setPublishError(res.status === 422 ? "Something in the draft is invalid." : "Publish failed.");
        return;
      }
      const json = (await res.json()) as { publishedAt: string };
      setPublished(json.publishedAt);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <EditorAssetsContext.Provider value={editorAssets}>
      <div className="flex h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
        <header className="flex shrink-0 items-center gap-4 border-b border-neutral-200 bg-white px-4 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
          <span className="text-sm font-semibold">{subdomain}</span>

          <div className="flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-800">
            {(["content", "design"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  tab === t
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <SaveIndicator state={saveState} />
            <div className="flex rounded-md border border-neutral-200 p-0.5 dark:border-neutral-800">
              {(["desktop", "tablet", "phone"] as Device[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-label={d}
                  title={d}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    device === d
                      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-50"
                  }`}
                >
                  {d === "desktop" ? "▭" : d === "tablet" ? "▯" : "▏"}
                </button>
              ))}
            </div>
            <a
              href={`/dashboard/${siteId}/analytics`}
              className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
            >
              Analytics
            </a>
            <a
              href={`/dashboard/${siteId}/settings`}
              className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
            >
              Settings
            </a>
            {published && (
              <a
                href={`/u/${subdomain}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
              >
                View site
              </a>
            )}
            {signOutSlot}
            <button
              type="button"
              onClick={publish}
              disabled={publishing}
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {publishing ? "Publishing…" : published ? "Publish changes" : "Publish"}
            </button>
          </div>
        </header>

        {publishError && <p role="alert" className="shrink-0 bg-red-50 px-4 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{publishError}</p>}
        {saveState === "conflict" && (
          <p role="alert" className="shrink-0 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            This site changed in another tab. Reload to pick up those edits — saving here has stopped so nothing is overwritten.
          </p>
        )}

        <div className="flex min-h-0 flex-1">
          {tab === "content" ? (
            <>
              <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <SectionList
                  doc={doc}
                  sections={doc.sections}
                  selected={selected}
                  onSelect={setSelected}
                  onChange={setSections}
                />
              </aside>

              <section className="w-96 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                {section ? (
                  <div className="space-y-4">
                    <TextInput
                      label="Section title"
                      value={section.title ?? ""}
                      onChange={(title) => setSection({ ...section, title })}
                    />
                    <TextInput
                      label="Anchor"
                      value={section.slug}
                      hint="Used by nav links: #slug"
                      onChange={(slug) => setSection({ ...section, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                    />
                    <OptionsPanel section={section} onChange={setSection} />
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 dark:text-neutral-50">
                        Background
                      </h3>
                      <BackgroundEditor
                        value={section.background}
                        noneLabel="Same as the page"
                        onChange={(background) => setSection({ ...section, background })}
                      />
                    </div>
                    <hr className="border-neutral-200 dark:border-neutral-800" />
                    <SectionForm section={section} onChange={setSection} />
                  </div>
                ) : (
                  <ProfileForm doc={doc} onChange={update} />
                )}
              </section>
            </>
          ) : (
            <section className="w-[26rem] shrink-0 overflow-y-auto border-r border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <DesignPanel design={doc.design} onChange={(design) => update({ ...doc, design })} />
            </section>
          )}

          <main className="min-w-0 flex-1 overflow-hidden bg-neutral-200 p-4 dark:bg-black">
            <div
              className="mx-auto h-full overflow-hidden rounded-lg bg-white shadow-sm dark:bg-neutral-900"
              style={{ width: DEVICE_WIDTH[device] }}
            >
              <iframe ref={previewFrame} src={`/dashboard/${siteId}/preview`} title="Preview" className="h-full w-full border-0" />
            </div>
          </main>
        </div>
      </div>
    </EditorAssetsContext.Provider>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const text =
    state === "saving" ? "Saving…"
    : state === "saved" ? "Saved"
    : state === "error" ? "Save failed"
    : state === "conflict" ? "Paused"
    : "";
  return <span className="w-20 text-right text-xs text-neutral-400 dark:text-neutral-500">{text}</span>;
}
