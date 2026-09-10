import Link from "next/link";
import { SignOutButton } from "@/components/editor/SignOutButton";
import { ASSIST_ENABLED } from "@/lib/assist/generate";

/**
 * The frame around every dashboard page except the editor.
 *
 * The editor is deliberately outside this: it owns the whole viewport and its
 * own header, and wrapping it in a second bar would cost the preview height for
 * no gain. Everything else is a normal page and shares this.
 */

type Tab = "editor" | "assist" | "analytics" | "settings" | "account";

export function DashboardShell({
  siteId,
  current,
  title,
  children,
}: {
  /** Absent when there is no site yet — the account page can be reached first. */
  siteId?: string;
  current: Tab;
  title: string;
  children: React.ReactNode;
}) {
  const tabs: { key: Tab; label: string; href: string }[] = [
    ...(siteId
      ? ([
          { key: "editor", label: "Editor", href: `/dashboard/${siteId}/edit` },
          // Only where the server can actually do it — same rule the sign-in
          // providers follow, so a tab never leads to something that can't run.
          ...(ASSIST_ENABLED
            ? ([{ key: "assist", label: "Write it for me", href: `/dashboard/${siteId}/assist` }] as const)
            : []),
          { key: "analytics", label: "Analytics", href: `/dashboard/${siteId}/analytics` },
          { key: "settings", label: "Settings", href: `/dashboard/${siteId}/settings` },
        ] as const)
      : []),
    { key: "account", label: "Account", href: "/dashboard/account" },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-6 py-3">
          <Link href="/dashboard" className="text-sm font-semibold">
            Make Your Portfolio
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                aria-current={t.key === current ? "page" : undefined}
                className={
                  t.key === current
                    ? "text-sm font-medium text-neutral-900 dark:text-white"
                    : "text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:hover:text-white"
                }
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {children}
      </main>
    </div>
  );
}

/** A titled block. Every dashboard page is a stack of these. */
export function Card({
  title,
  hint,
  children,
  tone = "normal",
  id,
}: {
  title: string;
  hint?: string;
  children?: React.ReactNode;
  /** `danger` is for things that destroy data, and looks like it. */
  tone?: "normal" | "danger";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={
        tone === "danger"
          ? "mt-8 scroll-mt-6 rounded-lg border border-red-200 p-5 dark:border-red-900/60"
          : "mt-8 scroll-mt-6 rounded-lg border border-neutral-200 p-5 dark:border-neutral-800"
      }
    >
      <h2
        className={
          tone === "danger"
            ? "text-xs font-medium uppercase tracking-[0.08em] text-red-700 dark:text-red-400"
            : "text-xs font-medium uppercase tracking-[0.08em] text-neutral-500"
        }
      >
        {title}
      </h2>
      {hint && <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{hint}</p>}
      {children}
    </section>
  );
}
