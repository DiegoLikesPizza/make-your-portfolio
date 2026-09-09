import type { ReactNode } from "react";
import { Background } from "../Background";
import type { RenderCtx } from "../context";
import type { BackgroundConfig } from "@/lib/schema/background";

/**
 * The frame every section shares: anchor id, container width, vertical rhythm,
 * its own optional background, and the divider style from tokens.
 *
 * Variants render only their own content and never worry about any of this,
 * which is what keeps a variant file small enough to be worth writing sixty of.
 */
export function SectionFrame({
  slug,
  background,
  ctx,
  children,
  bleed = false,
}: {
  slug: string;
  background?: BackgroundConfig;
  ctx: RenderCtx;
  children: ReactNode;
  /** Full-bleed variants opt out of the container. */
  bleed?: boolean;
}) {
  const divider = ctx.doc.design.tokens.divider;

  return (
    <section
      id={slug}
      className="relative scroll-mt-24"
      style={{
        paddingBlock: "var(--section-space)",
        borderTop:
          divider === "line"
            ? "var(--border-width) solid var(--border-color)"
            : undefined,
        backgroundImage:
          divider === "gradient"
            ? "linear-gradient(to right, transparent, var(--border-color), transparent)"
            : undefined,
        backgroundSize: divider === "gradient" ? "100% 1px" : undefined,
        backgroundRepeat: "no-repeat",
      }}
    >
      <Background config={background} ctx={ctx} />
      {bleed ? children : <div className="mx-auto w-full px-6 md:px-10" style={{ maxWidth: "var(--container)" }}>{children}</div>}
    </section>
  );
}

/**
 * The "01 / About" marker. The number comes from section order, never storage,
 * so reordering renumbers automatically and `divider: "number"` is the only
 * thing that decides whether it shows at all.
 */
export function SectionIndex({ index, label, show }: { index: number; label?: string; show: boolean }) {
  if (!show || !label) return null;
  return (
    <div className="space-y-3">
      <span className="block font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-[var(--foreground-subtle)]">
        {String(index).padStart(2, "0")} / {label}
      </span>
      <span className="block h-0.5 w-10 bg-[var(--accent)]" />
    </div>
  );
}
