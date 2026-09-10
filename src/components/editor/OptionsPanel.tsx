"use client";

import type { Section } from "@/lib/schema/sections";
import { OPTION_FIELDS, optionsFor, option } from "@/lib/variant-options";
import { Select, Toggle } from "./fields";
import { variantLabel } from "@/lib/catalog";

/**
 * The settings that belong to the chosen layout rather than to the section.
 *
 * Rendered from the layout's own list, so the panel is empty for layouts that
 * genuinely have no choice to make — which is most of them. A row of controls
 * that don't change anything teaches people to stop reading the panel.
 */
export function OptionsPanel({ section, onChange }: { section: Section; onChange: (next: Section) => void }) {
  const keys = optionsFor(section.type, section.variant);
  if (keys.length === 0) return null;

  const set = (patch: Partial<NonNullable<Section["options"]>>) =>
    onChange({ ...section, options: { ...section.options, ...patch } } as Section);

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 dark:text-neutral-50">
        {variantLabel(section.variant)} settings
      </h3>

      {keys.map((key) => {
        const field = OPTION_FIELDS[key];

        if (field.kind === "toggle") {
          return (
            <Toggle
              key={key}
              label={field.label}
              value={option(section, key) as boolean}
              onChange={(v) => set({ [key]: v })}
            />
          );
        }

        return (
          <Select
            key={key}
            label={field.label}
            hint={field.hint}
            value={String(option(section, key))}
            options={field.values.map((v) => ({ value: v, label: v.replace(/-/g, " ") }))}
            onChange={(v) => set({ [key]: v })}
          />
        );
      })}
    </section>
  );
}
