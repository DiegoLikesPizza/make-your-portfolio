"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A button that asks once before it acts.
 *
 * For actions that take something public down but can be undone — taking a
 * site offline, removing a domain. Deletion asks for a typed confirmation
 * instead, because it can't be undone; these only need a second, deliberate
 * click. The question replaces the button in place, so the confirming click
 * lands on words the user has just read rather than on a dialog somewhere else.
 *
 * It backs out on Cancel, on Escape, and after a few seconds of nothing: a
 * primed button left sitting on screen is a single click again. Focus moves to
 * Cancel, so a repeated keypress backs out rather than confirming.
 */

const DISARM_AFTER_MS = 6000;

export function ConfirmButton({
  label,
  question,
  confirmLabel,
  pending = false,
  pendingLabel,
  onConfirm,
  className,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  /** The action is running; the button is shown disabled. */
  pending?: boolean;
  pendingLabel?: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) return;
    cancelRef.current?.focus();

    const timer = setTimeout(() => setArmed(false), DISARM_AFTER_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setArmed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [armed]);

  if (pending || !armed) {
    return (
      <button type="button" disabled={pending} onClick={() => setArmed(true)} className={className}>
        {pending ? (pendingLabel ?? label) : label}
      </button>
    );
  }

  return (
    <span role="group" aria-label={question} className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm text-neutral-700 dark:text-neutral-300">{question}</span>
      <button
        type="button"
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        {confirmLabel}
      </button>
      <button
        ref={cancelRef}
        type="button"
        onClick={() => setArmed(false)}
        className="text-sm text-neutral-500 underline-offset-4 hover:underline"
      >
        Cancel
      </button>
    </span>
  );
}
