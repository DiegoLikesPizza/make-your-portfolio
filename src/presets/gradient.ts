import type { Design } from "@/lib/schema/portfolio";

/** A soft gradient ground with a floating nav — the most "product" of the set. */
export const gradient: Design = {
  preset: "gradient",
  tokens: {
    palette: {
      accent: "#6d5efc", accentDark: "#9d92ff",
      background: "#fbfbff", backgroundDark: "#0e0e1a",
      foreground: "#16162b", foregroundDark: "#ececf7",
    },
    fontPair: "manrope-manrope-mono",
    typeScale: "normal",
    radius: "round",
    borderWidth: "hairline",
    shadow: "soft",
    density: "normal",
    container: "normal",
    divider: "none",
    linkHover: "wipe",
    motion: "rise",
  },
  nav: { variant: "side-floating-pill", labelStyle: "text", showLogo: false, showThemeToggle: true, blurOnScroll: true },
  background: {
    light: {
      kind: "gradient", type: "linear", angle: 160,
      stops: [{ color: "#fbfbff", pos: 0 }, { color: "#eeeaff", pos: 55 }, { color: "#ffeef6", pos: 100 }],
    },
    dark: {
      kind: "gradient", type: "linear", angle: 160,
      stops: [{ color: "#0e0e1a", pos: 0 }, { color: "#1a1733", pos: 60 }, { color: "#251a2e", pos: 100 }],
    },
    sameInBoth: false,
  },
  colorScheme: "auto",
  footer: "columns",
};
