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

  if (config.variant === "none") return null;

  const label = (item: NavItem, i: number) => {
    if (config.labelStyle === "numbered") return String(i + 1).padStart(2, "0");
    if (config.labelStyle === "dot") return "";
    return item.label;
  };

  const linkClass = (slug: string) =>
    cn(
      "rounded-[var(--radius)] px-3 py-1.5 text-sm transition-colors",
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

  const links = (
    <ul className={cn("flex gap-1", isVertical(config.variant) && "flex-col items-start")}>
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

  switch (config.variant) {
    case "top-fixed":
    case "top-static":
      return (
        <header
          className={cn(
            "inset-x-0 top-0 z-50 border-b transition-colors duration-300",
            config.variant === "top-fixed" ? "fixed" : "relative",
            scrolled || config.variant === "top-static" ? surface : "border-transparent bg-transparent",
          )}
        >
          <nav
            className="mx-auto flex h-[60px] items-center justify-between px-6 md:px-10"
            style={{ maxWidth: "var(--container)" }}
          >
            {config.showLogo ? Logo : <span />}
            {links}
          </nav>
        </header>
      );

    case "side-left-rail":
      return (
        <header className={cn("fixed inset-y-0 left-0 z-50 hidden w-52 border-r p-6 lg:block", surface)}>
          <nav className="flex h-full flex-col gap-8">
            {config.showLogo && Logo}
            {links}
          </nav>
        </header>
      );

    case "side-floating-pill":
      return (
        <header
          className={cn(
            "fixed left-6 top-1/2 z-50 hidden -translate-y-1/2 rounded-[var(--radius)] border p-3 shadow-[var(--shadow)] lg:block",
            surface,
          )}
        >
          <nav>{links}</nav>
        </header>
      );

    case "bottom-dock":
      return (
        <header
          className={cn(
            "fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--radius)] border px-2 py-1.5 shadow-[var(--shadow)]",
            surface,
          )}
        >
          <nav>{links}</nav>
        </header>
      );

    case "dot-rail":
      return (
        <nav className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 lg:block" aria-label="Sections">
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
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-label={open ? "Close menu" : "Open menu"}
                className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.14em] text-[var(--foreground)]"
              >
                {open ? "Close" : "Menu"}
              </button>
            </nav>
          </header>
          {open && (
            <div
              className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--background)]"
              onClick={() => setOpen(false)}
            >
              <ul className="flex flex-col items-center gap-6">
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
          )}
        </>
      );
  }
}

function isVertical(variant: NavConfig["variant"]) {
  return variant === "side-left-rail" || variant === "side-floating-pill";
}
