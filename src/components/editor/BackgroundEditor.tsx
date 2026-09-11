"use client";

import type { Background, BackgroundConfig } from "@/lib/schema/background";
import { MIN_MEDIA_OVERLAY_OPACITY, NO_BACKGROUND } from "@/lib/schema/background";
import { ColorInput, Select, Toggle } from "./fields";
import { AssetInput } from "./AssetInput";

/**
 * A background for the whole page or for one section: nothing, a colour, an
 * image or a GIF, optionally different in light and dark.
 *
 * Gradients and patterns can come from a preset but aren't edited here yet, so
 * one that is already set stays selectable as itself rather than being lost the
 * moment the panel opens.
 */

type MediaBackground = Extract<Background, { kind: "image" | "animated" }>;

const opts = <T extends string>(values: readonly T[]) =>
  values.map((value) => ({ value, label: value.replace(/-/g, " ") }));

const POSITIONS = [
  "center", "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right",
] as const;

/** Overlay strengths offered, from the readable minimum up. */
const OVERLAY_STEPS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

/** Switching kind keeps whatever the old layer has in common with the new one. */
function layerOfKind(kind: Background["kind"], previous: Background): Background {
  const media = previous.kind === "image" || previous.kind === "animated" ? previous : undefined;
  switch (kind) {
    case "solid":
      return { kind, color: previous.kind === "solid" ? previous.color : "#ffffff" };
    case "image":
    case "animated":
      return {
        kind,
        assetId: media?.assetId ?? "",
        fit: media?.fit ?? "cover",
        position: media?.position ?? "center",
        overlay: media?.overlay ?? { color: "#000000", opacity: 0.4 },
        blur: media?.blur ?? 0,
        parallax: media?.parallax ?? false,
      };
    case "gradient":
    case "pattern":
      // Only reachable by keeping the preset's own layer, which is `previous`.
      return previous;
    default:
      return { kind: "none" };
  }
}

function LayerEditor({
  label, value, onChange, noneLabel,
}: {
  label: string;
  value: Background;
  onChange: (next: Background) => void;
  noneLabel: string;
}) {
  const kinds = [
    { value: "none" as const, label: noneLabel },
    { value: "solid" as const, label: "Colour" },
    { value: "image" as const, label: "Image" },
    { value: "animated" as const, label: "GIF" },
    ...(value.kind === "gradient" ? [{ value: "gradient" as const, label: "Gradient (from the preset)" }] : []),
    ...(value.kind === "pattern" ? [{ value: "pattern" as const, label: "Pattern (from the preset)" }] : []),
  ];

  const setMedia = (patch: Partial<MediaBackground>) => onChange({ ...(value as MediaBackground), ...patch });
  const steps = value.kind === "image" || value.kind === "animated"
    ? [...new Set([...OVERLAY_STEPS, value.overlay.opacity])].sort((a, b) => a - b)
    : OVERLAY_STEPS;

  return (
    <div className="space-y-3">
      <Select label={label} value={value.kind} options={kinds} onChange={(kind) => onChange(layerOfKind(kind, value))} />

      {value.kind === "solid" && (
        <ColorInput label="Colour" value={value.color} onChange={(color) => onChange({ ...value, color })} />
      )}

      {(value.kind === "image" || value.kind === "animated") && (
        <>
          <AssetInput
            label={value.kind === "animated" ? "GIF" : "Image"}
            value={value.assetId || undefined}
            hint={value.kind === "animated" ? "Plays as a silent looping video where the server can convert it." : undefined}
            onChange={(assetId) => setMedia({ assetId: assetId ?? "" })}
          />
          <Select label="Fit" value={value.fit} options={opts(["cover", "contain", "tile"] as const)} onChange={(fit) => setMedia({ fit })} />
          <Select label="Position" value={value.position} options={opts(POSITIONS)} onChange={(position) => setMedia({ position })} />
          <ColorInput
            label="Overlay"
            value={value.overlay.color}
            onChange={(color) => setMedia({ overlay: { ...value.overlay, color } })}
          />
          <Select
            label="Overlay strength"
            value={String(value.overlay.opacity)}
            options={steps.map((step) => ({ value: String(step), label: `${Math.round(step * 100)}%` }))}
            hint={`Never below ${MIN_MEDIA_OVERLAY_OPACITY * 100}% on the page, so text stays readable.`}
            onChange={(opacity) => setMedia({ overlay: { ...value.overlay, opacity: Number(opacity) } })}
          />
          <Toggle label="Parallax" value={value.parallax} onChange={(parallax) => setMedia({ parallax })} />
        </>
      )}
    </div>
  );
}

export function BackgroundEditor({
  value, onChange, noneLabel = "None",
}: {
  value: BackgroundConfig | undefined;
  onChange: (next: BackgroundConfig) => void;
  /** What "no background" means where this is used: nothing, or the page's own. */
  noneLabel?: string;
}) {
  const config = value ?? NO_BACKGROUND;

  return (
    <div className="space-y-4">
      <Toggle label="Same in light and dark" value={config.sameInBoth} onChange={(sameInBoth) => onChange({ ...config, sameInBoth })} />
      <LayerEditor
        label={config.sameInBoth ? "Background" : "Light"}
        value={config.light}
        noneLabel={noneLabel}
        onChange={(light) => onChange({ ...config, light })}
      />
      {!config.sameInBoth && (
        <LayerEditor label="Dark" value={config.dark} noneLabel={noneLabel} onChange={(dark) => onChange({ ...config, dark })} />
      )}
    </div>
  );
}
