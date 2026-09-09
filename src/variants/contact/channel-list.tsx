import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/render/primitives/Reveal";
import { SectionIndex } from "@/render/primitives/Section";
import { LinkIcon } from "@/render/primitives/LinkIcon";
import { highlight } from "@/lib/text";
import type { SectionProps } from "@/render/context";

/** lfdiego.xyz's Contact: lead copy left, a list of channels right. */
export default function ContactChannelList({ section, index, ctx }: SectionProps<"contact">) {
  const m = ctx.doc.design.tokens.motion;
  const { headline, blurb, channels } = section.data;

  return (
    <div>
      <Reveal motionStyle={m}>
        <SectionIndex index={index} label={section.title} show />
      </Reveal>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal motionStyle={m} delay={0.06}>
            {headline && (
              <h2
                className="font-[family-name:var(--font-heading)] font-semibold leading-tight tracking-[-0.02em] text-[var(--foreground)]"
                style={{ fontSize: "calc(clamp(2rem, 4.5vw, 3rem) * var(--type-scale))" }}
              >
                {highlight(headline)}
              </h2>
            )}
            {blurb && (
              <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-[var(--foreground-muted)]">{blurb}</p>
            )}
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal motionStyle={m} delay={0.1}>
            <ul className="border-t border-[var(--border-color)]">
              {channels.map((c) => {
                const external = c.href.startsWith("http");
                return (
                  <li key={c.id}>
                    <a
                      href={c.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer nofollow ugc" : undefined}
                      className="group flex items-center gap-5 border-b border-[var(--border-color)] py-5 transition-colors hover:bg-[var(--accent-soft)] md:py-6"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[var(--border-color)] bg-[var(--surface)] text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                        <LinkIcon name={c.icon} className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
                          {c.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[var(--foreground)]">
                          {c.href.replace(/^mailto:/, "").replace(/^https?:\/\//, "")}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--foreground-subtle)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
