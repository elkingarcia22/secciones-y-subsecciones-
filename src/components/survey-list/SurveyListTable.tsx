import * as React from "react";
import { CalendarClock, Eye, EyeOff, ListChecks, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";

function mapVariantToState(variant: "info" | "positive" | "warning" | "neutral"): "success" | "pending" | "failed" | "draft" {
  if (variant === "positive") return "success";
  if (variant === "neutral") return "draft";
  if (variant === "warning" || variant === "info") return "pending";
  return "failed";
}
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import { useAnimatedValue } from "@/lib/useAnimatedValue";
import {
  CLOSE_BUCKETS,
  PROGRESS_BUCKETS,
  NO_FILTERS,
  hasAnyFilter,
  matchesFilters,
  toggleFilterValue,
  type SurveyListFilters,
} from "./surveyListFilters";
import { dateValue, parseSurveyDate, startOfToday } from "./surveyListDates";
import { SurveyDateCell, type DateEditMode } from "./SurveyDateCell";

/** One row of the list. Shaped by the mocks, so the fields stay loose. */
export interface SurveyListRow {
  id: string;
  name: string;
  type: string;
  status: string;
  statusVariant?: string;
  startDate: string;
  endDate: string;
  participants: string | number;
  progress: number;
}

interface SurveyListTableProps {
  surveys: readonly SurveyListRow[];
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: ReadonlySet<string>) => void;
  /** Opening a survey from its name: results when finished, editor otherwise. */
  onOpenSurvey: (id: string) => void;
  /**
   * Column filters, owned by the screen so the home metric cards can set them.
   * Search, sort and paging stay private — nothing outside needs to drive those.
   */
  filters: SurveyListFilters;
  onFiltersChange: (filters: SurveyListFilters) => void;
  /**
   * The row whose closing date is being changed right now, if any. Owned by the
   * screen because the rail starts the edit and the table finishes it.
   */
  dateEdit?: { surveyId: string; mode: DateEditMode } | null;
  onDateEditStart?: (surveyId: string, mode: DateEditMode) => void;
  onDateEditSave?: (surveyId: string, date: Date) => void;
  onDateEditCancel?: () => void;
}

/** Matches the pager everywhere else in the app. */
const PAGE_SIZES = [10, 25, 50] as const;

type SortKey = "name" | "type" | "status" | "startDate" | "endDate" | "participants" | "progress";

function formatCount(n: number) {
  return new Intl.NumberFormat("es-CO").format(n);
}

/** Lowercase and accent-free, so "clima" reaches "Clima" and "año" reaches "ano". */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function participantsValue(raw: string | number): number {
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Default table order: drafts need attention first, then what's running, then what's done. */
const STATUS_ORDER: Readonly<Record<string, number>> = {
  Borrador: 0,
  "Por iniciar": 1,
  "En curso": 2,
  Finalizado: 3,
};

function statusOrder(status: string): number {
  return STATUS_ORDER[status] ?? STATUS_ORDER.Finalizado + 1;
}

/** Same tone mapping the list has always used for a survey's lifecycle. */
function statusVariant(survey: SurveyListRow): "info" | "positive" | "warning" | "neutral" {
  switch (survey.statusVariant) {
    case "info":
      return "info";
    case "positive":
      return "positive";
    case "warning":
      return "warning";
    default:
      return "neutral";
  }
}

/**
 * The survey list, built on the participation table.
 *
 * Same shell, same header controls, same selection model and same pager — the
 * two tables are the app's one table pattern seen with different content, so
 * they share the header components rather than resembling each other by hand.
 *
 * Grouped by status by default — Borrador, then En curso, then Finalizado,
 * newest start date first within each group — until the person sorts by a
 * column themselves, which replaces the grouping with a plain column sort.
 */
// Module-level cache to track seen surveys reliably across unmounts and Strict Mode
const seenSurveyIds = new Set<string>();
let isFirstTableMount = true;

export function SurveyListTable({
  surveys,
  selectedIds,
  onSelectionChange,
  onOpenSurvey,
  filters,
  onFiltersChange,
  dateEdit = null,
  onDateEditStart,
  onDateEditSave,
  onDateEditCancel,
}: SurveyListTableProps) {
  const [query, setQuery] = React.useState("");
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState<number>(PAGE_SIZES[0]);
  const [onlySelected, setOnlySelected] = React.useState(false);
  
  // Find strictly new IDs
  const newSurveyIds = React.useMemo<ReadonlySet<string>>(() => {
    const newIds = new Set<string>();
    
    // If it's the very first time the table mounts in the app session,
    // everything is "new" to the app, but we don't want to flash the whole table.
    // We just register them.
    if (isFirstTableMount) {
      surveys.forEach(s => seenSurveyIds.add(s.id));
      isFirstTableMount = false;
      return newIds;
    }

    // On subsequent mounts (like returning from the builder), find IDs we haven't seen
    surveys.forEach(s => {
      if (!seenSurveyIds.has(s.id)) {
        newIds.add(s.id);
        seenSurveyIds.add(s.id); // Mark it seen so it doesn't flash again if we re-render
      }
    });

    console.log("Found new IDs to animate:", Array.from(newIds));
    return newIds;
  }, [surveys]);

  const [sort, setSort] = React.useState<{ key: SortKey | null; ascending: boolean }>({
    key: null,
    ascending: false,
  });
  
  const today = React.useMemo(() => new Date(), []);

  const toggleColumn = (column: keyof SurveyListFilters, value: string) => {
    setPage(1);
    onFiltersChange(toggleFilterValue(filters, column, value));
  };
  const clearColumn = (column: keyof SurveyListFilters) => {
    setPage(1);
    onFiltersChange({ ...filters, [column]: [] });
  };

  const availableTypes = React.useMemo(
    () => [...new Set(surveys.map((s) => s.type))].sort((a, b) => a.localeCompare(b, "es")),
    [surveys]
  );
  const availableStatuses = React.useMemo(
    () => [...new Set(surveys.map((s) => s.status))].sort((a, b) => a.localeCompare(b, "es")),
    [surveys]
  );

  const terms = React.useMemo(() => fold(query).split(/\s+/).filter(Boolean), [query]);

  // Arriving from a metric card must land on the first page of the narrowed set.
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  const visibleRows = React.useMemo(() => {
    const filtered = surveys.filter((survey) => {
      const haystack = fold(`${survey.name} ${survey.type} ${survey.status}`);
      return (
        terms.every((term) => haystack.includes(term)) &&
        matchesFilters(survey, filters, today) &&
        (!onlySelected || selectedIds.has(survey.id))
      );
    });

    if (sort.key === null) {
      // Default order: Borrador, then En curso, then Finalizado; newest
      // start date first within each group.
      return [...filtered].sort((a, b) => {
        const statusDiff = statusOrder(a.status) - statusOrder(b.status);
        if (statusDiff !== 0) return statusDiff;
        return dateValue(b.startDate) - dateValue(a.startDate);
      });
    }

    const direction = sort.ascending ? 1 : -1;
    const sortKey = sort.key;
    const compare = (a: SurveyListRow, b: SurveyListRow) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name, "es");
        case "type":
          return a.type.localeCompare(b.type, "es");
        case "status":
          return a.status.localeCompare(b.status, "es");
        case "startDate":
          return dateValue(a.startDate) - dateValue(b.startDate);
        case "endDate":
          return dateValue(a.endDate) - dateValue(b.endDate);
        case "participants":
          return participantsValue(a.participants) - participantsValue(b.participants);
        case "progress":
          return a.progress - b.progress;
      }
    };
    return [...filtered].sort((a, b) => direction * compare(a, b));
  }, [surveys, terms, filters, today, onlySelected, selectedIds, sort]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const pagedRows = visibleRows.slice(firstIndex, firstIndex + pageSize);

  // An edit started from the rail must be somewhere the person can see it:
  // the selection survives paging, so the row being edited may well sit two
  // pages away from whatever is on screen.
  const editingId = dateEdit?.surveyId ?? null;
  React.useEffect(() => {
    if (editingId === null) return;
    const index = visibleRows.findIndex((row) => row.id === editingId);
    if (index === -1) return;
    const targetPage = Math.floor(index / pageSize) + 1;
    setPage((current) => (current === targetPage ? current : targetPage));
  }, [editingId, visibleRows, pageSize]);

  const editingSurvey = editingId
    ? (visibleRows.find((row) => row.id === editingId) ?? null)
    : null;

  const toggleSort = (key: SortKey) => {
    setPage(1);
    setSort((current) =>
      current.key === key
        ? { key, ascending: !current.ascending }
        : // Text ascends, numbers and dates start at the most notable end.
          { key, ascending: key === "name" || key === "type" || key === "status" }
    );
  };

  const selectedOnPage = pagedRows.filter((row) => selectedIds.has(row.id)).length;
  const headerState =
    pagedRows.length > 0 && selectedOnPage === pagedRows.length
      ? true
      : selectedOnPage > 0
        ? "indeterminate"
        : false;

  const setSelection = (ids: Iterable<string>) => onSelectionChange(new Set(ids));

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelection(next);
  };

  const selectPage = () => setSelection([...selectedIds, ...pagedRows.map((r) => r.id)]);
  const deselectPage = () => {
    const pageIds = new Set(pagedRows.map((r) => r.id));
    setSelection([...selectedIds].filter((id) => !pageIds.has(id)));
  };
  const selectAllMatches = () => setSelection([...selectedIds, ...visibleRows.map((r) => r.id)]);
  const clearSelection = () => {
    onSelectionChange(new Set());
    setOnlySelected(false);
  };

  const allMatchesSelected =
    visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));
  const isPageFullySelected = pagedRows.length > 0 && selectedOnPage === pagedRows.length;

  const hasActiveFilters = query !== "" || hasAnyFilter(filters);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-4 shrink-0 p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-bold text-text-primary">Lista de encuestas creadas</h3>
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
            <div
              className={cn(
                "absolute left-0 -ml-px -mt-px flex h-9 w-9 items-center justify-center transition-colors",
                isSearchExpanded || query !== "" ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Search
                className="h-4 w-4 translate-x-[0.667px] translate-y-[0.667px]"
                strokeWidth={2}
              />
            </div>

            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Busca por nombre, tipo o estado"
              aria-label="Buscar encuestas"
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
                  searchInputRef.current?.focus();
                }}
                aria-label="Limpiar búsqueda"
                className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border/60 hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div
            className={cn(
              "flex shrink-0 items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
              selectedIds.size > 0 || onlySelected
                ? "max-w-[220px] opacity-100"
                : "pointer-events-none max-w-0 opacity-0"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setOnlySelected((value) => !value);
                setPage(1);
              }}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-[13px] font-semibold transition-colors",
                onlySelected
                  ? "border-primary/40 bg-primary/5 text-primary"
                  : "border-border text-text-secondary hover:border-primary/30 hover:text-primary"
              )}
            >
              {onlySelected ? (
                <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {onlySelected ? "Ver todas" : `Ver seleccionadas (${formatCount(selectedIds.size)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Names what the dimmed table is waiting for, and offers the way out
          that clicking a greyed row no longer can. */}
      {editingSurvey && (
        <div className="mx-4 mb-4 flex flex-wrap shrink-0 items-center gap-x-3 gap-y-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <CalendarClock className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
          <p className="text-[13px] text-text-secondary">
            {dateEdit?.mode === "reopen" ? "Reabriendo " : "Editando la fecha de cierre de "}
            <span className="font-bold text-text-primary">{editingSurvey.name}</span>
            {dateEdit?.mode === "reopen"
              ? ": elige hasta cuándo admitirá respuestas."
              : ": elige la nueva fecha en la columna Cierre."}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-8 text-[13px]"
            onClick={() => onDateEditCancel?.()}
          >
            Cancelar
          </Button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-y border-border/60">
        {visibleRows.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={ListChecks}
              title={onlySelected ? "Aún no has seleccionado nada" : "Sin encuestas que coincidan"}
              description={
                onlySelected
                  ? "Vuelve a la lista completa para seleccionar encuestas."
                  : "Prueba con otro término o cambia los filtros."
              }
              className="border-none bg-transparent shadow-none"
              action={
                !onlySelected && hasActiveFilters ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setQuery("");
                      onFiltersChange(NO_FILTERS);
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
          <div className="relative w-full flex-1 min-h-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-px pl-4 pr-3">
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
                  <TableHead className="w-[30%] px-2 py-3">
                    {/* No filter menu: every name is unique, so a checklist of
                        them would just be the table again. Search covers it. */}
                    <SortOnlyHeader
                      label="Nombre"
                      sortActive={sort.key === "name"}
                      onSort={() => toggleSort("name")}
                    />
                  </TableHead>
                  <TableHead className="w-[13%] px-2 py-3">
                    <FilterSortHeader
                      label="Tipo"
                      options={availableTypes}
                      selected={new Set(filters.type)}
                      onToggleFilter={(value) => toggleColumn("type", value)}
                      onClearFilter={() => clearColumn("type")}
                      sortActive={sort.key === "type"}
                      onSort={() => toggleSort("type")}
                    />
                  </TableHead>
                  <TableHead className="w-[14%] px-2 py-3">
                    <FilterSortHeader
                      label="Estado"
                      options={availableStatuses}
                      selected={new Set(filters.status)}
                      onToggleFilter={(value) => toggleColumn("status", value)}
                      onClearFilter={() => clearColumn("status")}
                      sortActive={sort.key === "status"}
                      onSort={() => toggleSort("status")}
                    />
                  </TableHead>
                  <TableHead className="w-[110px] px-2 py-3">
                    <SortOnlyHeader
                      label="Inicio"
                      sortActive={sort.key === "startDate"}
                      onSort={() => toggleSort("startDate")}
                    />
                  </TableHead>
                  <TableHead className="w-[110px] px-2 py-3">
                    <FilterSortHeader
                      label="Cierre"
                      options={CLOSE_BUCKETS}
                      selected={new Set(filters.close)}
                      onToggleFilter={(value) => toggleColumn("close", value)}
                      onClearFilter={() => clearColumn("close")}
                      sortActive={sort.key === "endDate"}
                      onSort={() => toggleSort("endDate")}
                    />
                  </TableHead>
                  <TableHead className="w-[90px] px-2 py-3 text-right xl:w-[150px]">
                    <SortOnlyHeader
                      label={
                        <>
                          <span className="hidden xl:inline">Participantes</span>
                          <span className="xl:hidden">Part.</span>
                        </>
                      }
                      sortActive={sort.key === "participants"}
                      onSort={() => toggleSort("participants")}
                      align="right"
                    />
                  </TableHead>
                  <TableHead className="w-[220px] py-3 pl-0 pr-4">
                    <FilterSortHeader
                      label="Avance"
                      options={PROGRESS_BUCKETS}
                      selected={new Set(filters.progress)}
                      onToggleFilter={(value) => toggleColumn("progress", value)}
                      onClearFilter={() => clearColumn("progress")}
                      sortActive={sort.key === "progress"}
                      onSort={() => toggleSort("progress")}
                      align="right"
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedRows.map((survey) => (
                  <SurveyRow
                    key={survey.id}
                    survey={survey}
                    isNew={newSurveyIds.has(survey.id)}
                    isSelected={selectedIds.has(survey.id)}
                    onToggle={() => toggleOne(survey.id)}
                    onOpen={() => onOpenSurvey(survey.id)}
                    editMode={dateEdit?.surveyId === survey.id ? dateEdit.mode : null}
                    // While one row is being edited the rest step back, so
                    // the date being chosen stays legible against its own
                    // row instead of a wall of twenty others.
                    dimmed={editingId != null && editingId !== survey.id}
                    onDateStart={(mode) => onDateEditStart?.(survey.id, mode)}
                    onDateSave={(date) => onDateEditSave?.(survey.id, date)}
                    onDateCancel={() => onDateEditCancel?.()}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 p-4">
        <p className="text-[12px] text-muted-foreground">
          {visibleRows.length === 0
            ? "0 encuestas"
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
              aria-label="Encuestas por página"
              className="h-8 w-[130px] rounded-lg px-2.5 text-[12px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6}>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-[13px]">
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

function SurveyRow({
  survey,
  isNew,
  isSelected,
  onToggle,
  onOpen,
  editMode,
  dimmed,
  onDateStart,
  onDateSave,
  onDateCancel,
}: {
  survey: SurveyListRow;
  isNew?: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  /** Set while this row's closing date is being changed. */
  editMode: DateEditMode | null;
  /** Another row is being edited, so this one steps out of the way. */
  dimmed: boolean;
  onDateStart: (mode: DateEditMode) => void;
  onDateSave: (date: Date) => void;
  onDateCancel: () => void;
}) {
  const animatedProgress = useAnimatedValue(survey.progress, 1000);
  const isEditing = editMode !== null;

  // A survey cannot close before it opened, nor in the past while it is still
  // collecting. Reopening goes further: a closing date of today would reopen
  // and shut it in the same breath, so the earliest useful day is tomorrow.
  const closeDateFloor = React.useMemo(() => {
    const today = startOfToday();
    if (editMode === "reopen") {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    const start = parseSurveyDate(survey.startDate);
    return start && start > today ? start : today;
  }, [editMode, survey.startDate]);

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      onClick={isEditing ? undefined : onToggle}
      className={cn(
        "group border-border/60",
        isEditing
          ? "bg-primary/[0.04] shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
          : "cursor-pointer hover:bg-muted/30",
        dimmed && "pointer-events-none opacity-35",
        (isNew || survey.id === "survey-forced") && "animate-highlight-row transition-none"
      )}
    >
      <TableCell className="pl-4 pr-3">
        <div className="flex items-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            // Deselecting mid-edit would take the rail — and with it the
            // edit's only owner — out from under an unsaved date.
            disabled={isEditing}
            aria-label={`Seleccionar ${survey.name}`}
          />
        </div>
      </TableCell>
      <TableCell className="py-3">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          // Navigating away mid-edit would silently drop the date being picked.
          disabled={isEditing}
          className="truncate text-left text-[13px] font-semibold text-text-primary transition-colors hover:text-primary hover:underline disabled:cursor-default disabled:no-underline disabled:hover:text-text-primary"
        >
          {survey.name}
        </button>
      </TableCell>
      <TableCell className="py-3 text-[13px] text-muted-foreground">
        <span className="block truncate">{survey.type}</span>
      </TableCell>
      <TableCell className="py-3">
        <StatusBadge 
          state={mapVariantToState(statusVariant(survey))} 
          labels={{ [mapVariantToState(statusVariant(survey))]: survey.status }} 
        />
      </TableCell>
      <TableCell className="px-2 py-3 text-[13px] tabular-nums text-muted-foreground">
        {isEditing && editMode === "editStartDate" ? (
          <SurveyDateCell
            value={survey.startDate}
            mode={editMode}
            minDate={new Date(0)}
            onSave={onDateSave}
            onCancel={onDateCancel}
          />
        ) : (
          <button
            type="button"
            className="w-full text-left outline-none hover:text-primary transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded disabled:pointer-events-none"
            onClick={(e) => { e.stopPropagation(); onDateStart("editStartDate"); }}
            disabled={isEditing}
          >
            {survey.startDate}
          </button>
        )}
      </TableCell>
      <TableCell className="px-2 py-3 text-[13px] tabular-nums text-muted-foreground">
        {isEditing && (editMode === "editEndDate" || editMode === "reopen" || editMode === "editDates") ? (
          <SurveyDateCell
            value={survey.endDate}
            mode={editMode}
            minDate={closeDateFloor}
            onSave={onDateSave}
            onCancel={onDateCancel}
          />
        ) : (
          <button
            type="button"
            className="w-full text-left outline-none hover:text-primary transition-colors focus-visible:ring-1 focus-visible:ring-primary rounded disabled:pointer-events-none"
            onClick={(e) => { e.stopPropagation(); onDateStart("editEndDate"); }}
            disabled={isEditing}
          >
            {survey.endDate}
          </button>
        )}
      </TableCell>
      <TableCell className="px-2 py-3 text-right text-[13px] font-semibold tabular-nums text-text-primary">
        {survey.participants}
      </TableCell>
      <TableCell className="w-[220px] py-3 pr-4">
        <div className="flex items-center justify-end gap-3">
          <Progress
            value={animatedProgress}
            className="h-1.5 w-32 shrink-0 [&>div]:transition-none"
          />
          <span className="min-w-[44px] text-right text-[12px] tabular-nums text-text-secondary">
            {Math.round(animatedProgress)}%
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}
