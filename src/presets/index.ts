import type { Design } from "@/lib/schema/portfolio";
import { editorial } from "./editorial";
import { minimal } from "./minimal";
import { terminal } from "./terminal";
import { brutalist } from "./brutalist";
import { serif } from "./serif";
import { gradient } from "./gradient";

/**
 * A preset is just a starting `design` — a tested bundle of shell, tokens, nav
 * and background. Loading one replaces those values; the user is free to change
 * every one of them afterwards, and nothing tracks which parts they changed.
 *
 * Between them these six cover every nav variant, every radius, both shadow
 * styles and all three colour-scheme modes, so the token layer is exercised by
 * real combinations rather than by one house style.
 */
export const PRESETS: Record<string, { label: string; description: string; design: Design }> = {
  editorial: {
    label: "Editorial",
    description: "Warm paper, near-black ink, one vermilion accent. Quiet and typographic.",
    design: editorial,
  },
  minimal: {
    label: "Minimal",
    description: "Neutral and roomy, no ornament. The safest starting point.",
    design: minimal,
  },
  serif: {
    label: "Serif",
    description: "Warm serif headings and generous spacing. Reads like print.",
    design: serif,
  },
  gradient: {
    label: "Gradient",
    description: "Soft gradient ground, rounded corners, floating side nav.",
    design: gradient,
  },
  terminal: {
    label: "Terminal",
    description: "Monospace on a dark grid, green accent, side rail.",
    design: terminal,
  },
  brutalist: {
    label: "Brutalist",
    description: "Sharp corners, hard shadows, oversized type. Loud on purpose.",
    design: brutalist,
  },
};

export const DEFAULT_PRESET = "editorial";
