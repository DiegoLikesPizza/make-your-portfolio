"use client";

import { useState } from "react";
import { Field, inputClass } from "./fields";

/**
 * Text fields that edit a *list* — "React, TypeScript" or one highlight per
 * line.
 *
 * These used to render `items.join(", ")` straight back into the input and
 * re-parse on every keystroke. That makes the input lossy against itself: the
 * moment you type the space in `React, ` the parser trims it away, the joined
 * string comes back one character shorter, and the caret jumps. Pressing Enter
 * in a one-per-line field was worse — the empty line was filtered out before it
 * could ever hold a character, so the key appeared dead.
 *
 * The fix is to stop deriving what is displayed. The raw text is the state
 * here; the parsed list is what leaves. Props only re-seed the buffer when the
 * value that arrives is something this field did not produce — which is how an
 * outside edit (loading a preset, switching sections) still lands, while your
 * own typing never round-trips.
 */

type Props = {
  label: string;
  value: readonly string[];
  onChange: (parts: string[]) => void;
  hint?: string;
  placeholder?: string;
};

function sameList(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

const parseComma = (text: string) => text.split(",").map((t) => t.trim()).filter(Boolean);
const parseLines = (text: string) => text.split("\n").map((t) => t.trim()).filter(Boolean);

/** The raw text buffer, plus a setter that also publishes the parsed list. */
function useTextState(
  value: readonly string[],
  parse: (text: string) => string[],
  serialize: (parts: readonly string[]) => string,
  onChange: (parts: string[]) => void,
): [string, (next: string) => void] {
  const [text, setText] = useState(() => serialize(value));

  // React's "adjust state during render" pattern rather than an effect: the
  // corrected text is in place before anything paints, and there is no extra
  // frame in which the field shows the stale string. Our own keystrokes always
  // come back parse-equal, so this only fires when something *else* changed the
  // list — loading a preset, switching section, an autosave conflict reload.
  if (!sameList(parse(text), value)) setText(serialize(value));

  return [text, (next: string) => { setText(next); onChange(parse(next)); }];
}

/** One line of comma-separated values: tech stacks, skills in a group. */
export function CommaListInput({ label, value, onChange, hint, placeholder }: Props) {
  const [text, setText] = useTextState(value, parseComma, (parts) => parts.join(", "), onChange);
  return (
    <Field label={label} hint={hint ?? "Comma separated."}>
      <input
        className={inputClass}
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
      />
    </Field>
  );
}

/** One item per line: role highlights. */
export function LineListInput({
  label, value, onChange, hint, placeholder, rows = 4,
}: Props & { rows?: number }) {
  const [text, setText] = useTextState(value, parseLines, (parts) => parts.join("\n"), onChange);
  return (
    <Field label={label} hint={hint ?? "One per line."}>
      <textarea
        className={inputClass}
        rows={rows}
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
      />
    </Field>
  );
}

/**
 * Re-key a list of `{ id, ... }` records against freshly typed strings.
 *
 * Ids stay put by position so React keys — and anything else keyed off the id —
 * don't churn on every keystroke. Only genuinely new entries get a new id.
 */
export function keepIds<T extends { id: string }>(
  existing: readonly T[],
  parts: string[],
  make: (text: string, id: string) => T,
  newId: () => string,
): T[] {
  return parts.map((text, i) => make(text, existing[i]?.id ?? newId()));
}
