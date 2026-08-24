import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A sortable column heading for the report's question tables.
 *
 * Neutral by default with a faint two-way arrow, one direction arrow once the
 * column drives the order. Shared so Favorabilidad's table and Preguntas' own
 * table sort with the same affordance — a reader who found the control in one
 * shouldn't have to look for it again in the other.
 */
export function ResultsSortHeader<Key extends string>({
  label,
  sortKey,
  activeKey,
  ascending,
  onSort,
  className,
}: {
  label: string;
  sortKey: Key;
  activeKey: Key | null;
  ascending: boolean;
  onSort: (key: Key) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        "group inline-flex items-center gap-1.5 transition-colors hover:text-text-primary",
        className
      )}
    >
      {label}
      {active ? (
        ascending ? (
          <ArrowUp className="h-3 w-3" strokeWidth={2.4} />
        ) : (
          <ArrowDown className="h-3 w-3" strokeWidth={2.4} />
        )
      ) : (
        <ArrowUpDown
          className="h-3 w-3 opacity-50 transition-opacity group-hover:opacity-100"
          strokeWidth={2.4}
        />
      )}
    </button>
  );
}
