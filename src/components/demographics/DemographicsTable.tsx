import * as React from "react";
import { Layers3, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/feedback";
import {
  FilterSortHeader,
  SelectionHeaderMenu,
  SortOnlyHeader,
} from "@/components/data-display";
import { PagerButton } from "@/components/survey-builder/CollaboratorTableParts";
import {
  ORIGIN_OPTIONS,
  createdAtValue,
  formatIsoDay,
  type DemographicRow,
} from "./demographicRows";

interface DemographicsTableProps {
  rows: readonly DemographicRow[];
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: ReadonlySet<string>) => void;
}

/** Matches the pager everywhere else in the app. */
const PAGE_SIZES = [10, 25, 50] as const;

type SortKey = "name" | "origin" | "createdAt" | "optionCount";

const formatCount = (n: number) => new Intl.NumberFormat("es-CO").format(n);

/** Lowercase and accent-free, so "genero" reaches "Género". */
const fold = (value: string): string =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * The demographics list.
 *
 * Deliberately the survey list's twin — same shell, same header controls, same
 * selection model and pager — because they are the same kind of screen and the
 * app is easier to learn once than twice. What differs is only what a row is.
 */
export function DemographicsTable({
  rows,
  selectedIds,
  onSelectionChange,
}: DemographicsTableProps) {
  const [query, setQuery] = React.useState("");
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(PAGE_SIZES[0]);
  const [originFilter, setOriginFilter] = React.useState<ReadonlySet<string>>(new Set());
  const [sort, setSort] = React.useState<{ key: SortKey; ascending: boolean }>({
    key: "name",
    ascending: true,
  });

  const terms = React.useMemo(() => fold(query).split(/\s+/).filter(Boolean), [query]);

  const visibleRows = React.useMemo(() => {
    const filtered = rows.filter((row) => {
      const haystack = fold(`${row.name} ${row.originLabel} ${row.typeLabel}`);
      return (
        terms.every((term) => haystack.includes(term)) &&
        (originFilter.size === 0 || originFilter.has(row.originLabel))
      );
    });

    const direction = sort.ascending ? 1 : -1;
    const compare = (a: DemographicRow, b: DemographicRow) => {
      switch (sort.key) {
        case "name":
          return a.name.localeCompare(b.name, "es");
        case "origin":
          return a.originLabel.localeCompare(b.originLabel, "es");
        case "createdAt":
          return createdAtValue(a) - createdAtValue(b);
        case "optionCount":
          return a.optionCount - b.optionCount;
      }
    };
    return [...filtered].sort((a, b) => direction * compare(a, b));
  }, [rows, terms, originFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const pagedRows = visibleRows.slice(firstIndex, firstIndex + pageSize);

  const toggleSort = (key: SortKey) => {
    setPage(1);
    setSort((current) =>
      current.key === key ? { key, ascending: !current.ascending } : { key, ascending: true }
    );
  };

  const setSelection = (ids: Iterable<string>) => onSelectionChange(new Set(ids));
  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  const selectedOnPage = pagedRows.filter((row) => selectedIds.has(row.id)).length;
  const headerState: boolean | "indeterminate" =
    selectedOnPage === 0 ? false : selectedOnPage === pagedRows.length ? true : "indeterminate";

  const selectPage = () => setSelection([...selectedIds, ...pagedRows.map((row) => row.id)]);
  const deselectPage = () => {
    const pageIds = new Set(pagedRows.map((row) => row.id));
    setSelection([...selectedIds].filter((id) => !pageIds.has(id)));
  };
  const selectAllMatches = () => setSelection([...selectedIds, ...visibleRows.map((r) => r.id)]);
  const clearSelection = () => onSelectionChange(new Set());

  const allMatchesSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id));
  const isPageFullySelected = pagedRows.length > 0 && selectedOnPage === pagedRows.length;
  const hasActiveFilters = query !== "" || originFilter.size > 0;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/50 bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-bold text-text-primary">
            Lista de datos demográficos
          </h3>
          <Badge variant="neutral" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
            {visibleRows.length}
          </Badge>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div
            className={cn(
              "relative flex h-9 overflow-hidden rounded-lg border bg-surface transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              isSearchExpanded || query !== ""
                ? "w-[300px] border-primary/50 ring-1 ring-primary/15"
                : "w-9 cursor-pointer border-border hover:bg-border/50"
            )}
            onClick={() => {
              if (!isSearchExpanded && query === "") {
                setIsSearchExpanded(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget) && query === "") {
                setIsSearchExpanded(false);
              }
            }}
          >
            <span className="pointer-events-none absolute left-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar demográfico"
              aria-label="Buscar demográfico"
              className={cn(
                "h-full w-[300px] bg-transparent pl-9 pr-8 text-[13px] text-text-primary outline-none transition-all placeholder:text-muted-foreground/70",
                isSearchExpanded || query !== "" ? "opacity-100" : "pointer-events-none opacity-0"
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
                aria-label="Limpiar búsqueda"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/60">
        {visibleRows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Layers3}
              title="Ningún demográfico coincide"
              description="Ajusta la búsqueda o el filtro de tipo para volver a verlos."
              className="border-none bg-transparent shadow-none"
              action={
                hasActiveFilters ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      setOriginFilter(new Set());
                      setPage(1);
                      setIsSearchExpanded(false);
                    }}
                  >
                    Limpiar búsqueda y filtros
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-7 pr-5">
                    <SelectionHeaderMenu
                      state={headerState}
                      pageCount={pagedRows.length}
                      matchCount={visibleRows.length}
                      showSelectPage={pagedRows.length > 0 && !isPageFullySelected}
                      showSelectAll={visibleRows.length > 0 && !allMatchesSelected}
                      showDeselectPage={isPageFullySelected}
                      showDeselectAll={allMatchesSelected}
                      onSelectPage={selectPage}
                      onSelectAll={selectAllMatches}
                      onDeselectPage={deselectPage}
                      onDeselectAll={clearSelection}
                      formatCount={formatCount}
                      align="start"
                    />
                  </TableHead>
                  <TableHead className="w-[42%] px-0 py-3.5">
                    <SortOnlyHeader
                      label="Nombre"
                      sortActive={sort.key === "name"}
                      onSort={() => toggleSort("name")}
                    />
                  </TableHead>
                  <TableHead className="w-[22%] px-0 py-3.5">
                    <FilterSortHeader
                      label="Tipo"
                      options={ORIGIN_OPTIONS}
                      selected={originFilter}
                      onToggleFilter={(value) => {
                        setPage(1);
                        setOriginFilter((prev) => {
                          const next = new Set(prev);
                          if (next.has(value)) next.delete(value);
                          else next.add(value);
                          return next;
                        });
                      }}
                      onClearFilter={() => setOriginFilter(new Set())}
                      sortActive={sort.key === "origin"}
                      onSort={() => toggleSort("origin")}
                    />
                  </TableHead>
                  <TableHead className="w-[130px] px-2 py-3.5">
                    <SortOnlyHeader
                      label="Creación"
                      sortActive={sort.key === "createdAt"}
                      onSort={() => toggleSort("createdAt")}
                    />
                  </TableHead>
                  <TableHead className="w-[110px] py-3.5 pl-0 pr-7 text-right">
                    <SortOnlyHeader
                      label="Opciones"
                      sortActive={sort.key === "optionCount"}
                      onSort={() => toggleSort("optionCount")}
                      align="right"
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((row) => (
                  <DemographicTableRow
                    key={row.id}
                    row={row}
                    isSelected={selectedIds.has(row.id)}
                    onToggle={() => toggleOne(row.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          {visibleRows.length === 0
            ? "0 demográficos"
            : `${formatCount(firstIndex + 1)}–${formatCount(firstIndex + pagedRows.length)} de ${formatCount(visibleRows.length)}`}
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
              aria-label="Demográficos por página"
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

function DemographicTableRow({
  row,
  isSelected,
  onToggle,
}: {
  row: DemographicRow;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      onClick={onToggle}
      className="group cursor-pointer border-border/50 transition-colors hover:bg-muted/30"
    >
      <TableCell className="pl-7 pr-5">
        <div className="flex items-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Seleccionar ${row.name}`}
          />
        </div>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-[12.5px] font-semibold text-text-primary" title={row.name}>
            {row.name}
          </span>
          {/* The question type rides under the name rather than taking a column
              of its own: it qualifies the demographic, it is not a thing anyone
              sorts a catalog of seven entries by. */}
          <span className="truncate text-[11.5px] text-muted-foreground">{row.typeLabel}</span>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <Badge variant={row.origin === "system" ? "info" : "neutral"}>{row.originLabel}</Badge>
      </TableCell>
      <TableCell className="px-2 py-3 text-[12.5px] tabular-nums text-muted-foreground">
        {formatIsoDay(row.createdAt)}
      </TableCell>
      <TableCell className="py-3 pl-0 pr-7 text-right text-[12.5px] font-semibold tabular-nums text-text-primary">
        {row.optionCount}
      </TableCell>
    </TableRow>
  );
}
