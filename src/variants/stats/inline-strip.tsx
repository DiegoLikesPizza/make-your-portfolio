import { Reveal } from "@/render/primitives/Reveal";
import type { SectionProps } from "@/render/context";
import { option } from "@/lib/variant-options";

/** A thin band with no section index — meant to sit between larger sections. */
export default function StatsInlineStrip({ section, ctx }: SectionProps<"stats">) {
  const m = ctx.doc.design.tokens.motion;
  const centred = option(section, "align") === "center";
  return (
    <Reveal motionStyle={m}>
      <dl
        className={`flex flex-wrap items-baseline gap-x-10 gap-y-6 border-y border-[var(--border-color)] py-8 ${
          centred ? "justify-center" : "justify-between"
        }`}
      >
        {section.data.items.map((s) => (
          <div key={s.id} className="flex items-baseline gap-3">
            <dt className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-[var(--foreground)]">
              {s.value}
              {s.suffix && <span className="text-[var(--accent)]">{s.suffix}</span>}
            </dt>
            <dd className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              {s.label}
            </dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
