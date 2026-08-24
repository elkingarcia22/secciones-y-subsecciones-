import * as React from "react";
import type { TableSelectionActions } from "@/components/action-rail";
import { CheckIcon, ChevronDown, Eye, EyeOff, MinusIcon, Search, Trash2, UserRoundX, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Collaborator } from "@/mocks/collaborators";
import { formatCount } from "./participants";
import {
  CollaboratorRow,
  FilterMenu,
  PagerButton,
  SortableHeader,
  type SortDir,
  type SortKey,
} from "./CollaboratorTableParts";
import { NO_LEADER } from "./collaboratorTableShared";

interface CollaboratorTableProps {
  collaborators: readonly Collaborator[];
  selectedIds: readonly string[];
  onChange: (ids: readonly string[]) => void;
  onSelectionChange?: (count: number, actions: TableSelectionActions) => void;
}

const PAGE_SIZES = [10, 25, 50] as const;

/**
 * Lowercase and accent-free. Names here carry tildes and people type without
 * them, so "sofia" has to reach "Sofía" — comparing raw strings would make
 * half the directory unsearchable.
 */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Every term must land somewhere, so terms narrow instead of widening. */
function matches(person: Collaborator, terms: readonly string[]): boolean {
  if (terms.length === 0) return true;
  const haystack = fold(
    `${person.name} ${person.username} ${person.email} ${person.area} ${person.leader ?? ""}`
  );
  return terms.every((term) => haystack.includes(term));
}

/**
 * A checkbox-shaped status readout rather than an actual checkbox: the real
 * `Checkbox` is a button under the hood, and nesting it inside the dropdown's
 * trigger button would be invalid HTML. This only ever reflects state — every
 * action lives in the menu.
 */
function HeaderSelectionMark({ state }: { state: boolean | "indeterminate" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
        state === false ? "border-input" : "border-primary bg-primary text-primary-foreground"
      )}
    >
      {state === "indeterminate" && <MinusIcon className="size-3.5" strokeWidth={3} />}
      {state === true && <CheckIcon className="size-3.5" />}
    </span>
  );
}

/**
 * The company directory as a pickable list.
 *
 * Search is a real field rather than an icon that opens one: with thousands of
 * people it is the primary way through the list, not a secondary action. The
 * pager is prev/next rather than numbered pages for the same reason — page 287
 * of 423 is not a place anyone means to go.
 */
export function CollaboratorTable({
  collaborators,
  selectedIds,
  onChange,
  onSelectionChange,
}: CollaboratorTableProps) {
  const [query, setQuery] = React.useState("");
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [pageSize, setPageSize] = React.useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = React.useState(1);
  const [onlySelected, setOnlySelected] = React.useState(false);
  // Column sorting: clicking a header cycles asc → desc → off.
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  // Column filters: empty set means no filter. Multi-select per column.
  const [areaFilter, setAreaFilter] = React.useState<ReadonlySet<string>>(() => new Set());
  const [leaderFilter, setLeaderFilter] = React.useState<ReadonlySet<string>>(() => new Set());

  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  // Folded once per query rather than once per row: at six thousand rows the
  // difference between the two is the difference between typing smoothly and
  // typing through treacle.
  const terms = React.useMemo(() => fold(query).split(/\s+/).filter(Boolean), [query]);

  // Distinct values per filterable column, in display order. Leaders include
  // the no-leader sentinel so those rows can be picked (and excluded) too.
  const areas = React.useMemo(
    () => [...new Set(collaborators.map((person) => person.area))].sort((a, b) => a.localeCompare(b, "es")),
    [collaborators]
  );
  const leaders = React.useMemo(
    () =>
      [...new Set(collaborators.map((person) => person.leader ?? NO_LEADER))].sort((a, b) =>
        a.localeCompare(b, "es")
      ),
    [collaborators]
  );

  const filtered = React.useMemo(
    () =>
      collaborators.filter(
        (person) =>
          matches(person, terms) &&
          (areaFilter.size === 0 || areaFilter.has(person.area)) &&
          (leaderFilter.size === 0 || leaderFilter.has(person.leader ?? NO_LEADER)) &&
          (!onlySelected || selected.has(person.id))
      ),
    [collaborators, terms, onlySelected, selected, areaFilter, leaderFilter]
  );

  // Sorting never changes membership, so it runs on the filtered list in its
  // own memo, after every filter (search included) has already narrowed it.
  const sorted = React.useMemo(() => {
    if (sortKey === null) return filtered;
    const direction = sortDir === "asc" ? 1 : -1;
    const value = sortKey === "name" ? (p: Collaborator) => p.name : (p: Collaborator) => p.email;
    return [...filtered].sort((a, b) => direction * value(a).localeCompare(value(b), "es"));
  }, [filtered, sortKey, sortDir]);

  // Clamped rather than corrected in an effect: deselecting the last row of the
  // final page shrinks the list under the current page, and a render that
  // points past the end should simply show the new last page.
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const rows = sorted.slice(firstIndex, firstIndex + pageSize);

  const selectedOnPage = rows.filter((person) => selected.has(person.id)).length;
  const headerState =
    rows.length > 0 && selectedOnPage === rows.length
      ? true
      : selectedOnPage > 0
        ? "indeterminate"
        : false;

  const callbacksRef = React.useRef({ onSelectionChange, setSelection: (ids: Iterable<string>) => onChange([...new Set(ids)]) });
  React.useEffect(() => {
    callbacksRef.current = { onSelectionChange, setSelection: (ids: Iterable<string>) => onChange([...new Set(ids)]) };
  });

  React.useEffect(() => {
    const { onSelectionChange: currentSelectionChange, setSelection } = callbacksRef.current;
    if (currentSelectionChange) {
      // No `remove`: here the ticks *are* the audience, so dropping them is the
      // only outcome available — a separate "eliminar" would do the same thing.
      currentSelectionChange(selected.size, {
        clear: () => setSelection(new Set()),
      });
    }
  }, [selected.size]); // Use selected.size to trigger update, since selected is a new Set on every render if selectedIds changes

  const setSelection = (ids: Iterable<string>) => onChange([...new Set(ids)]);

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelection(next);
  };

  const selectPage = () => setSelection([...selected, ...rows.map((p) => p.id)]);
  const deselectPage = () => {
    const pageIds = new Set(rows.map((p) => p.id));
    setSelection([...selected].filter((id) => !pageIds.has(id)));
  };
  const selectAllMatches = () => setSelection([...selected, ...filtered.map((p) => p.id)]);
  // Clears the whole pick, not just what the current search or page can see —
  // the menu needed a way back that undoes all of it at once.
  const clearSelection = () => {
    onChange([]);
    setOnlySelected(false);
  };

  /** Cycles a column's sort: first click ascends, second descends, third clears. */
  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
    setPage(1);
  };

  const toggleAreaFilter = (value: string) => {
    setAreaFilter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setPage(1);
  };

  const toggleLeaderFilter = (value: string) => {
    setLeaderFilter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setPage(1);
  };

  const allMatchesSelected = filtered.length > 0 && filtered.every((person) => selected.has(person.id));
  const isPageFullySelected = rows.length > 0 && selectedOnPage === rows.length;
  // Select and deselect are opposite ends of the same fact, so only the one
  // that's still a real action shows — once a group is fully picked,
  // offering to select it again is dead weight, not a shortcut.
  const showSelectPage = rows.length > 0 && !isPageFullySelected;
  const showDeselectPage = isPageFullySelected;
  const showSelectAll = filtered.length > 0 && !allMatchesSelected;
  const showDeselectAll = allMatchesSelected;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <h3 className="text-[13px] font-bold text-text-primary">Colaboradores</h3>
        
        <div className="flex items-center gap-3 ml-auto">
          <div
            className={cn(
              "relative flex h-9 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-lg border bg-surface",
              (isSearchExpanded || query !== "")
                ? "w-[300px] border-primary/50 ring-1 ring-primary/15"
                : "w-9 border-border hover:bg-border/50 cursor-pointer"
            )}
            onClick={() => {
              if (!isSearchExpanded && query === "") {
                setIsSearchExpanded(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget) && query === "") {
                setIsSearchExpanded(false);
              }
            }}
          >
            <div
              className={cn(
                "absolute left-0 -ml-px -mt-px flex h-9 w-9 items-center justify-center transition-colors",
                (isSearchExpanded || query !== "") ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Search className="h-4 w-4 translate-x-[0.667px] translate-y-[0.667px]" strokeWidth={2.2} />
            </div>
            
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Busca por nombre, correo, área o líder"
              aria-label="Buscar colaboradores"
              className={cn(
                "h-full w-[300px] bg-transparent pl-9 pr-8 text-[13px] text-text-primary outline-none transition-all placeholder:text-muted-foreground/70",
                (isSearchExpanded || query !== "") ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
            />
            {query !== "" && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setPage(1);
                  searchInputRef.current?.focus();
                }}
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border/60 hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div
            className={cn(
              "flex shrink-0 items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              (selected.size > 0 || onlySelected)
                ? "max-w-[200px] opacity-100"
                : "max-w-0 opacity-0 pointer-events-none"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setOnlySelected((value) => !value);
                setPage(1);
              }}
              className={cn(
                "flex h-9 whitespace-nowrap shrink-0 items-center gap-2 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors",
                onlySelected
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border text-text-secondary hover:border-primary/30 hover:text-primary"
              )}
            >
              {onlySelected ? (
                <EyeOff className="h-3.5 w-3.5" strokeWidth={2.3} />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={2.3} />
              )}
              {onlySelected ? "Ver todos" : `Ver seleccionados (${formatCount(selected.size)})`}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
              {/* A dropdown rather than a plain toggle: with thousands of rows
                  behind a filter, "select the page" and "select everything
                  that matches" are different actions, not one checkbox
                  overloaded to mean both. */}
              <TableHead className="w-16 px-0">
                {/* No hover background here: the header row already carries
                    one (bg-muted/40), and a second, smaller one under just
                    part of the row. The chevron darkening on hover is
                    affordance enough. */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={filtered.length === 0}
                      aria-label="Opciones de selección"
                      // Not `justify-center`: that centers the checkbox+chevron
                      // pair as one block, which sits the checkbox 8px left of
                      // where the row checkboxes land (they center alone, with
                      // nothing beside them). `pl-6` puts it at that same 24px
                      // inset instead, so the column reads as one straight line.
                      className="group flex h-8 w-full items-center gap-1 pl-6"
                    >
                      <HeaderSelectionMark state={headerState} />
                      <ChevronDown
                        className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-text-primary"
                        strokeWidth={2.5}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-96">
                    {showSelectPage && (
                      <DropdownMenuItem onClick={selectPage}>
                        Seleccionar esta página ({formatCount(rows.length)})
                      </DropdownMenuItem>
                    )}
                    {showSelectAll && (
                      <DropdownMenuItem onClick={selectAllMatches}>
                        Seleccionar todos los colaboradores ({formatCount(filtered.length)})
                      </DropdownMenuItem>
                    )}
                    {(showSelectPage || showSelectAll) && (showDeselectPage || showDeselectAll) && (
                      <DropdownMenuSeparator />
                    )}
                    {showDeselectPage && (
                      <DropdownMenuItem onClick={deselectPage}>Deseleccionar esta página</DropdownMenuItem>
                    )}
                    {showDeselectAll && (
                      <DropdownMenuItem onClick={clearSelection}>
                        Deseleccionar todos los colaboradores
                      </DropdownMenuItem>
                    )}
                    {selected.size > 0 && (
                      <>
                        <div className="my-1 h-px bg-border" role="separator" />
                        <DropdownMenuItem
                          onClick={() => setSelection(new Set())}
                          className="text-status-negative focus:text-status-negative focus:bg-status-negative/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar seleccionados ({selected.size})
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead
                aria-sort={sortKey === "name" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                className="min-w-[200px] py-3"
              >
                <SortableHeader
                  label="Colaborador"
                  active={sortKey === "name"}
                  direction={sortDir}
                  onToggle={() => toggleSort("name")}
                />
              </TableHead>
              <TableHead
                aria-sort={sortKey === "email" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                className="py-3"
              >
                <SortableHeader
                  label="Correo electrónico"
                  active={sortKey === "email"}
                  direction={sortDir}
                  onToggle={() => toggleSort("email")}
                />
              </TableHead>
              <TableHead className="py-3">
                <FilterMenu
                  label="Área"
                  options={areas}
                  selected={areaFilter}
                  onToggle={toggleAreaFilter}
                  onClear={() => {
                    setAreaFilter(new Set());
                    setPage(1);
                  }}
                />
              </TableHead>
              <TableHead className="py-3 pr-4">
                <FilterMenu
                  label="Líder"
                  options={leaders}
                  selected={leaderFilter}
                  onToggle={toggleLeaderFilter}
                  onClear={() => {
                    setLeaderFilter(new Set());
                    setPage(1);
                  }}
                />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((person) => {
              const isSelected = selected.has(person.id);
              return (
                <TableRow
                  key={person.id}
                  data-state={isSelected ? "selected" : undefined}
                  onClick={() => toggleOne(person.id)}
                  className="cursor-pointer border-border/50"
                >
                  <TableCell className="px-0">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(person.id)}
                        // The row already handles the click; letting it through
                        // would toggle twice and cancel itself out.
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Seleccionar a ${person.name}`}
                      />
                    </div>
                  </TableCell>
                  <CollaboratorRow person={person} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
            <UserRoundX className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.8} />
            <p className="text-[13px] font-semibold text-text-primary">
              {onlySelected ? "Aún no has seleccionado a nadie" : "Sin resultados"}
            </p>
            <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
              {onlySelected
                ? "Vuelve a la lista completa para elegir colaboradores."
                : "Prueba con otro nombre, correo o área."}
            </p>
            {(!onlySelected && (query !== "" || areaFilter.size > 0 || leaderFilter.size > 0)) && (
              <Button
                variant="secondary"
                className="mt-3"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setAreaFilter(new Set());
                  setLeaderFilter(new Set());
                  setPage(1);
                  setIsSearchExpanded(false);
                }}
              >
                Limpiar búsqueda y filtros
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          {filtered.length === 0
            ? "0 colaboradores"
            : `${formatCount(firstIndex + 1)}–${formatCount(firstIndex + rows.length)} de ${formatCount(filtered.length)}`}
        </p>

        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger
              aria-label="Colaboradores por página"
              className="h-8 w-[130px] rounded-lg px-2.5 text-[12px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6}>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-[12.5px]">
                  {size} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <PagerButton
            label="Página anterior"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Anterior
          </PagerButton>
          <span className="text-[12px] tabular-nums text-text-secondary">
            {formatCount(currentPage)} / {formatCount(pageCount)}
          </span>
          <PagerButton
            label="Página siguiente"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Siguiente
          </PagerButton>
        </div>
      </div>
    </div>
  );
}
