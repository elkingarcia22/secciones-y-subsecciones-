import type { ReactNode } from "react";
import { ArrowUpDown, CheckIcon, ChevronDown, ListFilter, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Header controls shared by every selectable table in the app.
 *
 * They live here rather than beside one table because "the surveys list looks
 * and behaves like the participation list" has to survive future edits: one
 * copy means a change to the sort affordance or the filter menu lands in both
 * places instead of drifting apart.
 */

/**
 * A checkbox-shaped status readout rather than an actual checkbox: the real
 * `Checkbox` is a button under the hood, and nesting it inside the dropdown's
 * trigger button would be invalid HTML. This only ever reflects state — every
 * action lives in the menu.
 */
export function HeaderSelectionMark({ state }: { state: boolean | "indeterminate" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-xs border transition-colors",
        state === false ? "border-input" : "border-primary bg-primary text-primary-foreground"
      )}
    >
      {state === "indeterminate" && <MinusIcon className="size-3.5" strokeWidth={2.5} />}
      {state === true && <CheckIcon className="size-3.5" />}
    </span>
  );
}

/** The bulk-selection menu that lives in a table's first header cell. */
export function SelectionHeaderMenu({
  state,
  pageCount,
  matchCount,
  showSelectPage,
  showSelectAll,
  showDeselectPage,
  showDeselectAll,
  onSelectPage,
  onSelectAll,
  onDeselectPage,
  onDeselectAll,
  formatCount,
  align = "center",
}: {
  state: boolean | "indeterminate";
  /** Rows on the current page, for the menu's own label. */
  pageCount: number;
  /** Rows matching the current search and filters, across every page. */
  matchCount: number;
  showSelectPage: boolean;
  showSelectAll: boolean;
  showDeselectPage: boolean;
  showDeselectAll: boolean;
  onSelectPage: () => void;
  onSelectAll: () => void;
  onDeselectPage: () => void;
  onDeselectAll: () => void;
  formatCount: (n: number) => string;
  /**
   * Where the mark sits in its cell. It has to match how the rows below place
   * their own checkbox, or the column reads as two columns — so a table whose
   * rows left-align passes "start".
   *
   * The chevron stays absolutely positioned in both cases on purpose: as a
   * flex sibling it would push the mark off the rows' axis by half its width.
   */
  align?: "center" | "start";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Opciones de selección"
          className={cn(
            "group relative flex h-8 w-full items-center",
            align === "start" ? "justify-start" : "justify-center"
          )}
        >
          <HeaderSelectionMark state={state} />
          <ChevronDown
            className={cn(
              "absolute h-3 w-3 text-muted-foreground transition-colors group-hover:text-text-primary",
              align === "start" ? "left-4 ml-1" : "left-1/2 ml-3"
            )}
            strokeWidth={2.5}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {showSelectPage && (
          <DropdownMenuItem onClick={onSelectPage}>
            Seleccionar esta página ({formatCount(pageCount)})
          </DropdownMenuItem>
        )}
        {showSelectAll && (
          <DropdownMenuItem onClick={onSelectAll}>
            Seleccionar todos ({formatCount(matchCount)})
          </DropdownMenuItem>
        )}
        {(showSelectPage || showSelectAll) && (showDeselectPage || showDeselectAll) && (
          <DropdownMenuSeparator />
        )}
        {showDeselectPage && (
          <DropdownMenuItem onClick={onDeselectPage}>Deseleccionar esta página</DropdownMenuItem>
        )}
        {showDeselectAll && (
          <DropdownMenuItem onClick={onDeselectAll}>Deseleccionar todos</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A column that can be both sorted and filtered down to a set of values. */
export function FilterSortHeader({
  label,
  options,
  selected,
  onToggleFilter,
  onClearFilter,
  sortActive,
  onSort,
  align = "left",
  // Some filters (Área, País…) start with every option showing, and an empty
  // `selected` set is that "nothing excluded yet" state rather than "nothing
  // chosen yet" — the checkbox list and the active-filter count both read
  // backwards from the other filters in this table when this is on.
  defaultAllSelected = false,
}: {
  label: string;
  options: readonly string[];
  selected: ReadonlySet<string>;
  onToggleFilter: (value: string) => void;
  onClearFilter: () => void;
  sortActive: boolean;
  onSort: () => void;
  align?: "left" | "right";
  defaultAllSelected?: boolean;
}) {
  const isChecked = (opt: string) =>
    defaultAllSelected ? selected.size === 0 || selected.has(opt) : selected.has(opt);
  const activeCount = defaultAllSelected
    ? selected.size > 0
      ? options.length - selected.size
      : 0
    : selected.size;
  const clearLabel = defaultAllSelected ? "Mostrar todas" : "Limpiar filtros";

  return (
    <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-text-primary"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${sortActive ? "text-primary" : "opacity-30"}`}
          strokeWidth={2}
        />
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Filtrar por ${label}`}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
              activeCount > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <ListFilter className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-[300px] w-56 overflow-y-auto">
          {activeCount > 0 && (
            <>
              <DropdownMenuItem onClick={onClearFilter} className="font-medium text-primary">
                {clearLabel} ({activeCount})
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt}
              onClick={(event) => {
                event.preventDefault();
                onToggleFilter(opt);
              }}
            >
              <div className="flex items-center gap-2">
                <Checkbox checked={isChecked(opt)} />
                <span className="truncate">{opt}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * A numeric or date column that can only be sorted — filtering by an exact
 * count or percentage isn't a real filter, so no dropdown is offered for it.
 */
export function SortOnlyHeader({
  label,
  sortActive,
  onSort,
  align = "left",
}: {
  /**
   * Rich rather than plain text so a column can carry both a full name and an
   * abbreviation and let the breakpoint pick — see "Participantes".
   */
  label: ReactNode;
  sortActive: boolean;
  onSort: () => void;
  align?: "left" | "right";
}) {
  return (
    <div className={`flex items-center ${align === "right" ? "justify-end" : ""}`}>
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-text-primary"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${sortActive ? "text-primary" : "opacity-30"}`}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
