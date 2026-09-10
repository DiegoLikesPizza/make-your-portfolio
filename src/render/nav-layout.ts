import type { NavConfig } from "@/lib/schema/portfolio";

/**
 * Where a nav variant sits, as plain functions.
 *
 * Separate from Nav.tsx because that file is "use client" — a server component
 * can render a client component but cannot call a function exported from one,
 * and Portfolio (a server component) needs these to lay the page out around the
 * nav.
 */

/** Variants that hang off a vertical edge, and so honour `side`. */
export function isSideNav(variant: NavConfig["variant"]) {
  return variant === "side-left-rail" || variant === "side-floating-pill" || variant === "dot-rail";
}

/**
 * The padding the page needs to clear the nav.
 *
 * Only the full-height rail takes width away from the page; the floating pill
 * and the dot rail overlay it.
 */
export function railOffset(config: NavConfig) {
  if (config.variant !== "side-left-rail") return undefined;
  return config.side === "right" ? "lg:pr-52" : "lg:pl-52";
}
