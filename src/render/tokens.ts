import type { Tokens } from "@/lib/schema/tokens";

/**
 * Tokens -> CSS custom properties.
 *
 * lfdiego.xyz already proved the approach: every colour, radius and shadow is a
 * variable, so re-theming the whole page is a matter of swapping variables and
 * no component ever needs a `dark:` utility. Here the variables come from the
 * user's tokens instead of being hardcoded.
 */

const RADIUS: Record<Tokens["radius"], string> = {
  sharp: "0px",
  subtle: "4px",
  soft: "10px",
  round: "18px",
  pill: "999px",
};

const BORDER: Record<Tokens["borderWidth"], string> = {
  none: "0px",
  hairline: "1px",
  thin: "1.5px",
  thick: "2px",
};

const SHADOW: Record<Tokens["shadow"], { light: string; dark: string }> = {
  none: { light: "none", dark: "none" },
  soft: {
    light: "0 1px 2px rgba(20,20,20,.04), 0 10px 30px rgba(20,20,20,.06)",
    dark: "0 1px 2px rgba(0,0,0,.3), 0 10px 30px rgba(0,0,0,.45)",
  },
  hard: {
    light: "4px 4px 0 var(--foreground)",
    dark: "4px 4px 0 var(--foreground)",
  },
};

/** Vertical rhythm between sections, and the gap inside them. */
const DENSITY: Record<Tokens["density"], { section: string; gap: string }> = {
  compact: { section: "4rem", gap: "1.5rem" },
  normal: { section: "6rem", gap: "2.5rem" },
  airy: { section: "9rem", gap: "4rem" },
};

const CONTAINER: Record<Tokens["container"], string> = {
  narrow: "780px",
  normal: "1100px",
  wide: "1400px",
  full: "100%",
};

/** Multiplier applied to the fluid `clamp()` type scale. */
const TYPE_SCALE: Record<Tokens["typeScale"], string> = {
  tight: "0.85",
  normal: "1",
  display: "1.25",
};

/**
 * Font stacks for each curated pairing: [heading, body, mono].
 *
 * These are `next/font` CSS variables, not family names — next/font emits a
 * hashed family, so naming "Space Grotesk" directly would silently fall back to
 * system-ui. A pairing may only reference a variable declared in the root
 * layout; a test asserts that.
 */
const FONT_PAIRS: Record<Tokens["fontPair"], [string, string, string]> = {
  "grotesk-inter-jetbrains": ["--font-space-grotesk", "--font-inter", "--font-jetbrains-mono"],
  "inter-inter-jetbrains": ["--font-inter", "--font-inter", "--font-jetbrains-mono"],
  "playfair-inter-jetbrains": ["--font-playfair", "--font-inter", "--font-jetbrains-mono"],
  "manrope-manrope-mono": ["--font-manrope", "--font-manrope", "--font-space-mono"],
  "dm-serif-dm-sans": ["--font-dm-serif", "--font-dm-sans", "--font-jetbrains-mono"],
  "space-space-space": ["--font-space-grotesk", "--font-space-grotesk", "--font-space-mono"],
  "libre-source-ibm": ["--font-libre", "--font-source-sans", "--font-ibm-mono"],
  "bricolage-inter-mono": ["--font-bricolage", "--font-inter", "--font-jetbrains-mono"],
};

/** Mix a hex colour toward another by `amount` (0..1). Used for derived ramps. */
function mix(hex: string, toward: string, amount: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(toward);
  const c = (a: number, b: number) => Math.round(a + (b - a) * amount);
  return `#${[c(r1, r2), c(g1, g2), c(b1, b2)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * A full colour ramp derived from the three colours the user actually picks.
 * Asking for six greys would be a worse product; deriving them keeps the
 * editor to accent / background / foreground per scheme.
 */
function schemeVars(accent: string, background: string, foreground: string) {
  return {
    "--background": background,
    "--background-secondary": mix(background, foreground, 0.05),
    "--surface": mix(background, foreground, 0.02),
    "--surface-hover": mix(background, foreground, 0.06),
    "--foreground": foreground,
    "--foreground-muted": mix(foreground, background, 0.35),
    "--foreground-subtle": mix(foreground, background, 0.5),
    "--border-color": mix(background, foreground, 0.12),
    "--accent": accent,
    "--accent-hover": mix(accent, foreground, 0.2),
    "--accent-soft": rgba(accent, 0.1),
    "--accent-foreground": mix(background, accent, 0.02),
  };
}

const declarations = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n");

/**
 * Emit the stylesheet for one document's tokens, scoped to `scope`.
 *
 * Every value originates in an enum or a validated hex colour, so no user input
 * ever reaches this string unescaped.
 */
export function tokensToCss(tokens: Tokens, scope = ".portfolio"): string {
  const { palette: p } = tokens;
  const [heading, body, mono] = FONT_PAIRS[tokens.fontPair];
  const shadow = SHADOW[tokens.shadow];
  const dens = DENSITY[tokens.density];

  const shared = {
    "--radius": RADIUS[tokens.radius],
    "--border-width": BORDER[tokens.borderWidth],
    "--section-space": dens.section,
    "--gap": dens.gap,
    "--container": CONTAINER[tokens.container],
    "--type-scale": TYPE_SCALE[tokens.typeScale],
    "--font-heading": `var(${heading}), system-ui, sans-serif`,
    "--font-body": `var(${body}), system-ui, sans-serif`,
    "--font-mono": `var(${mono}), ui-monospace, monospace`,
  };

  const dark = declarations({
    ...schemeVars(p.accentDark, p.backgroundDark, p.foregroundDark),
    "--shadow": shadow.dark,
  });

  return [
    `${scope} {`,
    declarations({ ...shared, ...schemeVars(p.accent, p.background, p.foreground), "--shadow": shadow.light }),
    "  color-scheme: light;",
    "}",
    // An explicit choice — the site is dark, or the visitor used the toggle.
    `${scope}[data-scheme="dark"] {`,
    dark,
    "  color-scheme: dark;",
    "}",
    // "auto": follow the visitor's OS until they touch the toggle, which
    // rewrites data-scheme to an explicit value and takes this block out of play.
    "@media (prefers-color-scheme: dark) {",
    `  ${scope}[data-scheme="auto"] {`,
    dark,
    "    color-scheme: dark;",
    "  }",
    "}",
    // Background layers switch on exactly the same three conditions. Kept here
    // rather than as utility classes so "auto + OS dark" cannot be forgotten.
    `${scope} [data-bg="dark"] { opacity: 0; }`,
    `${scope}[data-scheme="dark"] [data-bg="light"] { opacity: 0; }`,
    `${scope}[data-scheme="dark"] [data-bg="dark"] { opacity: 1; }`,
    "@media (prefers-color-scheme: dark) {",
    `  ${scope}[data-scheme="auto"] [data-bg="light"] { opacity: 0; }`,
    `  ${scope}[data-scheme="auto"] [data-bg="dark"] { opacity: 1; }`,
    "}",
  ].join("\n");
}

export const FONT_FAMILIES = FONT_PAIRS;
