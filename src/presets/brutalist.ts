import type { Design } from "@/lib/schema/portfolio";

/** Sharp corners, hard shadows, oversized type. Loud on purpose. */
export const brutalist: Design = {
  preset: "brutalist",
  tokens: {
    palette: {
      accent: "#ff4d00", accentDark: "#ff6a26",
      background: "#f5f2e8", backgroundDark: "#101010",
      foreground: "#0a0a0a", foregroundDark: "#f5f2e8",
    },
    fontPair: "bricolage-inter-mono",
    typeScale: "display",
    radius: "sharp",
    borderWidth: "thick",
    shadow: "hard",
    density: "normal",
    container: "wide",
    divider: "line",
    linkHover: "highlight",
    motion: "stagger",
  },
  nav: {
    variant: "bottom-dock",
    labelStyle: "text",
    showLogo: true,
    showThemeToggle: true,
    blurOnScroll: false,
    side: "left",
    mobileBehavior: "scroll",
  },
  background: {
    light: { kind: "pattern", style: "dots", color: "#d8d2c0", scale: 3, opacity: 0.8 },
    dark: { kind: "solid", color: "#101010" },
    sameInBoth: false,
  },
  colorScheme: "light",
  footer: "oversized-type",
};
