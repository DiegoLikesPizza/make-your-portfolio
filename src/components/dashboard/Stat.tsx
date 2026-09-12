/**
 * A single number, big, with an optional line under it.
 *
 * A two-point trend is a stat, not a chart — drawing it as one would imply a
 * shape that two numbers cannot have — so the comparison with the previous
 * window is that line of text rather than a sparkline.
 */
export function Stat({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-5 dark:border-neutral-800">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">{label}</span>
      <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value.toLocaleString()}</p>
      {detail && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{detail}</p>}
    </div>
  );
}
