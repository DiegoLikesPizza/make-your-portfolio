import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import { highlight } from "@/lib/text";
import type { SectionProps } from "@/render/context";

export default function ContactCardGrid({ section, index, ctx }: SectionProps<"contact">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, blurb, channels } = section.data;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
        {headline && (
          <h2 className="mt-8 max-w-[18ch] font-[family-name:var(--font-heading)] text-4xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            {highlight(headline)}
          </h2>
        )}
        {blurb && <p className="mt-4 max-w-[46ch] text-lg leading-relaxed text-[var(--foreground-muted)]">{blurb}</p>}
      </Reveal>
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {channels.map((c, i) => {
          const external = c.href.startsWith("http");
          return (
            <li key={c.id}>
              <Reveal motionStyle={m} delay={i * 0.05}>
                <a
                  href={c.href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer nofollow ugc" : undefined}
                  className="group flex h-full flex-col rounded-[var(--radius)] border border-[var(--border-color)] bg-[var(--surface)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[var(--shadow)]"
                >
                  <LinkIcon name={c.icon} className="h-5 w-5 text-[var(--accent)]" />
                  <span className="mt-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                    {c.label}
                  </span>
                  <span className="mt-1 truncate text-[var(--foreground)]">
                    {c.href.replace(/^mailto:/, "").replace(/^https?:\/\//, "")}
                  </span>
                </a>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
