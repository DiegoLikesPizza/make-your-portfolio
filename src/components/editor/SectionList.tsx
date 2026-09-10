"use client";

import { nanoid } from "nanoid";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Section, SectionType } from "@/lib/schema/sections";
import { addableTypes, move, SECTION_LABELS } from "./options";
import { SortableRow } from "./SortableRow";
import { implementedVariants } from "@/variants/registry";
import { blankSection } from "./blank";

/**
 * The left rail: the page as an ordered list of sections.
 *
 * Reordering is what makes a one-pager feel like a page rather than a form, so
 * every row carries move, duplicate, hide and delete.
 */
export function SectionList({
  sections, selected, onSelect, onChange,
}: {
  sections: Section[];
  selected: string;
  onSelect: (id: string) => void;
  onChange: (sections: Section[]) => void;
}) {
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

  const add = (type: SectionType) => {
    const section = blankSection(type, uniqueSlug(type));
    onChange([...sections, section]);
    onSelect(section.id);
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
              <span className="ml-2 text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{section.variant}</span>
            </button>
            <div className="flex shrink-0 items-center gap-0.5">
              <Mini label="Move up" disabled={i === 0} onClick={() => onChange(move([...sections], i, i - 1))}>↑</Mini>
              <Mini label="Move down" disabled={i === sections.length - 1} onClick={() => onChange(move([...sections], i, i + 1))}>↓</Mini>
              <Mini label="Duplicate" onClick={() => duplicate(i)}>⧉</Mini>
              <Mini
                label={section.hidden ? "Show" : "Hide"}
                onClick={() => onChange(sections.map((s, j) => (j === i ? { ...s, hidden: !s.hidden } : s)))}
              >
                {section.hidden ? "○" : "●"}
              </Mini>
              <Mini label="Delete" onClick={() => onChange(sections.filter((_, j) => j !== i))}>✕</Mini>
            </div>
          </SortableRow>
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">Add section</label>
        <select
          className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:focus:border-neutral-100"
          value=""
          onChange={(e) => e.target.value && add(e.target.value as SectionType)}
        >
          <option value="">Choose a type…</option>
          {addableTypes().map((t) => (
            <option key={t} value={t}>
              {SECTION_LABELS[t]} ({implementedVariants(t).length} layouts)
            </option>
          ))}
        </select>
      </div>
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

function Mini({
  label, onClick, disabled, children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-5 w-5 rounded text-[10px] opacity-60 transition-opacity hover:opacity-100 disabled:opacity-20"
    >
      {children}
    </button>
  );
}
