import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import type { SectionProps } from "@/render/context";

/** Headline plus a wall of chips; the capability cards are deliberately dropped. */
export default function CapabilitiesChipsOnly({ section, index, ctx }: SectionProps<"capabilities">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, chips } = section.data;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
        {headline && (
          <h2
            className="mt-8 max-w-[20ch] font-[family-name:var(--font-heading)] font-semibold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
            style={{ fontSize: "calc(clamp(1.9rem, 4vw, 2.75rem) * var(--type-scale))" }}
          >
            {headline}
          </h2>
        )}
      </Reveal>
      <Reveal motionStyle={m} delay={0.08}>
        <ul className="mt-10 flex flex-wrap gap-3">
          {chips.map((c) => (
            <li
              key={c.id}
              className="rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-5 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--foreground-muted)]"
            >
              {c.label}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
