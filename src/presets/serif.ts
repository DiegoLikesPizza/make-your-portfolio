import type { Design } from "@/lib/schema/portfolio";

/** Warm serif headings, generous spacing. Reads like a printed page. */
export const serif: Design = {
  preset: "serif",
  tokens: {
    palette: {
      accent: "#7a5c3e", accentDark: "#c9a37a",
      background: "#fbf8f3", backgroundDark: "#171512",
      foreground: "#231f1a", foregroundDark: "#efe9df",
    },
    fontPair: "dm-serif-dm-sans",
    typeScale: "display",
    radius: "subtle",
    borderWidth: "hairline",
    shadow: "soft",
    density: "airy",
    container: "narrow",
    divider: "gradient",
    linkHover: "underline",
    motion: "fade",
  },
  // Dots on the right, opposite where a rail would sit.
  nav: {
    variant: "dot-rail",
    labelStyle: "dot",
    showLogo: false,
    showThemeToggle: true,
    blurOnScroll: false,
    side: "right",
    mobileBehavior: "hamburger",
  },
  background: { light: { kind: "none" }, dark: { kind: "none" }, sameInBoth: true },
  colorScheme: "auto",
  footer: "minimal",
};
