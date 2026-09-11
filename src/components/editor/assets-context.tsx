"use client";

import { createContext, useContext } from "react";
import type { AssetMap, ResolvedAsset } from "@/render/context";

/**
 * The site's uploads, for every image field in the editor.
 *
 * A context rather than props: image fields sit several layers down in the
 * profile, section and design forms, none of which otherwise care about uploads.
 */
export type EditorAssets = {
  siteId: string;
  assets: AssetMap;
  addAsset: (id: string, asset: ResolvedAsset) => void;
};

export const EditorAssetsContext = createContext<EditorAssets | null>(null);

export function useEditorAssets(): EditorAssets {
  const value = useContext(EditorAssetsContext);
  if (!value) throw new Error("useEditorAssets must be used inside the editor");
  return value;
}
