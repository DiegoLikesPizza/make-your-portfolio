import { Nav, type NavItem } from "./Nav";
import { isSideNav, railOffset } from "./nav-layout";
import { Hero } from "./hero/Hero";
import { Background } from "./Background";
import { SectionFrame } from "./primitives/Section";
import { SchemeToggle } from "./primitives/SchemeToggle";
import { ViewBeacon } from "./primitives/ViewBeacon";
import { tokensToCss } from "./tokens";
import { isBleed, resolveVariant } from "@/variants/registry";
import type { RenderCtx } from "./context";
import { cn } from "@/lib/utils";

/**
 * Assembles one published portfolio: shell, then hero, then sections in order.
 *
 * Identical in the public route and the editor preview — that is the only
 * reason "what you see is what publishes" is actually true rather than a claim.
 */
export function Portfolio({
  ctx,
  analyticsSiteId,
}: {
  ctx: RenderCtx;
  /**
   * Set on the public routes only. The editor preview renders the same tree,
   * and counting the author's own keystrokes as traffic would make the number
   * meaningless.
   */
  analyticsSiteId?: string;
}) {
  const { doc } = ctx;
  const { design, profile } = doc;

  const visible = doc.sections.filter((s) => !s.hidden);
  const navItems: NavItem[] = visible
    .filter((s) => s.title)
    .map((s) => ({ slug: s.slug, label: s.title as string }));

  // Only the full-height rail takes width away from the page; the pill and the
  // dot rail float over it.
  const railPad = railOffset(design.nav);
  // The floating scheme toggle lives in the top-right corner, which is exactly
  // where a right-hand nav is. Send it to the other corner rather than letting
  // the two overlap.
  const navOnRight = isSideNav(design.nav.variant) && design.nav.side === "right";

  return (
    <div
      data-portfolio-root
      data-scheme={design.colorScheme}
      className="portfolio min-h-screen bg-[var(--background)] font-[family-name:var(--font-body)] text-[var(--foreground)] antialiased"
    >
      {/* Tokens are emitted as a scoped stylesheet rather than inline styles so
          that :hover, media queries and the dark-scheme blocks all work. */}
      <style dangerouslySetInnerHTML={{ __html: tokensToCss(design.tokens, ".portfolio") }} />

      {analyticsSiteId && <ViewBeacon siteId={analyticsSiteId} />}

      <Background config={design.background} ctx={ctx} />

      <Nav config={design.nav} items={navItems} monogram={profile.initials ?? profile.name.slice(0, 2)} />

      {design.nav.showThemeToggle && design.colorScheme === "auto" && (
        <div className={cn("fixed top-4 z-[60]", navOnRight ? "left-6" : "right-6")}>
          <SchemeToggle />
        </div>
      )}

      <main className={cn("relative", railPad)}>
        <Hero ctx={ctx} />

        {visible.map((section, i) => {
          const Component = resolveVariant(section.type, section.variant);
          if (!Component) return null;
          return (
            <SectionFrame
              key={section.id}
              slug={section.slug}
              background={section.background}
              ctx={ctx}
              bleed={isBleed(section.type, section.variant)}
            >
              <Component section={section} index={i + 1} ctx={ctx} />
            </SectionFrame>
          );
        })}
      </main>

      {design.footer !== "none" && (
        <footer
          className={cn("relative border-t border-[var(--border-color)] py-10", railPad)}
        >
          <div className="mx-auto flex flex-wrap items-center justify-between gap-4 px-6 md:px-10" style={{ maxWidth: "var(--container)" }}>
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.12em] text-[var(--foreground-subtle)]">
              &copy; {new Date().getFullYear()} {profile.name}
            </span>
            {design.nav.showThemeToggle && design.colorScheme !== "auto" && <SchemeToggle />}
          </div>
        </footer>
      )}
    </div>
  );
}
