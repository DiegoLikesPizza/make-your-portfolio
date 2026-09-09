import type { Design } from "@/lib/schema/portfolio";

/**
 * A miniature of what a preset looks like, built from the preset's own tokens
 * rather than a screenshot — so it can never fall out of date with the preset
 * it advertises.
 */
const RADIUS: Record<Design["tokens"]["radius"], string> = {
  sharp: "0px",
  subtle: "4px",
  soft: "10px",
  round: "18px",
  pill: "999px",
};

export function PresetSwatch({
  id, label, description, design,
}: {
  id: string;
  label: string;
  description: string;
  design: Design;
}) {
  const p = design.tokens.palette;
  // Presets that ship dark (terminal) should preview dark.
  const dark = design.colorScheme === "dark";
  const bg = dark ? p.backgroundDark : p.background;
  const fg = dark ? p.foregroundDark : p.foreground;
  const accent = dark ? p.accentDark : p.accent;
  const radius = RADIUS[design.tokens.radius];

  return (
    <div className="h-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="p-5" style={{ background: bg, color: fg }} aria-hidden>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-8" style={{ background: accent, borderRadius: radius }} />
          <span className="h-1.5 w-4 opacity-30" style={{ background: fg, borderRadius: radius }} />
          <span className="h-1.5 w-4 opacity-30" style={{ background: fg, borderRadius: radius }} />
        </div>
        <div className="mt-5 space-y-1.5">
          <span className="block h-3 w-4/5 opacity-90" style={{ background: fg, borderRadius: radius }} />
          <span className="block h-3 w-3/5 opacity-90" style={{ background: fg, borderRadius: radius }} />
        </div>
        <div className="mt-4 space-y-1">
          <span className="block h-1.5 w-full opacity-25" style={{ background: fg, borderRadius: radius }} />
          <span className="block h-1.5 w-5/6 opacity-25" style={{ background: fg, borderRadius: radius }} />
        </div>
        <span
          className="mt-5 block h-5 w-24"
          style={{
            background: accent,
            borderRadius: design.tokens.radius === "pill" ? "999px" : radius,
          }}
        />
      </div>

      <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="font-medium">{label}</h3>
        <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{description}</p>
        <a
          href={`/layouts?preset=${id}`}
          className="mt-3 inline-block text-xs font-medium text-neutral-500 underline-offset-4 hover:underline"
        >
          See the layouts
        </a>
      </div>
    </div>
  );
}
