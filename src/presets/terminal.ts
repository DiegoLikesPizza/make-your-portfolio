import type { Design } from "@/lib/schema/portfolio";

/** Monospace, dark by default, green accent. Built for the terminal hero. */
export const terminal: Design = {
  preset: "terminal",
  tokens: {
    palette: {
      accent: "#3ddc84", accentDark: "#3ddc84",
      background: "#0d1117", backgroundDark: "#0d1117",
      foreground: "#e6edf3", foregroundDark: "#e6edf3",
    },
    fontPair: "space-space-space",
    typeScale: "tight",
    radius: "sharp",
    borderWidth: "hairline",
    shadow: "none",
    density: "compact",
    container: "normal",
    divider: "line",
    linkHover: "highlight",
    motion: "none",
  },
  nav: {
    variant: "side-left-rail",
    labelStyle: "numbered",
    showLogo: true,
    showThemeToggle: false,
    blurOnScroll: false,
    side: "left",
    mobileBehavior: "scroll",
  },
  background: {
    light: { kind: "pattern", style: "grid", color: "#1b2531", scale: 4, opacity: 0.5 },
    dark: { kind: "pattern", style: "grid", color: "#1b2531", scale: 4, opacity: 0.5 },
    sameInBoth: true,
  },
  colorScheme: "dark",
  footer: "minimal",
};
