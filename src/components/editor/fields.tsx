"use client";

import type { ReactNode } from "react";

/**
 * Editor form primitives.
 *
 * Deliberately small and uncontrolled-free: every field is controlled by the
 * document in EditorApp state, because the live preview has to reflect a
 * keystroke immediately and a form library's internal state would be a second
 * source of truth to keep in sync.
 */

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900";

export function TextInput({
  label, value, onChange, placeholder, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function TextArea({
  label, value, onChange, rows = 4, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea className={inputClass} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function Select<T extends string>({
  label, value, options, onChange, hint,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-neutral-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`h-5 w-9 shrink-0 rounded-full transition-colors ${value ? "bg-neutral-900" : "bg-neutral-300"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${value ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded border border-neutral-300 bg-white p-1"
        />
        <input
          className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs uppercase outline-none focus:border-neutral-900"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

/** A titled group of fields for one item in a repeatable list. */
export function ItemCard({
  title, onRemove, onMoveUp, onMoveDown, children,
}: {
  title: string;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-neutral-700">{title}</span>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton label="Move up" onClick={onMoveUp} disabled={!onMoveUp}>↑</IconButton>
          <IconButton label="Move down" onClick={onMoveDown} disabled={!onMoveDown}>↓</IconButton>
          <IconButton label="Remove" onClick={onRemove}>✕</IconButton>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function IconButton({
  label, onClick, disabled, children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="h-6 w-6 rounded border border-neutral-200 bg-white text-xs text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-dashed border-neutral-300 py-2 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900"
    >
      + {label}
    </button>
  );
}
