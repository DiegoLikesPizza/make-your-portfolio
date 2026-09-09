import type { Design } from "@/lib/schema/portfolio";

/**
 * "Editorial" — the design system of lfdiego.xyz, expressed as tokens.
 *
 * Warm paper-white canvas, near-black ink, one confident vermilion accent used
 * sparingly. Ported rather than invented, so the token layer is proven against
 * a real design instead of a mockup.
 */
export const editorial: Design = {
  preset: "editorial",
  tokens: {
    palette: {
      accent: "#d4451f",
      accentDark: "#f0613d",
      background: "#fafaf7",
      backgroundDark: "#15140f",
      foreground: "#141414",
      foregroundDark: "#f3f0e7",
    },
    fontPair: "grotesk-inter-jetbrains",
    typeScale: "normal",
    radius: "soft",
    borderWidth: "hairline",
    shadow: "soft",
    density: "normal",
    container: "normal",
    divider: "line",
    linkHover: "wipe",
    motion: "rise",
  },
  nav: {
    variant: "top-fixed",
    labelStyle: "text",
    showLogo: true,
    showThemeToggle: true,
    blurOnScroll: true,
  },
  background: {
    light: { kind: "none" },
    dark: { kind: "none" },
    sameInBoth: true,
  },
  colorScheme: "auto",
  footer: "minimal",
};
