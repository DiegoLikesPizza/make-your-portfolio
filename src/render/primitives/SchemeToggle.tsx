"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Reads the scheme straight off the portfolio root's data attribute, which is
 * the source of truth (the server sets it from `design.colorScheme`).
 * useSyncExternalStore keeps that hydration-safe without a setState-in-effect.
 */
const ROOT = "[data-portfolio-root]";

function subscribe(cb: () => void) {
  const el = document.querySelector(ROOT);
  if (!el) return () => {};
  const observer = new MutationObserver(cb);
  observer.observe(el, { attributes: true, attributeFilter: ["data-scheme"] });
  return () => observer.disconnect();
}

function current(): string {
  return document.querySelector(ROOT)?.getAttribute("data-scheme") ?? "light";
}

/** "auto" resolves against the OS only on the client. */
function effective(scheme: string): "light" | "dark" {
  if (scheme === "auto") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return scheme === "dark" ? "dark" : "light";
}

export function SchemeToggle() {
  const scheme = useSyncExternalStore(subscribe, current, () => "light");

  const toggle = () => {
    const el = document.querySelector(ROOT);
    if (!el) return;
    const next = effective(el.getAttribute("data-scheme") ?? "light") === "dark" ? "light" : "dark";
    el.setAttribute("data-scheme", next);
    try {
      localStorage.setItem("portfolio-scheme", next);
    } catch {
      /* private mode — the choice just doesn't persist */
    }
  };

  const isDark = scheme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-[var(--border-color)] text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
