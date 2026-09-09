"use client";

import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * One draggable row.
 *
 * The drag handle is a separate button rather than the whole row, so clicking a
 * section still selects it, and dnd-kit's keyboard sensor makes the same
 * reorder reachable without a mouse.
 */
export function SortableRow({
  id, className, children,
}: {
  id: string;
  className: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${className} ${isDragging ? "relative z-10 opacity-80 shadow-md" : ""}`}
    >
      <button
        type="button"
        aria-label="Reorder section"
        className="shrink-0 cursor-grab px-0.5 text-xs opacity-40 hover:opacity-80 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      {children}
    </div>
  );
}
