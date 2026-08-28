import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Crosshair,
  Grid2X2,
  HelpCircle,
  ListFilter,
  Lock,
  MessageSquareText,
  RotateCcw,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/feedback";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  heatmapBySegment,
  type HeatmapRow,
  type SegmentDefinition,
  type SurveyResults,
} from "@/mocks/surveyResults";
import { ScoreChip } from "./ScoreChip";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import { bandForScore, FAVORABILITY_SCALE_LEGEND, formatScore, tierForScore } from "./favorabilityScale";
import { ResultsFilterChips, ResultsFilterControls } from "./ResultsFilterToolbar";
import { ResultsSubTabSwitch, type ResultsSubTab } from "./ResultsSubTabSwitch";
import type { ResultsFiltersState } from "./useResultsFilters";
import { levelForDepth, type ResultLevel } from "./resultLevels";

interface HeatmapTabProps {
  results: SurveyResults;
  segments: readonly SegmentDefinition[];
  activeSegment: SegmentDefinition;
  filtersState: ResultsFiltersState;
  onSubTabChange: (tab: ResultsSubTab) => void;
}

/**
 * A per-person breakdown does not belong in a grid: each column would hold a
 * single response, so the anonymity threshold masks almost every cell and the
 * "total" column is the only readable number. The survey ships such a segment
 * — "Colaborador" is how the participation view answers "¿quién falta?" — so
 * the grid refuses it by the flag on the definition itself and never offers
 * it in "Ver por". The refusal travels with the data, so a future personal
 * segment is excluded by the same rule without a key list to keep in sync.
 */

const round1 = (value: number): number => Math.round(value * 10) / 10;

function formatCount(n: number) {
  return new Intl.NumberFormat("es-CO").format(n);
}

/** The hierarchy levels the grid can show, each toggleable on its own. */
type HeatmapLevel = ResultLevel;

const levelOf = (row: HeatmapRow): HeatmapLevel =>
  row.kind === "question" ? "question" : levelForDepth(row.depth);

/** Every section id in a subtree, the row itself first. */
function collectSectionIds(row: HeatmapRow): string[] {
  return row.children.flatMap((child) =>
    child.kind === "section" ? [child.id, ...collectSectionIds(child)] : []
  );
}

/**
 * Section × segment heatmap, styled as the participation table's sibling.
 *
 * Same container and the same "Ver por" select — the two tabs read as one
 * screen instead of two designs. The breakdowns are the survey's own
 * demographics, minus the per-person ones: a grid of eighteen rows by ten
 * columns already holds a hundred and eighty numbers, and a reader can hold
 * about three, so the tree starts collapsed to its seven roots — except for
 * the first one, which opens complete with its questions, as the example of
 * what the grid can show.
 *
 * The rows walk the survey's own tree, section and question alike: every
 * section expands into its questions and subsections, and a question is a leaf
 * row that behaves like the section rows around it — same cells, same bands,
 * same "Resaltar solo". A question with nothing on the 1–5 scale (an open
 * text, a choice, an NPS) reads as "Sin escala" instead of borrowing a band
 * that means nothing.
 *
 * "Niveles" picks which of the four levels — Secciones, Subsecciones,
 * Sub-subsecciones, Preguntas — show their numbers in the grid. The tree never
 * loses a row: an unselected level keeps its place as structure, with its total
 * and results blank, so the hierarchy stays readable and only the levels you
 * chose carry the data.
 *
 * The first column stays put while the rest scrolls. Without that, scrolling to
 * the tenth group means reading numbers whose row you can no longer see — which
 * is the failure mode of every wide heatmap.
 */
export function HeatmapTab({
  results,
  segments,
  activeSegment,
  filtersState,
  onSubTabChange,
}: HeatmapTabProps) {
  const {
    filters,
    filterableSegments,
    applyFilter,
    removeFilter,
    clearFilters,
    handleSegmentChange,
    visibleLevels,
    hasHiddenLevels,
    toggleLevel,
    resetLevels,
    highlightBands,
    tierBands,
    hasHiddenBands,
    toggleBand,
    resetBands,
    highlightedRows,
    hasHighlights,
    toggleRowHighlight: toggleRowHighlightIds,
    resetHighlights,
  } = filtersState;

  const heatmap = React.useMemo(
    () => heatmapBySegment(results, activeSegment, filters),
    [results, activeSegment, filters]
  );
  const rowsById = React.useMemo(() => {
    const map = new Map<string, HeatmapRow>();
    const walk = (row: HeatmapRow) => {
      map.set(row.id, row);
      row.children.forEach(walk);
    };
    heatmap.rows.forEach(walk);
    return map;
  }, [heatmap.rows]);

  // The first section of the grid starts open with its whole subtree — questions
  // and all — so the view opens on a complete example of what the heatmap can
  // show. From then on the expand/collapse state is entirely the user's.
  const firstSectionIds = React.useMemo(
    () =>
      heatmap.rows.length > 0 ? [heatmap.rows[0].id, ...collectSectionIds(heatmap.rows[0])] : [],
    [heatmap.rows]
  );
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(
    () => (firstSectionIds.length > 0 ? new Set(firstSectionIds) : new Set())
  );

  // The header totals average only the section rows whose level is on — a
  // hidden level keeps its row as structure but contributes no numbers.
  const sectionRows = React.useMemo(() => {
    const rows: HeatmapRow[] = [];
    const walk = (row: HeatmapRow) => {
      if (row.kind === "section") rows.push(row);
      row.children.forEach(walk);
    };
    heatmap.rows.forEach(walk);
    return rows;
  }, [heatmap.rows]);

  const displayTotals = React.useMemo(() => {
    const visibleSections = sectionRows.filter((row) => visibleLevels.has(levelOf(row)));
    return heatmap.columns.map((_, index) => {
      const visible = visibleSections
        .map((row) => row.cells[index].score)
        .filter((score): score is number => score !== null);
      return visible.length === 0
        ? null
        : round1(visible.reduce((sum, score) => sum + score, 0) / visible.length);
    });
  }, [heatmap.columns, sectionRows, visibleLevels]);

  // Columns are rendered in segment order — the index ties a cell back to its
  // group, so the same order feeds headers and rows.
  const columnOrder = heatmap.columns.map((_, index) => index);

  const toggleRow = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Activating a section highlights it together with its whole subtree — its
  // questions and subsections alike; deactivating one clears the whole
  // subtree. Individual rows can still be toggled by hand afterwards.
  const toggleRowHighlight = (id: string) => {
    const row = rowsById.get(id);
    toggleRowHighlightIds(row ? [id, ...collectDescendantIds(row)] : [id]);
  };

  const scoredTotals = displayTotals.filter((total): total is number => total !== null);

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card sm:p-8">
      <div className="sticky top-3 z-30 -mt-6 pt-6 sm:-mt-8 sm:pt-8 bg-surface">
        <div className="flex flex-wrap items-center gap-4 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-text-primary">
              Detalle del heatmap por {activeSegment.label.toLowerCase()}
            </h3>
            <Badge variant="neutral" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
              {heatmap.columns.length}
            </Badge>
          </div>
          <div className="flex items-center justify-end gap-3 ml-auto">
            <ResultsFilterControls
              segments={segments}
              activeSegment={activeSegment}
              onSegmentChange={handleSegmentChange}
              filterableSegments={filterableSegments}
              filters={filters}
              onApplyFilter={applyFilter}
              onClearFilters={clearFilters}
              visibleLevels={visibleLevels}
              hasHiddenLevels={hasHiddenLevels}
              onToggleLevel={toggleLevel}
              onResetLevels={resetLevels}
              highlightBands={highlightBands} tierBands={tierBands}
              hasHiddenBands={hasHiddenBands}
              onToggleBand={toggleBand}
              onResetBands={resetBands}
            />
            <ResultsSubTabSwitch value="heatmap" onChange={onSubTabChange} />
            <MeasurementScaleButton
              items={FAVORABILITY_SCALE_LEGEND}
              title="Escala de favorabilidad"
              description="Cada celda es el promedio de las respuestas en escala 1 a 5 de ese cruce, y la banda es el tramo en el que cae ese promedio. Los NS/NR no entran en el promedio: se muestran aparte."
            />
          </div>
        </div>

        <ResultsFilterChips
          filters={filters}
          segments={segments}
          onRemoveFilter={removeFilter}
          onClearFilters={clearFilters}
        />
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60">
        {heatmap.rows.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Grid2X2}
              title="Sin secciones con resultados"
              description="Esta encuesta no tiene secciones ni preguntas en la escala de 1 a 5."
              className="border-none bg-transparent shadow-none"
            />
          </div>
        ) : (
          <div className="relative w-full overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="sticky left-0 z-20 w-[260px] min-w-[260px] border-r border-border/60 bg-muted-solid pl-7 pr-3 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="flex items-center gap-2">
                      Sección
                      {hasHighlights && (
                        <button
                          type="button"
                          onClick={resetHighlights}
                          aria-label="Restablecer vista"
                          title="Restablecer vista"
                          className="ml-auto flex h-6 w-6 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition-colors hover:border-border hover:bg-border/40 hover:text-text-primary"
                        >
                          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[90px] border-r border-border/60 py-4 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help items-center gap-1 justify-end">
                          Total
                          <HelpCircle className="h-3 w-3" strokeWidth={2} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[360px] flex-col items-start gap-2 text-[12px] leading-relaxed"
                      >
                        <p>
                          Promedio de favorabilidad de la sección en la escala de 1 a 5, sin dividir
                          por grupos: una mirada rápida a cómo se siente la sección en conjunto.
                        </p>
                        <div className="flex w-full flex-col gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                            Fórmula
                          </span>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <div className="flex flex-col items-center text-center">
                              <span className="border-b border-current px-2 pb-0.5 leading-tight">
                                Respuestas favorables
                              </span>
                              <span className="px-2 pt-0.5 leading-tight opacity-80">
                                Total de respuestas
                              </span>
                            </div>
                            <span className="text-[13px] font-semibold">× 100</span>
                            <span className="text-[13px] font-semibold">=</span>
                            <span className="font-semibold">% de favorabilidad</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                  {columnOrder.map((index) => (
                    <TableHead
                      key={heatmap.columns[index].id}
                      className="w-[108px] max-w-[108px] py-4 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block truncate">{heatmap.columns[index].label}</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-[12px]">
                          {heatmap.columns[index].label}
                          {displayTotals[index] !== null && (
                            <span className="font-semibold">
                              {" "}
                              · total {formatScore(displayTotals[index] as number)}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {heatmap.rows.map((root) => (
                  <RowNode
                    key={root.id}
                    row={root}
                    columnOrder={columnOrder}
                    expanded={expanded}
                    onToggle={toggleRow}
                    highlightBands={highlightBands} tierBands={tierBands}
                    highlightedRows={highlightedRows}
                    onRowHighlight={toggleRowHighlight}
                    visibleLevels={visibleLevels}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Icon + value + label, in the same rhythm as the participation summary. */
function InlineMetric({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className={cn("h-3.5 w-3.5", className)} strokeWidth={2} />
      <span className="text-[13px] font-semibold tabular-nums text-text-primary">{value}</span>
      <span className="text-[13px] text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * One node of the heatmap tree and, when its section is open, its children.
 *
 * A section expands into its questions and subsections, each rendered as its
 * own node, so the table walks the survey's own tree. Questions are leaves.
 */
function RowNode({
  row,
  columnOrder,
  expanded,
  onToggle,
  highlightBands,
  tierBands,
  highlightedRows,
  onRowHighlight,
  visibleLevels,
}: {
  row: HeatmapRow;
  columnOrder: readonly number[];
  expanded: ReadonlySet<string>;
  onToggle: (id: string) => void;
  highlightBands?: ReadonlySet<string>;
  tierBands?: ReadonlySet<string>;
  highlightedRows?: ReadonlySet<string>;
  onRowHighlight?: (id: string) => void;
  visibleLevels: ReadonlySet<HeatmapLevel>;
}) {
  const isExpanded = expanded.has(row.id);
  const expandable = row.kind === "section" && row.children.length > 0;

  return (
    <React.Fragment>
      <GridRow
        row={row}
        columnOrder={columnOrder}
        isRoot={row.depth === 1}
        isOpen={isExpanded}
        onToggle={expandable ? () => onToggle(row.id) : undefined}
        highlightBands={highlightBands} tierBands={tierBands}
        highlightedRows={highlightedRows}
        onRowHighlight={onRowHighlight}
        levelHidden={!visibleLevels.has(levelOf(row))}
      />
      {isExpanded &&
        row.children.map((child) => (
          <RowNode
            key={child.id}
            row={child}
            columnOrder={columnOrder}
            expanded={expanded}
            onToggle={onToggle}
            highlightBands={highlightBands} tierBands={tierBands}
            highlightedRows={highlightedRows}
            onRowHighlight={onRowHighlight}
            visibleLevels={visibleLevels}
          />
        ))}
    </React.Fragment>
  );
}

function GridRow({
  row,
  columnOrder,
  isRoot = false,
  isOpen = false,
  onToggle,
  highlightBands,
  tierBands,
  highlightedRows = new Set(),
  onRowHighlight,
  levelHidden = false,
}: {
  row: HeatmapRow;
  columnOrder: readonly number[];
  isRoot?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  highlightBands?: ReadonlySet<string>;
  tierBands?: ReadonlySet<string>;
  highlightedRows?: ReadonlySet<string>;
  onRowHighlight?: (id: string) => void;
  levelHidden?: boolean;
}) {
  const isQuestion = row.kind === "question";
  // A row with nothing on the 1–5 scale: an unscored question or a section
  // that only carries them. It says so instead of faking a number.
  const unscored = row.total === null;
  // Both opaque: this cell is frozen while the grid scrolls under it, and a
  // translucent one lets the columns behind read through the section name.
  const stickyBackground = isRoot ? "bg-muted-solid" : "bg-surface";
  const hierarchySize = isRoot
    ? undefined
    : isQuestion || row.depth >= 3
      ? "text-[11px]"
      : "text-[11px]";
  const hierarchyBox = isRoot ? "h-10" : isQuestion || row.depth >= 3 ? "h-8" : "h-9";
  const padding =
    row.depth === 1 ? "pl-7" : row.depth === 2 ? "pl-10" : row.depth === 3 ? "pl-14" : "pl-16";

  const isHighlighted = highlightedRows.has(row.id);
  const rowDimmed = highlightedRows.size > 0 && !isHighlighted;

  return (
    <TableRow className="group border-transparent transition-colors hover:bg-muted/30">
      <th
        scope="row"
        className={cn(
          "sticky left-0 z-10 min-w-[260px] border-r border-border/60 py-3.5 pl-7 pr-4 text-left align-middle",
          stickyBackground,
          padding
        )}
      >
        <div className={cn("flex items-center gap-2", levelHidden ? "opacity-60" : rowDimmed && "opacity-55")}>
          {row.kind === "section" && row.children.length > 0 ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={isOpen}
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5 text-left transition-colors hover:text-primary",
                isRoot
                  ? "text-[13px] font-bold text-text-primary"
                  : "text-[12px] font-semibold text-text-primary"
              )}
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
              )}
              {isRoot ? (
                <span className="flex h-5 min-w-[20px] px-1 shrink-0 items-center justify-center rounded-md bg-muted/60 border border-border/60 text-[10px] font-bold tabular-nums text-muted-foreground">
                  {row.numbering}
                </span>
              ) : (
                <span className="tabular-nums opacity-75">
                  {row.numbering}
                </span>
              )}
              <span className="truncate">{row.label}</span>
            </button>
          ) : (
            <span
              className={cn(
                "flex min-w-0 flex-1 items-center gap-1.5",
                isQuestion
                  ? "text-[12px] font-medium text-text-secondary"
                  : row.depth >= 3
                    ? "text-[12px] font-medium text-text-secondary"
                    : "text-[12px] font-semibold text-text-primary"
              )}
            >
              {isRoot && !isQuestion ? (
                <span className="flex h-5 min-w-[20px] px-1 shrink-0 items-center justify-center rounded-md bg-muted/60 border border-border/60 text-[10px] font-bold tabular-nums text-muted-foreground">
                  {row.numbering}
                </span>
              ) : (
                <span
                  className={cn(
                    "tabular-nums",
                    isQuestion ? "opacity-75" : row.depth >= 3 ? "opacity-60" : "opacity-75"
                  )}
                >
                  {row.numbering || (isQuestion ? "•" : "")}
                </span>
              )}
              <span className="truncate">{row.label}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => onRowHighlight?.(row.id)}
            aria-pressed={isHighlighted}
            aria-label={`Resaltar solo ${row.label}`}
            title={`Resaltar solo ${row.label}`}
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-[background-color,border-color,color,opacity] focus-visible:opacity-100",
              isHighlighted
                ? "border-primary/40 bg-primary/10 text-primary opacity-100 hover:border-primary/50 hover:bg-primary/15 hover:text-primary"
                : "border-border/60 text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-border hover:bg-border/40 hover:text-text-primary"
            )}
          >
            <Crosshair className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </th>

      <td
        className={cn(
          "border-b border-r border-border/60 px-4 py-3.5 text-right align-middle",
          rowDimmed && "opacity-45 grayscale",
          stickyBackground
        )}
        style={{ borderBottomColor: "var(--color-surface)" }}
      >
        <div>
          {levelHidden ? (
            <span
              className="inline-flex h-5 items-center px-1 text-[12px] font-medium leading-none text-muted-foreground/40"
              title="Total oculto: este nivel está desmarcado en Niveles"
            >
              —
            </span>
          ) : unscored ? (
            <Badge variant="neutral" className="gap-1 whitespace-nowrap">
              <MessageSquareText className="h-3 w-3" strokeWidth={2} />
              Sin escala
            </Badge>
          ) : (
            <ScoreChip score={row.total} className={cn("tabular-nums", hierarchySize)} />
          )}
        </div>
      </td>

      {columnOrder.map((index) => {
        const cell = row.cells[index];
        const band = cell.score === null ? null : bandForScore(cell.score);
        const tier = cell.score !== null ? tierForScore(cell.score) : null;
        const dimmed =
          rowDimmed ||
          (cell.score !== null &&
            !cell.masked &&
            band !== null &&
            highlightBands !== undefined &&
            highlightBands.size > 0 &&
            !highlightBands.has(band.id)) ||
          (cell.score !== null &&
            !cell.masked &&
            tier !== null &&
            tierBands !== undefined &&
            tierBands.size > 0 &&
            !tierBands.has(tier.id));

        return (
          <TableCell key={index} className="px-2 py-2 align-middle">
            <Tooltip>
              <TooltipTrigger asChild>
                {levelHidden ? (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg bg-muted/40",
                      hierarchyBox
                    )}
                    title="Total y resultados ocultos: este nivel está desmarcado en Niveles"
                  />
                ) : cell.unscored ? (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg bg-muted/60 text-muted-foreground/70",
                      hierarchyBox
                    )}
                  >
                    <MessageSquareText className="h-3 w-3" strokeWidth={2} />
                  </div>
                ) : cell.masked ? (
                  cell.n === 0 ? (
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/50",
                        hierarchyBox
                      )}
                    >
                      <span className="text-[11px]">—</span>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex items-center justify-center rounded-lg bg-muted text-muted-foreground",
                        hierarchyBox
                      )}
                    >
                      <Lock className="h-3 w-3" strokeWidth={2} />
                    </div>
                  )
                ) : (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg font-extrabold tabular-nums transition-transform",
                      hierarchyBox,
                      isRoot ? "text-[12px]" : hierarchySize,
                      dimmed && "bg-muted text-muted-foreground hover:scale-100",
                      !dimmed && "hover:scale-[1.04]"
                    )}
                    style={{
                      backgroundColor: dimmed ? undefined : band?.background,
                      color: dimmed ? undefined : band?.foreground,
                    }}
                  >
                    {formatScore(cell.score as number)}
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="flex w-[240px] flex-col gap-2 text-[12px] leading-relaxed"
              >
                {levelHidden ? (
                  <span className="flex items-center gap-1.5">
                    <ListFilter className="h-3.5 w-3.5 shrink-0 text-background/70" strokeWidth={2} />
                    Resultados ocultos: marca este nivel en el filtro de Niveles.
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      {cell.unscored ? (
                        <>
                          <MessageSquareText
                            className="h-3.5 w-3.5 shrink-0 text-background/70"
                            strokeWidth={2}
                          />
                          <span className="font-semibold">Sin escala</span>
                        </>
                      ) : cell.masked ? (
                        cell.n === 0 ? (
                          <>
                            <span className="text-background/70">—</span>
                            <span className="font-semibold">Sin respuestas</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-3.5 w-3.5 shrink-0 text-background/70" strokeWidth={2} />
                            <span className="font-semibold">Reservado</span>
                          </>
                        )
                      ) : (
                        <>
                          <span
                            aria-hidden
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: band?.color ?? band?.background }}
                          />
                          <span className="font-semibold">{band?.label}</span>
                        </>
                      )}
                    </div>
                    <dl className="flex w-full flex-col gap-1 border-t border-background/25 pt-2">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[11px] font-medium text-background/70">Respuestas</dt>
                        <dd className="font-semibold tabular-nums text-background">{formatCount(cell.n)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-[11px] font-medium text-background/70">Participantes</dt>
                        <dd className="font-semibold tabular-nums text-background">
                          {formatCount(cell.participants)}
                        </dd>
                      </div>
                    </dl>
                    {cell.masked && (
                      <p className="text-background/70">
                        {cell.n === 0
                          ? "Todavía nadie de este grupo ha respondido."
                          : "Por debajo del mínimo para mostrar resultados de este grupo."}
                      </p>
                    )}
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          </TableCell>
        );
      })}
    </TableRow>
  );
}

/** Ids of every row in a subtree, the row itself first. */
function collectDescendantIds(row: HeatmapRow): string[] {
  return row.children.flatMap((child) => [child.id, ...collectDescendantIds(child)]);
}