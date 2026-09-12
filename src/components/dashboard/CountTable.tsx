/** Something and how many of it, busiest first — sources, or sites on the admin page. */
export function CountTable({
  label,
  unit = "Views",
  rows,
  empty = "Nothing yet.",
}: {
  label: string;
  unit?: string;
  rows: { key: string; label: React.ReactNode; count: number }[];
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{empty}</p>;
  }

  return (
    <table className="mt-3 w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-[0.08em] text-neutral-500">
          <th className="pb-2 font-medium">{label}</th>
          <th className="pb-2 text-right font-medium">{unit}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key} className="border-t border-neutral-200 dark:border-neutral-800">
            <td className="py-2 font-mono">{row.label}</td>
            <td className="py-2 text-right tabular-nums">{row.count.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
