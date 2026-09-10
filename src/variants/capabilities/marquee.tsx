import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import { Marquee } from "@/render/primitives/Marquee";
import type { SectionProps } from "@/render/context";
import { MARQUEE_SECONDS, option } from "@/lib/variant-options";

/** Capability cards static, chips scrolling underneath. */
export default function CapabilitiesMarquee({ section, index, ctx }: SectionProps<"capabilities">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, items, chips } = section.data;
  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
        {headline && (
          <h2 className="mt-8 max-w-[22ch] font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--foreground)]">
            {headline}
          </h2>
        )}
      </Reveal>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} motionStyle={m} delay={i * 0.06}>
            <LinkIcon name={item.icon} className="h-5 w-5 text-[var(--accent)]" />
            <h3 className="mt-3 font-[family-name:var(--font-heading)] font-semibold text-[var(--foreground)]">{item.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">{item.body}</p>
          </Reveal>
        ))}
      </div>
      {chips.length > 0 && (
        <div className="mt-12 border-y border-[var(--border-color)] py-6">
          <Marquee seconds={MARQUEE_SECONDS[option(section, "speed")]} direction={option(section, "direction")}>
            {chips.map((c) => (
              <span
                key={c.id}
                className="whitespace-nowrap font-[family-name:var(--font-heading)] text-xl font-medium text-[var(--foreground-muted)]"
              >
                {c.label}
              </span>
            ))}
          </Marquee>
        </div>
      )}
    </div>
  );
}
