import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import type { SectionProps } from "@/render/context";

/** lfdiego.xyz's Stack: three icon cards over a row of tech chips. */
export default function CapabilitiesCards({ section, index, ctx }: SectionProps<"capabilities">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, items, chips } = section.data;

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

      {items.length > 0 && (
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} motionStyle={m} delay={i * 0.06}>
              <div className="group h-full rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--border-color)] bg-[var(--background-secondary)] text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                  <LinkIcon name={item.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {chips.length > 0 && (
        <Reveal motionStyle={m} delay={0.1}>
          <ul className="mt-10 flex flex-wrap gap-2.5">
            {chips.map((c) => (
              <li
                key={c.id}
                className="rounded-full border border-[var(--border-color)] bg-[var(--surface)] px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-xs tracking-tight text-[var(--foreground-muted)]"
              >
                {c.label}
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  );
}
