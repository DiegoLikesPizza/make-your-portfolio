import { z } from "zod";

/**
 * Design tokens — layer 3 of shell / sections / tokens.
 *
 * Every value is an enum or a clamped number, never free-form CSS. That is what
 * makes "maximum customization" safe: a tampered document can change which of
 * our values is used, but can never inject a declaration of its own.
 */

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a 6-digit hex colour like #d4451f");

export const radiusScale = z.enum(["sharp", "subtle", "soft", "round", "pill"]);
export const borderWidth = z.enum(["none", "hairline", "thin", "thick"]);
export const shadowStyle = z.enum(["none", "soft", "hard"]);
export const density = z.enum(["compact", "normal", "airy"]);
export const containerWidth = z.enum(["narrow", "normal", "wide", "full"]);
export const dividerStyle = z.enum(["none", "line", "space", "number", "gradient"]);
export const typeScale = z.enum(["tight", "normal", "display"]);
export const linkHover = z.enum(["none", "underline", "wipe", "highlight"]);
export const motionStyle = z.enum(["none", "fade", "rise", "stagger"]);

/** Curated, self-hosted pairings. Users pick a pair, never a raw font name. */
export const fontPair = z.enum([
  "grotesk-inter-jetbrains", // lfdiego.xyz
  "inter-inter-jetbrains",
  "playfair-inter-jetbrains",
  "manrope-manrope-mono",
  "dm-serif-dm-sans",
  "space-space-space",
  "libre-source-ibm",
  "bricolage-inter-mono",
]);

/** A light/dark pair of the colours that actually differ between schemes. */
export const palette = z.object({
  accent: hexColor,
  accentDark: hexColor,
  background: hexColor,
  backgroundDark: hexColor,
  foreground: hexColor,
  foregroundDark: hexColor,
});

export const tokens = z.object({
  palette,
  fontPair,
  typeScale,
  radius: radiusScale,
  borderWidth,
  shadow: shadowStyle,
  density,
  container: containerWidth,
  divider: dividerStyle,
  linkHover,
  motion: motionStyle,
});

export type Tokens = z.infer<typeof tokens>;
export type Palette = z.infer<typeof palette>;
