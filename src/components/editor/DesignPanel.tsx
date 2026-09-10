"use client";

import type { Design } from "@/lib/schema/portfolio";
import { ColorInput, Select, Toggle } from "./fields";
import { PRESETS } from "@/presets";

/**
 * The Design tab: shell, tokens and colour, independent of any preset.
 *
 * This is the panel that makes the three-layer model visible — a preset only
 * seeds these values, and every one of them stays editable afterwards.
 */

const opts = <T extends string>(values: readonly T[]) =>
  values.map((v) => ({ value: v, label: v.replace(/-/g, " ") }));

const NAV_VARIANTS = [
  "top-fixed", "top-static", "side-left-rail", "side-floating-pill",
  "bottom-dock", "dot-rail", "hamburger-overlay", "none",
] as const;

const FONT_PAIRS = [
  "grotesk-inter-jetbrains", "inter-inter-jetbrains", "playfair-inter-jetbrains",
  "manrope-manrope-mono", "dm-serif-dm-sans", "space-space-space",
  "libre-source-ibm", "bricolage-inter-mono",
] as const;

export function DesignPanel({ design, onChange }: { design: Design; onChange: (next: Design) => void }) {
  const set = (patch: Partial<Design>) => onChange({ ...design, ...patch });
  const setTokens = (patch: Partial<Design["tokens"]>) => set({ tokens: { ...design.tokens, ...patch } });
  const setNav = (patch: Partial<Design["nav"]>) => set({ nav: { ...design.nav, ...patch } });
  const setPalette = (patch: Partial<Design["tokens"]["palette"]>) =>
    setTokens({ palette: { ...design.tokens.palette, ...patch } });

  return (
    <div className="space-y-6">
      <Group title="Preset">
        <Select
          label="Start from"
          value={design.preset}
          options={Object.entries(PRESETS).map(([value, p]) => ({ value, label: p.label }))}
          hint="Loading a preset replaces every value below. Change any of them afterwards."
          onChange={(preset) => onChange({ ...PRESETS[preset].design })}
        />
      </Group>

      <Group title="Navigation">
        <Select label="Style" value={design.nav.variant} options={opts(NAV_VARIANTS)} onChange={(variant) => setNav({ variant })} />
        <Select
          label="Labels"
          value={design.nav.labelStyle}
          options={opts(["text", "numbered", "icon", "dot"] as const)}
          onChange={(labelStyle) => setNav({ labelStyle })}
        />
        <Toggle label="Show logo" value={design.nav.showLogo} onChange={(showLogo) => setNav({ showLogo })} />
        <Toggle label="Blur on scroll" value={design.nav.blurOnScroll} onChange={(blurOnScroll) => setNav({ blurOnScroll })} />
        <Toggle label="Theme toggle" value={design.nav.showThemeToggle} onChange={(showThemeToggle) => setNav({ showThemeToggle })} />
      </Group>

      <Group title="Shape">
        <Select label="Corners" value={design.tokens.radius} options={opts(["sharp", "subtle", "soft", "round", "pill"] as const)} onChange={(radius) => setTokens({ radius })} />
        <Select label="Borders" value={design.tokens.borderWidth} options={opts(["none", "hairline", "thin", "thick"] as const)} onChange={(borderWidth) => setTokens({ borderWidth })} />
        <Select label="Shadow" value={design.tokens.shadow} options={opts(["none", "soft", "hard"] as const)} onChange={(shadow) => setTokens({ shadow })} />
        <Select label="Dividers" value={design.tokens.divider} options={opts(["none", "line", "space", "number", "gradient"] as const)} onChange={(divider) => setTokens({ divider })} />
      </Group>

      <Group title="Layout">
        <Select label="Width" value={design.tokens.container} options={opts(["narrow", "normal", "wide", "full"] as const)} onChange={(container) => setTokens({ container })} />
        <Select label="Density" value={design.tokens.density} options={opts(["compact", "normal", "airy"] as const)} onChange={(density) => setTokens({ density })} />
        <Select label="Motion" value={design.tokens.motion} options={opts(["none", "fade", "rise", "stagger"] as const)} onChange={(motion) => setTokens({ motion })} />
      </Group>

      <Group title="Type">
        <Select label="Font pairing" value={design.tokens.fontPair} options={opts(FONT_PAIRS)} onChange={(fontPair) => setTokens({ fontPair })} />
        <Select label="Scale" value={design.tokens.typeScale} options={opts(["tight", "normal", "display"] as const)} onChange={(typeScale) => setTokens({ typeScale })} />
      </Group>

      <Group title="Colour">
        <Select
          label="Scheme"
          value={design.colorScheme}
          options={opts(["light", "dark", "auto"] as const)}
          hint="Auto follows the visitor's system setting."
          onChange={(colorScheme) => set({ colorScheme })}
        />
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Accent" value={design.tokens.palette.accent} onChange={(accent) => setPalette({ accent })} />
          <ColorInput label="Accent (dark)" value={design.tokens.palette.accentDark} onChange={(accentDark) => setPalette({ accentDark })} />
          <ColorInput label="Background" value={design.tokens.palette.background} onChange={(background) => setPalette({ background })} />
          <ColorInput label="Background (dark)" value={design.tokens.palette.backgroundDark} onChange={(backgroundDark) => setPalette({ backgroundDark })} />
          <ColorInput label="Text" value={design.tokens.palette.foreground} onChange={(foreground) => setPalette({ foreground })} />
          <ColorInput label="Text (dark)" value={design.tokens.palette.foregroundDark} onChange={(foregroundDark) => setPalette({ foregroundDark })} />
        </div>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Greys, borders and muted text are derived from these three, so they stay in tune automatically.
        </p>
      </Group>

      <Group title="Footer">
        <Select label="Style" value={design.footer} options={opts(["minimal", "columns", "oversized-type", "none"] as const)} onChange={(footer) => set({ footer })} />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 dark:text-neutral-50">{title}</h3>
      {children}
    </section>
  );
}
