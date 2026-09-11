"use client";

import { useRef, useState } from "react";
import { Field } from "./fields";
import { useEditorAssets } from "./assets-context";

const button =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium transition-colors hover:border-neutral-900 disabled:opacity-40 dark:border-neutral-700 dark:hover:border-neutral-100";

/**
 * An image field: upload one, see it, replace it, or clear the field.
 *
 * Clearing only unsets the field. The file stays: another field or a saved
 * version may still use it, and unused uploads are deleted from Settings.
 */
export function AssetInput({
  label, value, onChange, hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (assetId: string | undefined) => void;
  hint?: string;
}) {
  const { siteId, assets, addAsset } = useEditorAssets();
  const picker = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();
  const current = value ? assets[value] : undefined;

  const upload = async (file: File) => {
    setUploading(true);
    setError(undefined);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/sites/${siteId}/assets`, { method: "POST", body });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(json.error ?? "The upload failed.");
        return;
      }
      addAsset(json.id, json.asset);
      onChange(json.id);
    } catch {
      setError("The upload failed.");
    } finally {
      setUploading(false);
      if (picker.current) picker.current.value = "";
    }
  };

  return (
    <Field label={label} hint={hint} error={error}>
      <span className="mt-1.5 flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
          {current ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-neutral-400">None</span>
          )}
        </span>
        <button type="button" disabled={uploading} onClick={() => picker.current?.click()} className={button}>
          {uploading ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
        {value && !uploading && (
          <button type="button" onClick={() => onChange(undefined)} className={button}>
            Remove
          </button>
        )}
        <input
          ref={picker}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </span>
    </Field>
  );
}
