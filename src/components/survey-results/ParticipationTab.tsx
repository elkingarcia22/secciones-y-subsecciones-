import * as React from "react";
import { ArrowUpDown, CheckCircle2, Clock3, Info, Search, UserX, Users, X, CheckIcon, ChevronDown, Eye, EyeOff, MinusIcon, Bell, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MiniMetricCard, AnimatedNumber } from "./MiniMetricCard";
import { useAnimatedValue } from "@/lib/useAnimatedValue";
import { COLLABORATORS } from "@/mocks/collaborators";
import {
  participationBySegment,
  type ParticipationRow,
  type SegmentDefinition,
  type SurveyResults,
} from "@/mocks/surveyResults";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PagerButton } from "@/components/survey-builder/CollaboratorTableParts";
import {
  FilterSortHeader,
  SelectionHeaderMenu,
  SortOnlyHeader,
} from "@/components/data-display";
import { 
  formatPercent,
  POSITIVE_BG, POSITIVE_TEXT, POSITIVE_BORDER,
  YELLOW_BG, YELLOW_TEXT, YELLOW_BORDER,
  NEGATIVE_BG, NEGATIVE_TEXT, NEGATIVE_BORDER
} from "./favorabilityScale";
import { FormulaBlock } from "./FormulaBlock";

interface ParticipationTabProps {
  results: SurveyResults;
  segment: SegmentDefinition;
  onSegmentChange: (key: string) => void;
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: ReadonlySet<string>) => void;
}

/** Below this, a group needs a nudge rather than a report. */
const PARTICIPATION_TARGET = 70;

/** Matches the directory pager in the participants step. */
const PAGE_SIZES = [10, 25, 50] as const;

type SortKey = "rate" | "invited" | "inProgress" | "missing" | "label" | "leader" | "area" | "estado";

/**
 * Participation, by group.
 *
 * Sorted by the lowest participation first, because that is the only order this
 * table can be acted on: a list of a hundred groups sorted alphabetically —
 * which is what the reference shows — makes the reader scan every row to find
 * the four that need a reminder. The gap is stated in people, not only in
 * percent: "faltan 12 personas" is something you can go and do something about,
 * "88,7%" is not.
 */
export function ParticipationTab({ results, segment, onSegmentChange, selectedIds, onSelectionChange }: ParticipationTabProps) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [sort, setSort] = React.useState<{ key: SortKey; ascending: boolean }>({
    key: "rate",
    ascending: true,
  });
  const [pageSize, setPageSize] = React.useState<number>(PAGE_SIZES[0]);
  
  const [onlySelected, setOnlySelected] = React.useState(false);

  const [leaderFilter, setLeaderFilter] = React.useState<ReadonlySet<string>>(new Set());
  const [areaFilter, setAreaFilter] = React.useState<ReadonlySet<string>>(new Set());
  const [estadoFilter, setEstadoFilter] = React.useState<ReadonlySet<string>>(new Set());
  // Which groups (areas, countries, leaders…) to show for the current segment.
  // Empty is the canonical "nothing excluded" state — every option renders
  // checked and no row is filtered out, rather than the opposite convention
  // the other filters use where empty means "none picked yet".
  const [groupFilter, setGroupFilter] = React.useState<ReadonlySet<string>>(new Set());

  const toggleLeaderFilter = (value: string) => {
    setLeaderFilter(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };
  const toggleAreaFilter = (value: string) => {
    setAreaFilter(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };
  const toggleEstadoFilter = (value: string) => {
    setEstadoFilter(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };
  const toggleGroupFilter = (value: string, allLabels: readonly string[]) => {
    setGroupFilter(prev => {
      // Unchecking the first box has nothing explicit to start from — spell
      // out everyone-but-this-one so the box that was clicked is the one
      // that turns off.
      const next = prev.size === 0 ? new Set(allLabels) : new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      // Back to everyone checked collapses to the canonical empty state.
      return next.size === allLabels.length ? new Set() : next;
    });
  };

  const rows = React.useMemo(() => participationBySegment(results, segment), [results, segment]);

  const availableLeaders = React.useMemo(() => {
    if (!segment.perPerson) return [];
    const leaders = new Set<string>();
    rows.forEach(r => {
      const p = COLLABORATORS.find((p) => p.name === r.label);
      if (p?.leader) leaders.add(p.leader);
      else leaders.add("—");
    });
    return Array.from(leaders).sort();
  }, [rows, segment.perPerson]);

  const availableAreas = React.useMemo(() => {
    if (!segment.perPerson) return [];
    const areas = new Set<string>();
    rows.forEach(r => {
      const p = COLLABORATORS.find((p) => p.name === r.label);
      if (p?.area) areas.add(p.area);
      else areas.add("—");
    });
    return Array.from(areas).sort();
  }, [rows, segment.perPerson]);
  
  const availableEstados = ["Completado", "En progreso", "Falta"];

  const availableGroupLabels = React.useMemo(
    () => (segment.perPerson ? [] : segment.options.map((option) => option.label)),
    [segment]
  );

  const visibleRows = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (needle && !row.label.toLowerCase().includes(needle)) return false;
      if (onlySelected && !selectedIds.has(row.id)) return false;
      
      let rowEstado = "";

      if (segment.perPerson) {
        const person = COLLABORATORS.find((p) => p.name === row.label);
        const personLeader = person?.leader || "—";
        const personArea = person?.area || "—";
        rowEstado = row.completed > 0 ? "Completado" : row.inProgress > 0 ? "En progreso" : "Falta";
        
        if (leaderFilter.size > 0 && !leaderFilter.has(personLeader)) return false;
        if (areaFilter.size > 0 && !areaFilter.has(personArea)) return false;
        if (estadoFilter.size > 0 && !estadoFilter.has(rowEstado)) return false;
      } else {
        const isCompleted = row.completed === row.invited;
        const isNotStarted = row.completed === 0 && row.inProgress === 0;
        rowEstado = isCompleted ? "Completado" : isNotStarted ? "Falta" : "En progreso";
        if (groupFilter.size > 0 && !groupFilter.has(row.label)) return false;
        if (estadoFilter.size > 0 && !estadoFilter.has(rowEstado)) return false;
      }

      return true;
    });
    const direction = sort.ascending ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const getFields = (r: ParticipationRow) => {
        if (segment.perPerson) {
          const person = COLLABORATORS.find((p) => p.name === r.label);
          const leader = person?.leader || "—";
          const area = person?.area || "—";
          const estado = r.completed > 0 ? "Completado" : r.inProgress > 0 ? "En progreso" : "Falta";
          return { leader, area, estado };
        } else {
          const isCompleted = r.completed === r.invited;
          const isNotStarted = r.completed === 0 && r.inProgress === 0;
          const estado = isCompleted ? "Completado" : isNotStarted ? "Falta" : "En progreso";
          return { leader: "", area: "", estado };
        }
      };

      if (sort.key === "label") return a.label.localeCompare(b.label) * direction;
      if (sort.key === "invited") return (a.invited - b.invited) * direction;
      if (sort.key === "rate") return (a.rate - b.rate) * direction;
      if (sort.key === "inProgress") return (a.inProgress - b.inProgress) * direction;
      if (sort.key === "missing") {
        const aMissing = a.invited - a.completed - a.inProgress;
        const bMissing = b.invited - b.completed - b.inProgress;
        return (aMissing - bMissing) * direction;
      }
      
      const aFields = getFields(a);
      const bFields = getFields(b);

      if (sort.key === "leader") return aFields.leader.localeCompare(bFields.leader) * direction;
      if (sort.key === "area") return aFields.area.localeCompare(bFields.area) * direction;
      if (sort.key === "estado") return aFields.estado.localeCompare(bFields.estado) * direction;
      
      return 0;
    });
  }, [rows, query, sort, onlySelected, selectedIds, segment.perPerson, leaderFilter, areaFilter, estadoFilter, groupFilter]);

  // A different list (new search, new segment or new order) starts at the top.
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const pagedRows = visibleRows.slice(firstIndex, firstIndex + pageSize);

  const handleSegmentChange = (key: string) => {
    setPage(1);
    onSelectionChange(new Set());
    setOnlySelected(false);
    setGroupFilter(new Set());
    onSegmentChange(key);
  };

  const toggleSort = (key: SortKey) => {
    setPage(1);
    setSort((current) =>
      current.key === key
        ? { key, ascending: !current.ascending }
        : { key, ascending: key !== "invited" && key !== "inProgress" && key !== "missing" }
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

  const allMatchesSelected = visibleRows.length > 0 && visibleRows.every((r) => selectedIds.has(r.id));
  const isPageFullySelected = pagedRows.length > 0 && selectedOnPage === pagedRows.length;
  
  const showSelectPage = pagedRows.length > 0 && !isPageFullySelected;
  const showDeselectPage = isPageFullySelected;
  const showSelectAll = visibleRows.length > 0 && !allMatchesSelected;
  const showDeselectAll = allMatchesSelected;

  const { completed, inProgress, invited } = results.participation;
  const missing = Math.max(0, invited - completed - inProgress);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        {/* Métricas de participación — mismas tarjetas que las de favorabilidad */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MiniMetricCard
            icon={Users}
            label="Total de participación"
            value={<AnimatedNumber value={results.participation.rate} format={formatPercent} />}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[400px] p-4 bg-slate-900 text-slate-100 shadow-xl border-none"
              >
                <div className="flex flex-col gap-3 items-start leading-relaxed">
                  <p className="text-[12px]">
                    <strong>Participación:</strong>
                    <br />
                    Es el porcentaje de personas invitadas que completaron la encuesta.
                  </p>
                  <FormulaBlock
                    numerator="Personas que completaron"
                    denominator="Personas invitadas"
                    result="% de participación"
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          </MiniMetricCard>

          <MiniMetricCard
            icon={CheckCircle2}
            label="Completadas"
            value={<AnimatedNumber value={completed} format={formatCount} />}
            color={POSITIVE_TEXT}
          />
          <MiniMetricCard
            icon={Clock3}
            label="En progreso"
            value={<AnimatedNumber value={inProgress} format={formatCount} />}
            color={YELLOW_TEXT}
          />
          <MiniMetricCard
            icon={UserX}
            label="Faltan"
            value={<AnimatedNumber value={missing} format={formatCount} />}
            color={NEGATIVE_TEXT}
          />
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-border/50 bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-bold text-text-primary">
                Detalle de la participación por {segment.label.toLowerCase()}
              </h3>
              <Badge variant="neutral" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
                {visibleRows.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
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
                  placeholder={`Busca por ${segment.label.toLowerCase()}`}
                  aria-label={`Buscar en ${segment.label}`}
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
                  (selectedIds.size > 0 || onlySelected)
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
                  {onlySelected ? "Ver todos" : `Ver seleccionados (${formatCount(selectedIds.size)})`}
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-[12.5px] font-medium text-muted-foreground">Ver por:</span>
                <Select value={segment.key} onValueChange={handleSegmentChange}>
                  <SelectTrigger className="h-9 w-[160px] rounded-lg border-border bg-surface px-3 text-[12.5px] transition-colors hover:bg-border/30 focus:ring-2 focus:ring-primary/20">
                    <SelectValue className="truncate text-text-primary" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {results.segments.map((s) => (
                      <SelectItem key={s.key} value={s.key} className="text-[13px]">
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        <div className="overflow-hidden rounded-xl border border-border/60">
          {visibleRows.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title={onlySelected ? "Aún no has seleccionado nada" : "Sin grupos que coincidan"}
                description={onlySelected ? "Vuelve a la lista completa para seleccionar grupos." : "Prueba con otro término o cambia los filtros."}
                className="border-none bg-transparent shadow-none"
                action={
                  (!onlySelected && (query !== "" || areaFilter.size > 0 || leaderFilter.size > 0 || estadoFilter.size > 0)) ? (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setQuery("");
                        setAreaFilter(new Set());
                        setLeaderFilter(new Set());
                        setEstadoFilter(new Set());
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
            <div className="relative overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-16 px-0">
                      <SelectionHeaderMenu
                        state={headerState}
                        pageCount={pagedRows.length}
                        matchCount={visibleRows.length}
                        showSelectPage={showSelectPage}
                        showSelectAll={showSelectAll}
                        showDeselectPage={showDeselectPage}
                        showDeselectAll={showDeselectAll}
                        onSelectPage={selectPage}
                        onSelectAll={selectAllMatches}
                        onDeselectPage={deselectPage}
                        onDeselectAll={clearSelection}
                        formatCount={formatCount}
                      />
                    </TableHead>
                    <TableHead className={cn("py-3.5 px-0", segment.perPerson ? "w-[34%]" : "w-[25%]")}>
                      <FilterSortHeader
                        label={segment.label}
                        options={availableGroupLabels}
                        selected={groupFilter}
                        onToggleFilter={(value) => toggleGroupFilter(value, availableGroupLabels)}
                        onClearFilter={() => setGroupFilter(new Set())}
                        sortActive={sort.key === "label"}
                        onSort={() => toggleSort("label")}
                        defaultAllSelected
                      />
                    </TableHead>
                    {segment.perPerson && (
                      <>
                        <TableHead className="w-[23%] py-3.5 px-0">
                          <FilterSortHeader
                            label="Líder"
                            options={availableLeaders}
                            selected={leaderFilter}
                            onToggleFilter={toggleLeaderFilter}
                            onClearFilter={() => setLeaderFilter(new Set())}
                            sortActive={sort.key === "leader"}
                            onSort={() => toggleSort("leader")}
                          />
                        </TableHead>
                        <TableHead className="w-[23%] py-3.5 px-0">
                          <FilterSortHeader
                            label="Área"
                            options={availableAreas}
                            selected={areaFilter}
                            onToggleFilter={toggleAreaFilter}
                            onClearFilter={() => setAreaFilter(new Set())}
                            sortActive={sort.key === "area"}
                            onSort={() => toggleSort("area")}
                          />
                        </TableHead>
                      </>
                    )}
                    <TableHead
                      className={cn(
                        "py-3.5",
                        segment.perPerson ? "pl-0 pr-6" : "w-[140px] px-0"
                      )}
                    >
                      <FilterSortHeader
                        label="Estado"
                        options={availableEstados}
                        selected={estadoFilter}
                        onToggleFilter={toggleEstadoFilter}
                        onClearFilter={() => setEstadoFilter(new Set())}
                        sortActive={sort.key === "estado"}
                        onSort={() => toggleSort("estado")}
                        align={segment.perPerson ? "right" : "left"}
                      />
                    </TableHead>
                    {!segment.perPerson && (
                      <>
                        <TableHead className="w-[120px] py-3.5 px-2 text-right">
                          <SortOnlyHeader
                            label="Respondieron"
                            sortActive={sort.key === "invited"}
                            onSort={() => toggleSort("invited")}
                            align="right"
                          />
                        </TableHead>
                        <TableHead className="w-[100px] py-3.5 px-2 text-right">
                          <SortOnlyHeader
                            label="En progreso"
                            sortActive={sort.key === "inProgress"}
                            onSort={() => toggleSort("inProgress")}
                            align="right"
                          />
                        </TableHead>
                        <TableHead className="w-[90px] py-3.5 px-2 text-right">
                          <SortOnlyHeader
                            label="Faltan"
                            sortActive={sort.key === "missing"}
                            onSort={() => toggleSort("missing")}
                            align="right"
                          />
                        </TableHead>
                        <TableHead className="w-[220px] py-3.5 pl-0 pr-6">
                          <SortOnlyHeader
                            label="Participación"
                            sortActive={sort.key === "rate"}
                            onSort={() => toggleSort("rate")}
                            align="right"
                          />
                        </TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((row) =>
                    segment.perPerson ? (
                      <PersonRow
                        key={row.id}
                        row={row}
                        isSelected={selectedIds.has(row.id)}
                        onToggle={() => toggleOne(row.id)}
                      />
                    ) : (
                      <GroupRow
                        key={row.id}
                        row={row}
                        isSelected={selectedIds.has(row.id)}
                        onToggle={() => toggleOne(row.id)}
                      />
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            {visibleRows.length === 0
              ? "0 grupos"
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
                aria-label="Grupos por página"
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
      </div>
    </div>
  );
}



function GroupRow({ row, isSelected, onToggle }: { row: ParticipationRow; isSelected: boolean; onToggle: () => void }) {
  const missing = row.invited - row.completed - row.inProgress;
  // A group that hasn't started reads as neutral, not urgent — the warning
  // color is for a group falling behind, not one that is simply at zero yet.
  const isLow = row.rate > 0 && row.rate < PARTICIPATION_TARGET;
  const animatedRate = useAnimatedValue(row.rate, 1000);

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      onClick={onToggle}
      className="cursor-pointer border-border/50 hover:bg-muted/30 transition-colors group"
    >
      <TableCell className="px-0">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Seleccionar grupo ${row.label}`}
          />
        </div>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-text-secondary">{row.label}</span>
          {missing > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Acción de enviar recordatorio
              }}
              aria-label={`Enviar recordatorio a ${row.label}`}
              className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-border/60 hover:text-text-primary group-hover:opacity-100"
            >
              <Bell className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </TableCell>
      <TableCell className="py-3">
        {row.completed === row.invited ? (
          <Badge variant="positive">Completado</Badge>
        ) : row.completed === 0 && row.inProgress === 0 ? (
          <Badge variant="negative">Falta</Badge>
        ) : (
          <Badge variant="warning">En progreso</Badge>
        )}
      </TableCell>
      <TableCell className="w-[120px] py-3 text-right tabular-nums text-[12.5px] text-text-secondary">
        <span className="font-semibold text-text-primary">{row.completed}</span>
        <span> / {row.invited}</span>
      </TableCell>
      <TableCell className="w-[110px] py-3 text-right tabular-nums text-[12.5px] text-muted-foreground">
        {row.inProgress === 0 ? "—" : row.inProgress}
      </TableCell>
      <TableCell className="w-[100px] py-3 text-right tabular-nums text-[12.5px] text-muted-foreground">
        {missing === 0 ? "—" : missing}
      </TableCell>
      <TableCell className="w-[220px] py-3 pr-6">
        <div className="flex items-center justify-end gap-3">
          <Progress value={animatedRate} color={isLow ? "warning" : "primary"} className="h-1.5 w-32 shrink-0 [&>div]:transition-none" />
          <span
            className={cn(
              "min-w-[44px] text-right text-[12px] tabular-nums text-text-secondary",
              isLow ? "text-status-warning font-semibold" : ""
            )}
          >
            {formatPercent(animatedRate)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

/** Column header that toggles the sort, in the table's own header type scale. */
function formatCount(n: number) {
  return new Intl.NumberFormat("es-CO").format(n);
}

function PersonRow({ row, isSelected, onToggle }: { row: ParticipationRow; isSelected: boolean; onToggle: () => void }) {
  const isCompleted = row.completed > 0;
  const isInProgress = row.inProgress > 0;
  const person = COLLABORATORS.find((p) => p.name === row.label);
  
  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      onClick={onToggle}
      className="cursor-pointer border-border/50 hover:bg-muted/30 transition-colors group"
    >
      <TableCell className="px-0">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Seleccionar participante ${row.label}`}
          />
        </div>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12.5px] text-text-secondary">{row.label}</span>
          {!isCompleted && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                // Acción de enviar recordatorio
              }}
              aria-label={`Enviar recordatorio a ${row.label}`}
              className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-border/60 hover:text-text-primary group-hover:opacity-100"
            >
              <Bell className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </TableCell>
      <TableCell className="py-3 text-[12.5px] text-muted-foreground">
        <span className="block truncate">{person?.leader ?? "—"}</span>
      </TableCell>
      <TableCell className="py-3 text-[12.5px] text-muted-foreground">
        <span className="block truncate">{person?.area ?? "—"}</span>
      </TableCell>
      <TableCell className="py-3 pl-0 pr-6">
        <div className="flex justify-end">
          {isCompleted ? (
            <Badge variant="positive">Completado</Badge>
          ) : isInProgress ? (
            <Badge variant="warning">En progreso</Badge>
          ) : (
            <Badge variant="negative">Falta</Badge>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
