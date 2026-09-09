import type { Design } from "@/lib/schema/portfolio";

/** Neutral, quiet, no ornament. The safest starting point. */
export const minimal: Design = {
  preset: "minimal",
  tokens: {
    palette: {
      accent: "#1f1f1f", accentDark: "#f5f5f5",
      background: "#ffffff", backgroundDark: "#0b0b0b",
      foreground: "#111111", foregroundDark: "#f2f2f2",
    },
    fontPair: "inter-inter-jetbrains",
    typeScale: "normal",
    radius: "subtle",
    borderWidth: "hairline",
    shadow: "none",
    density: "airy",
    container: "narrow",
    divider: "space",
    linkHover: "underline",
    motion: "fade",
  },
  nav: { variant: "top-static", labelStyle: "text", showLogo: false, showThemeToggle: true, blurOnScroll: false },
  background: { light: { kind: "none" }, dark: { kind: "none" }, sameInBoth: true },
  colorScheme: "auto",
  footer: "minimal",
};
