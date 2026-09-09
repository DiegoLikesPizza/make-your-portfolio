import { z } from "zod";
import { hexColor } from "./tokens";

/**
 * Backgrounds appear at site level and, optionally, per section.
 *
 * Two constraints shape this type:
 *  - Legibility. Image, animated and gradient backgrounds carry a mandatory
 *    overlay whose opacity has a floor, and the editor contrast-checks the
 *    foreground against the result before publish.
 *  - Weight. A raw GIF background is a performance disaster, so `animated`
 *    references an Asset that upload transcoded to mp4 + animated webp.
 */

export const overlay = z.object({
  color: hexColor,
  /** Floored at 0.2 for media backgrounds so text never sits on bare imagery. */
  opacity: z.number().min(0).max(1),
});

export const gradientStop = z.object({
  color: hexColor,
  /** Percentage along the gradient. */
  pos: z.number().min(0).max(100),
});

const imageFields = {
  assetId: z.string(),
  fit: z.enum(["cover", "contain", "tile"]),
  position: z.enum([
    "center",
    "top",
    "bottom",
    "left",
    "right",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ]),
  overlay,
  blur: z.number().min(0).max(24),
  parallax: z.boolean(),
};

export const background = z.discriminatedUnion("kind", [
  /** Inherit from the site (sections) or paint nothing (site). */
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("solid"), color: hexColor }),
  z.object({
    kind: z.literal("gradient"),
    type: z.enum(["linear", "radial", "conic"]),
    angle: z.number().min(0).max(360),
    stops: z.array(gradientStop).min(2).max(6),
  }),
  z.object({ kind: z.literal("image"), ...imageFields }),
  z.object({ kind: z.literal("animated"), ...imageFields }),
  z.object({
    kind: z.literal("pattern"),
    style: z.enum(["dots", "grid", "noise", "topo", "stripes"]),
    color: hexColor,
    scale: z.number().min(1).max(10),
    opacity: z.number().min(0).max(1),
  }),
]);

/**
 * Backgrounds can differ between colour schemes. `sameInBoth` is explicit
 * rather than inferred, so a user who wants one gradient in both modes says so
 * and stops being asked.
 */
export const backgroundConfig = z.object({
  light: background,
  dark: background,
  sameInBoth: z.boolean(),
});

export type Background = z.infer<typeof background>;
export type BackgroundConfig = z.infer<typeof backgroundConfig>;

export const NO_BACKGROUND: BackgroundConfig = {
  light: { kind: "none" },
  dark: { kind: "none" },
  sameInBoth: true,
};

/** Media backgrounds must keep enough contrast for text to survive. */
export const MIN_MEDIA_OVERLAY_OPACITY = 0.2;
