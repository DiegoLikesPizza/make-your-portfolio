"use client";

import { useEffect, useRef } from "react";
import { Field, inputClass } from "./fields";
import { MARKUP } from "@/lib/text";

/**
 * A text field for the strings that carry inline emphasis.
 *
 * Not a WYSIWYG surface. What is stored is still the plain string with its
 * markers in it — `I build ==fast==, reliable software` — because that string
 * is what the renderer, the preview, the published page and the OG description
 * all read, and a contenteditable would put a second representation between
 * them. The toolbar just wraps the selection so nobody has to learn the markers
 * to use them.
 *
 * Only the display strings get this: a hero sentence, an About lead, a contact
 * headline. Body copy doesn't, because emphasis scattered through a paragraph
 * is how a portfolio starts looking like a ransom note.
 */
export function RichTextArea({
  label, value, onChange, rows = 3, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Where the caret should land once React has re-rendered with the new value.
  const pending = useRef<[number, number] | null>(null);

  useEffect(() => {
    const range = pending.current;
    if (!range || !ref.current) return;
    pending.current = null;
    ref.current.focus();
    ref.current.setSelectionRange(range[0], range[1]);
  }, [value]);

  const wrap = (marker: string) => {
    const el = ref.current;
    if (!el) return;

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const selected = value.slice(start, end);

    // Pressing the button twice on the same words should undo, not double up.
    const alreadyMarked = selected.startsWith(marker) && selected.endsWith(marker) && selected.length > marker.length * 2;

    const replacement = alreadyMarked
      ? selected.slice(marker.length, -marker.length)
      : `${marker}${selected}${marker}`;

    pending.current = alreadyMarked
      ? [start, start + replacement.length]
      : // With nothing selected, put the caret between the markers so the next
        // keystroke lands inside them.
        [start + marker.length, start + marker.length + selected.length];

    onChange(value.slice(0, start) + replacement + value.slice(end));
  };

  return (
    <Field label={label} hint={hint}>
      <div className="mt-1.5 flex gap-1">
        {MARKUP.map((m) => (
          <button
            key={m.marker}
            type="button"
            title={m.title}
            aria-label={m.title}
            onClick={() => wrap(m.marker)}
            className={`h-6 w-6 rounded border border-neutral-200 bg-white text-xs text-neutral-600 transition-colors hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:text-white ${m.className}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        className={inputClass}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
