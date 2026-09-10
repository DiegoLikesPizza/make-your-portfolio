"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { PortfolioDoc } from "@/lib/schema/portfolio";
import type { Section, SectionType } from "@/lib/schema/sections";
import { variantLabel } from "@/lib/catalog";
import { move, SECTION_LABELS } from "./options";
import { SortableRow } from "./SortableRow";
import { RowMenu } from "./RowMenu";
import { LayoutPicker } from "./LayoutPicker";
import { blankSection } from "./blank";

/**
 * The left rail: the page as an ordered list of sections.
 *
 * Reordering is what makes a one-pager feel like a page rather than a form, so
 * every row carries move, duplicate, hide, convert and delete — now behind one
 * menu rather than five unlabelled glyphs.
 *
 * Layout lives here too, not in the section's settings pane. Which layout a
 * section uses is a property of the section the way its position is, and the
 * settings pane is for its content. "Convert" also names the operation
 * honestly: every variant of a type consumes the same data, so changing one is
 * a re-render, never a migration.
 */
export function SectionList({
  doc, sections, selected, onSelect, onChange,
}: {
  doc: PortfolioDoc;
  sections: Section[];
  selected: string;
  onSelect: (id: string) => void;
  onChange: (sections: Section[]) => void;
}) {
  const [picker, setPicker] = useState<{ mode: "add" } | { mode: "convert"; id: string } | null>(null);

  // A small activation distance keeps a click-to-select from starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.id === active.id);
    const to = sections.findIndex((s) => s.id === over.id);
    if (from !== -1 && to !== -1) onChange(move([...sections], from, to));
  };

  const uniqueSlug = (base: string) => {
    const taken = new Set(sections.map((s) => s.slug));
    if (!taken.has(base)) return base;
    let i = 2;
    while (taken.has(`${base}-${i}`)) i += 1;
    return `${base}-${i}`;
  };

  const add = (type: SectionType, variant: string) => {
    const section = { ...blankSection(type, uniqueSlug(type)), variant } as Section;
    onChange([...sections, section]);
    onSelect(section.id);
    setPicker(null);
  };

  const convert = (id: string, variant: string) => {
    onChange(sections.map((s) => (s.id === id ? ({ ...s, variant } as Section) : s)));
    setPicker(null);
  };

  const duplicate = (index: number) => {
    const source = sections[index];
    const copy: Section = {
      ...structuredClone(source),
      id: nanoid(8),
      slug: uniqueSlug(source.slug),
    };
    const next = [...sections];
    next.splice(index + 1, 0, copy);
    onChange(next);
    onSelect(copy.id);
  };

  const converting = picker?.mode === "convert" ? sections.find((s) => s.id === picker.id) : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={() => onSelect("profile")}
          className={row(selected === "profile")}
        >
          <span className="truncate">Profile &amp; hero</span>
        </button>

        {/* A fixed id keeps dnd-kit's aria-describedby ids stable across the
            server and client renders; without one it counts up from a module
            global and every reload logs a hydration mismatch. */}
        <DndContext id="section-list" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section, i) => (
              <SortableRow key={section.id} id={section.id} className={row(selected === section.id, true)}>
                <button type="button" onClick={() => onSelect(section.id)} className="min-w-0 flex-1 truncate text-left">
                  <span className={section.hidden ? "text-neutral-400 line-through dark:text-neutral-500" : undefined}>
                    {section.title || SECTION_LABELS[section.type]}
                  </span>
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {variantLabel(section.variant)}
                  </span>
                </button>

                <RowMenu
                  label={`Options for ${section.title || SECTION_LABELS[section.type]}`}
                  items={[
                    { label: "Move up", disabled: i === 0, onSelect: () => onChange(move([...sections], i, i - 1)) },
                    {
                      label: "Move down",
                      disabled: i === sections.length - 1,
                      onSelect: () => onChange(move([...sections], i, i + 1)),
                    },
                    { label: "Change layout…", onSelect: () => setPicker({ mode: "convert", id: section.id }) },
                    { label: "Duplicate", onSelect: () => duplicate(i) },
                    {
                      label: section.hidden ? "Show" : "Hide",
                      onSelect: () => onChange(sections.map((s, j) => (j === i ? { ...s, hidden: !s.hidden } : s))),
                    },
                    {
                      label: "Delete",
                      danger: true,
                      onSelect: () => onChange(sections.filter((_, j) => j !== i)),
                    },
                  ]}
                />
              </SortableRow>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setPicker({ mode: "add" })}
          className="w-full rounded-lg border border-dashed border-neutral-300 py-2 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-100 dark:hover:text-neutral-50"
        >
          + Add section
        </button>
      </div>

      {picker?.mode === "add" && (
        <LayoutPicker mode="add" doc={doc} onClose={() => setPicker(null)} onPick={add} />
      )}
      {converting && (
        <LayoutPicker
          mode="convert"
          doc={doc}
          section={converting}
          onClose={() => setPicker(null)}
          onPick={(_type, variant) => convert(converting.id, variant)}
        />
      )}
    </div>
  );
}

const row = (active: boolean, flex = false) =>
  [
    "w-full rounded-md px-2.5 py-2 text-sm transition-colors",
    flex ? "flex items-center gap-2" : "block text-left",
    active
      ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
      : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
  ].join(" ");
