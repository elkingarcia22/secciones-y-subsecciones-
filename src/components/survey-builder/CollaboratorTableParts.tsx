import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell } from "@/components/ui/table";
import type { Collaborator } from "@/mocks/collaborators";
import { avatarColor, initials } from "./collaboratorTableShared";

/** Which column the table is sorted by, and in which direction. */
export type SortKey = "name" | "email";
export type SortDir = "asc" | "desc";

/**
 * Column header for the sortable columns. The state that defines the whole
 * interaction lives in the arrow: idle shows a faint hover-only hint, active
 * commits to the current direction in the accent color.
 */
export function SortableHeader({
  label,
  active,
  direction,
  onToggle,
}: {
  label: string;
  active: boolean;
  direction: SortDir;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Ordenar por ${label}`}
      className="group flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {label}
      {active ? (
        direction === "asc" ? (
          <ArrowUp className="h-3 w-3 text-primary" strokeWidth={2.5} />
        ) : (
          <ArrowDown className="h-3 w-3 text-primary" strokeWidth={2.5} />
        )
      ) : (
        <ArrowUpDown
          className="h-3 w-3 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground"
          strokeWidth={2.5}
        />
      )}
    </button>
  );
}

/**
 * Multiselect column filter. Checkbox items keep the menu open between ticks
 * (radix closes on select by default), so several values can be picked in one
 * visit. The header colors up and shows the active count while any are set,
 * and a "Limpiar filtro" entry appears only then.
 */
export function FilterMenu({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string;
  options: readonly string[];
  selected: ReadonlySet<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}) {
  const activeCount = selected.size;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Filtrar por ${label}`}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            activeCount > 0 ? "text-primary" : "text-muted-foreground hover:text-text-primary"
          )}
        >
          {label}
          <ListFilter
            className={cn("h-3 w-3", activeCount > 0 ? "text-primary" : "text-muted-foreground/50")}
            strokeWidth={2.5}
          />
          {activeCount > 0 && (
            <span className="rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-bold tabular-nums text-primary">
              {activeCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        {/* Reads as a section heading, not as another row to tick: the only
            line in the menu that is not selectable, set apart by its label
            case, weight and the divider beneath it. */}
        <DropdownMenuLabel className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
          Filtrar por {label.toLowerCase()}
        </DropdownMenuLabel>
        <div className="mx-1.5 mb-1 h-px bg-border" />
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option}
            checked={selected.has(option)}
            // Keeping the menu open is what makes this a multiselect — without
            // preventDefault every tick would close it after the first value.
            onSelect={(event) => {
              event.preventDefault();
              onToggle(option);
            }}
            className="text-[13px]"
          >
            {option}
          </DropdownMenuCheckboxItem>
        ))}
        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onClear} className="text-[13px] font-semibold">
              Limpiar filtro
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PagerButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-8 rounded-lg border border-border px-2.5 text-[12px] font-semibold text-text-secondary transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-secondary"
    >
      {children}
    </button>
  );
}

/**
 * The data cells of a directory row, shared by the pickable list and the
 * import preview so both render the same columns the same way. The selection
 * checkbox is deliberately not part of it — the importer has nothing to
 * select.
 */
export function CollaboratorRow({ person }: { person: Collaborator }) {
  return (
    <>
      <TableCell className="min-w-[200px] py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
              avatarColor(person.id)
            )}
          >
            {initials(person.name)}
          </span>
          <p className="min-w-0 truncate text-[13px] font-semibold text-text-primary">{person.name}</p>
        </div>
      </TableCell>
      <TableCell className="text-[13px] text-text-secondary">{person.username}</TableCell>
      <TableCell className="text-[13px] text-text-secondary">{person.email}</TableCell>
      <TableCell className="text-[13px] text-text-secondary">{person.area}</TableCell>
      <TableCell className="pr-4 text-[13px] text-text-secondary">{person.leader ?? "—"}</TableCell>
    </>
  );
}
