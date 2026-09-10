"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { NavConfig } from "@/lib/schema/portfolio";

export type NavItem = { slug: string; label: string };

/**
 * All nav variants in one component.
 *
 * Nav is a site-level choice, not a property of the preset — the whole point of
 * splitting shell from sections is that "editorial look, floating side rail" is
 * a combination the user can actually reach. Scroll-spy is identical across
 * variants, so it lives here once and only the markup differs.
 *
 * Two axes cut across the variants rather than belonging to any one of them:
 *
 *   `side`            which edge the vertical navs hang off. The variant ids
 *                     still say "left" because they are written into stored
 *                     documents; the rendering does not.
 *   `mobileBehavior`  what a horizontal nav does once its links no longer fit.
 *                     A row of links in a 60px bar is fine at three items and
 *                     broken at five, and which trade-off is right — collapse,
 *                     scroll, wrap, or drop the links — is a taste question, so
 *                     it is a setting rather than a hardcoded breakpoint.
 */
export function Nav({
  config,
  items,
  monogram,
}: {
  config: NavConfig;
  items: NavItem[];
  monogram?: string;
}) {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActive(items.find((i) => visible.has(i.slug))?.slug ?? "");
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const { slug } of items) {
      const el = document.getElementById(slug);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  // A menu left open while the layout changes under it would trap the page
  // behind an overlay with no visible way out. Adjusted during render rather
  // than in an effect so the overlay never paints against the new layout.
  const layoutKey = `${config.variant}:${config.mobileBehavior}`;
  const [openFor, setOpenFor] = useState(layoutKey);
  if (openFor !== layoutKey) {
    setOpenFor(layoutKey);
    setOpen(false);
  }

  if (config.variant === "none") return null;

  const right = config.side === "right";

  const label = (item: NavItem, i: number) => {
    if (config.labelStyle === "numbered") return String(i + 1).padStart(2, "0");
    if (config.labelStyle === "dot") return "";
    return item.label;
  };

  const linkClass = (slug: string) =>
    cn(
      "block whitespace-nowrap rounded-[var(--radius)] px-3 py-1.5 text-sm transition-colors",
      active === slug
        ? "text-[var(--foreground)]"
        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
    );

  const Logo = monogram ? (
    <a
      href="#top"
      aria-label="Back to top"
      className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight text-[var(--foreground)]"
    >
      {monogram}
    </a>
  ) : null;

  const links = (ulClass?: string) => (
    <ul className={cn("flex gap-1", ulClass)}>
      {items.map((item, i) => (
        <li key={item.slug}>
          <a href={`#${item.slug}`} className={linkClass(item.slug)} aria-current={active === item.slug ? "true" : undefined}>
            {label(item, i)}
          </a>
        </li>
      ))}
    </ul>
  );

  const surface = cn(
    "border-[var(--border-color)] bg-[var(--background)]",
    config.blurOnScroll && scrolled && "bg-[var(--background)]/85 backdrop-blur-sm",
  );

  /** The full-screen list the hamburger opens, shared by two variants. */
  const overlay = open && (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--background)]"
      onClick={() => setOpen(false)}
    >
      <ul className="flex max-h-full flex-col items-center gap-6 overflow-y-auto py-20">
        {items.map((item, i) => (
          <li key={item.slug}>
            <a
              href={`#${item.slug}`}
              className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[var(--foreground)]"
            >
              {label(item, i)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  const MenuButton = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-[var(--foreground)]"
    >
      {open ? "Close" : "Menu"}
    </button>
  );

  switch (config.variant) {
    case "top-fixed":
    case "top-static": {
      const fixed = config.variant === "top-fixed";
      const behavior = config.mobileBehavior;
      // `wrap` is the only behaviour that gives up the fixed bar height, so the
      // bar has to be able to grow; every other behaviour keeps 60px exactly.
      const wraps = behavior === "wrap";

      return (
        <>
          <header
            className={cn(
              "inset-x-0 top-0 z-50 border-b transition-colors duration-300",
              fixed ? "fixed" : "relative",
              scrolled || !fixed ? surface : "border-transparent bg-transparent",
            )}
          >
            <nav
              className={cn(
                "mx-auto flex items-center justify-between gap-4 px-6 md:px-10",
                wraps ? "min-h-[60px] flex-wrap py-2 md:flex-nowrap md:py-0" : "h-[60px]",
              )}
              style={{ maxWidth: "var(--container)" }}
            >
              {config.showLogo ? Logo : <span />}

              <div
                className={cn(
                  "min-w-0",
                  // Collapsed and hidden both take the links out of the bar
                  // below md; the hamburger is what puts them back.
                  (behavior === "hamburger" || behavior === "hide") && "hidden md:block",
                  // A strip that scrolls sideways, with the scrollbar itself
                  // hidden — it would sit on top of the links in a 60px bar.
                  behavior === "scroll" &&
                    "overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                )}
              >
                {links(cn(wraps && "flex-wrap justify-end"))}
              </div>

              {behavior === "hamburger" && <span className="md:hidden">{MenuButton}</span>}
            </nav>
          </header>
          {overlay}
        </>
      );
    }

    case "side-left-rail":
      return (
        <header
          className={cn(
            "fixed inset-y-0 z-50 hidden w-52 p-6 lg:block",
            right ? "right-0 border-l" : "left-0 border-r",
            surface,
          )}
        >
          <nav className="flex h-full flex-col gap-8">
            {config.showLogo && Logo}
            {links("flex-col items-start")}
          </nav>
        </header>
      );

    case "side-floating-pill":
      return (
        <header
          className={cn(
            "fixed top-1/2 z-50 hidden -translate-y-1/2 rounded-[var(--radius)] border p-3 shadow-[var(--shadow)] lg:block",
            right ? "right-6" : "left-6",
            surface,
          )}
        >
          <nav className="flex flex-col items-center gap-2">
            {config.showLogo && Logo && (
              <>
                {Logo}
                <span className="h-px w-full bg-[var(--border-color)]" aria-hidden />
              </>
            )}
            {links("flex-col items-stretch text-center")}
          </nav>
        </header>
      );

    case "bottom-dock":
      return (
        <header
          className={cn(
            "fixed bottom-6 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-[var(--radius)] border px-2 py-1.5 shadow-[var(--shadow)]",
            surface,
          )}
        >
          <nav className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links()}
          </nav>
        </header>
      );

    case "dot-rail":
      return (
        <nav
          className={cn("fixed top-1/2 z-50 hidden -translate-y-1/2 lg:block", right ? "right-6" : "left-6")}
          aria-label="Sections"
        >
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.slug}>
                <a
                  href={`#${item.slug}`}
                  aria-label={item.label}
                  aria-current={active === item.slug ? "true" : undefined}
                  className={cn(
                    "block h-2.5 w-2.5 rounded-full border transition-all",
                    active === item.slug
                      ? "scale-125 border-[var(--accent)] bg-[var(--accent)]"
                      : "border-[var(--foreground-subtle)] bg-transparent",
                  )}
                />
              </li>
            ))}
          </ul>
        </nav>
      );

    case "hamburger-overlay":
      return (
        <>
          <header className={cn("fixed inset-x-0 top-0 z-50 border-b", scrolled ? surface : "border-transparent bg-transparent")}>
            <nav className="mx-auto flex h-[60px] items-center justify-between px-6 md:px-10" style={{ maxWidth: "var(--container)" }}>
              {config.showLogo ? Logo : <span />}
              {MenuButton}
            </nav>
          </header>
          {overlay}
        </>
      );
  }
}
