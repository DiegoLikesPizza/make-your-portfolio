import Link from "next/link";

/** A filter pill. Plain links, so the browser needs no client JavaScript. */
export function Chip({
  href, active, children, count,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  count?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
          : "border-neutral-300 text-neutral-700 hover:border-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-white"
      }`}
    >
      {children}
      {count && (
        <span className={active ? "opacity-60" : "text-neutral-400"}>{count}</span>
      )}
    </Link>
  );
}
