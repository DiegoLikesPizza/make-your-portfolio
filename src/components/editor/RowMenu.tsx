"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The three-dot menu on a section row.
 *
 * The row used to carry five icon buttons: two arrows, a duplicate glyph, a
 * filled-or-hollow circle for visibility and an ✕. At 20px each, in a 256px
 * rail, next to a title that also needs room — none of them were labelled, and
 * the destructive one sat a few pixels from the one you press most.
 *
 * One button, a menu with words in it, and Delete separated at the bottom.
 */

export type MenuItem = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Rendered apart from the rest, in red. */
  danger?: boolean;
};

export function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    // `pointerdown` rather than `click`: a click on another row's trigger would
    // otherwise open that menu and close this one in the same gesture, and the
    // order of those two is not guaranteed.
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const normal = items.filter((i) => !i.danger);
  const danger = items.filter((i) => i.danger);

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-6 w-6 rounded text-sm leading-none opacity-60 transition-opacity hover:opacity-100"
      >
        ⋯
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-7 z-30 w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          {normal.map((item) => (
            <Item key={item.label} item={item} close={() => setOpen(false)} />
          ))}
          {danger.length > 0 && <hr className="my-1 border-neutral-200 dark:border-neutral-800" />}
          {danger.map((item) => (
            <Item key={item.label} item={item} close={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Item({ item, close }: { item: MenuItem; close: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onClick={() => {
        close();
        item.onSelect();
      }}
      className={`block w-full px-3 py-1.5 text-left text-sm transition-colors disabled:opacity-30 ${
        item.danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
          : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {item.label}
    </button>
  );
}
