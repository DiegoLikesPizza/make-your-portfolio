import { Reveal } from "@/render/primitives/Reveal";
import type { SectionProps } from "@/render/context";
import { option } from "@/lib/variant-options";

/**
 * Tone changes the edge and the ground, never the text colour — a callout has
 * to stay as readable as the page it sits in, and body copy tinted to match a
 * border is the usual way that gets lost.
 */
const TONES = {
  accent: "border-l-[var(--accent)] bg-[var(--accent-soft)]",
  neutral: "border-l-[var(--foreground-subtle)] bg-[var(--background-secondary)]",
  warning: "border-l-amber-500 bg-amber-500/10",
} as const;

/** A bordered panel. No section index — it is an aside, not a chapter. */
export default function TextCallout({ section, ctx }: SectionProps<"text">) {
  const m = ctx.doc.design.tokens.motion;
  const tone = TONES[option(section, "tone")];
  return (
    <Reveal motionStyle={m}>
      <div className={`rounded-[var(--radius)] border border-[var(--border-color)] border-l-2 p-6 md:p-8 ${tone}`}>
        {section.title && (
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
            {section.title}
          </h3>
        )}
        <div className="mt-3 max-w-[62ch] space-y-4 leading-relaxed text-[var(--foreground-muted)]">
          {section.data.body.split(/\n\n+/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
