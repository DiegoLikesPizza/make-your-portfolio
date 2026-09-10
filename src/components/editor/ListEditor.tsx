"use client";

import type { ReactNode } from "react";
import { AddButton, ItemCard } from "./fields";
import { move } from "./options";

/**
 * A repeatable list with add, remove and reorder.
 *
 * Generic over the item so every section form reuses it instead of each one
 * reimplementing add/remove/move — which is exactly where off-by-one reorder
 * bugs come from.
 */
export function ListEditor<T extends { id: string }>({
  label, items, onChange, create, title, render, hint,
}: {
  label: string;
  items: readonly T[];
  onChange: (items: T[]) => void;
  /**
   * NoInfer matters here: without it a `create()` that omits optional fields
   * narrows T, and every optional field then looks missing inside `render`.
   * The list's own item type is the only thing that should decide T.
   */
  create: () => NoInfer<T>;
  title: (item: T) => string;
  render: (item: T, update: (patch: Partial<T>) => void) => ReactNode;
  hint?: string;
}) {
  const update = (index: number, patch: Partial<T>) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-400">{label}s</span>
        {hint && <span className="text-right text-xs text-neutral-400 dark:text-neutral-500">{hint}</span>}
      </div>
      {items.map((item, i) => (
        <ItemCard
          key={item.id}
          title={title(item)}
          onRemove={() => onChange(items.filter((_, j) => j !== i))}
          onMoveUp={i > 0 ? () => onChange(move([...items], i, i - 1)) : undefined}
          onMoveDown={i < items.length - 1 ? () => onChange(move([...items], i, i + 1)) : undefined}
        >
          {render(item, (patch) => update(i, patch))}
        </ItemCard>
      ))}
      <AddButton label={`Add ${label.toLowerCase()}`} onClick={() => onChange([...items, create()])} />
    </div>
  );
}
