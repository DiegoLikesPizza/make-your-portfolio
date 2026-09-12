import { Chip } from "@/components/browser/Chip";
import { DEFAULT_RANGE, RANGES, type Range } from "@/lib/analytics";

/**
 * 7, 30 or 90 days. Plain links to `?days=`, which the page reads on the
 * server, so switching needs no client JavaScript.
 */
export function RangePicker({ basePath, current }: { basePath: string; current: Range }) {
  return (
    <nav aria-label="Time range" className="mt-4 flex flex-wrap gap-2">
      {RANGES.map((days) => (
        <Chip key={days} href={days === DEFAULT_RANGE ? basePath : `${basePath}?days=${days}`} active={days === current}>
          {days} days
        </Chip>
      ))}
    </nav>
  );
}
