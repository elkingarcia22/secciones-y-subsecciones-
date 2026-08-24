import * as React from "react";
import { ArrowRight, ChevronRight, ChevronUp, Split, TrendingDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  SECTION_HEADER_DIVIDER,
  SIBLING_DIVIDER,
  depthTheme,
} from "@/components/survey-builder/depthTheme";
import { useResetOnChange } from "@/lib/useResetOnChange";
import {
  heatmapBySegment,
  participationBySegment,
  type SegmentDefinition,
  type SegmentFilter,
  type SurveyResults,
  type HeatmapData,
  type HeatmapRow,
} from "@/mocks/surveyResults";
import { formatScore } from "./favorabilityScale";
import { ScoreChip } from "./ScoreChip";
import { segmentStandings } from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/** A group this far under the average is an outlier, not noise. */
const OUTLIER_GAP = 0.15;

/** Outliers shown before the block stops being a shortcut to the heatmap. */
const MAX_OUTLIERS = 4;

interface SegmentGaps {
  segment: SegmentDefinition;
  widest: WidestGap | null;
  outliers: readonly { row: SegmentStanding; gap: number }[];
  masked: readonly SegmentStanding[];
  average: number;
}

/** The shape `segmentStandings` returns, narrowed to what this block reads. */
type SegmentStanding = ReturnType<typeof segmentStandings>[number];

/**
 * Where the groups pull apart, as one outline.
 *
 * Every demographic is a cut of the same measurement, so they belong in one
 * card rather than six stacked ones: the reader opens Área, sees the spread,
 * and moves to Líder without scrolling past a header band each time. It is the
 * same section → subsección chrome Favorabilidad uses, for the same reason —
 * the report only reads as one document if its hierarchies look alike.
 */
export function SummaryGaps({
  segments,
  results,
  filters,
  onOpenHeatmap,
}: {
  segments: readonly SegmentDefinition[];
  results: SurveyResults;
  filters: readonly SegmentFilter[];
  onOpenHeatmap: () => void;
}) {
  const analyses = React.useMemo<readonly SegmentGaps[]>(
    () =>
      segments
        .map((segment) => analyseSegment(segment, results, filters))
        .filter((analysis): analysis is SegmentGaps => analysis !== null),
    [segments, results, filters]
  );

  const [isOpen, setIsOpen] = React.useState(true);

  // With "Ver por" on one demographic the block *is* that cut, and it has to
  // stay on screen even when the cut turns out to be flat: a reader who asked
  // "¿y por líder?" is owed the answer "no se separan", not a missing card.
  const single = segments.length === 1 ? segments[0] : null;
  if (analyses.length === 0 && !single) return null;

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-sm">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Contraer brechas entre grupos" : "Expandir brechas entre grupos"}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen((current) => !current);
          }
        }}
        className={cn(
          "group flex cursor-pointer items-start gap-3.5 bg-muted/40 px-6 py-5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          isOpen && ["border-b", SECTION_HEADER_DIVIDER]
        )}
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/50 transition-colors group-hover:bg-border/40 group-hover:text-text-primary">
          <ChevronUp
            className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")}
            strokeWidth={2.5}
          />
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-status-negative/10">
          <Split className="h-4 w-4 text-status-negative" strokeWidth={2.2} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-0.5 text-[15px] font-bold tracking-tight text-text-primary">
            Brechas entre grupos
            <span className="text-[12px] font-medium tracking-normal text-muted-foreground">
              {single
                ? `Corte por ${single.label}`
                : `${analyses.length} ${
                    analyses.length === 1 ? "corte demográfico" : "cortes demográficos"
                  } con diferencias`}
            </span>
          </p>
        </div>

        <div
          className="flex shrink-0 items-center gap-1.5 pt-0.5"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHeatmap}
            className="h-8 gap-1.5 rounded-lg px-3 text-[12px] font-semibold text-text-secondary transition-colors hover:text-primary"
          >
            Ver en Heatmap
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="flex min-h-0 flex-col px-6 py-5 duration-300 animate-in fade-in slide-in-from-top-1">
          {analyses.length === 0 && single ? (
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Ningún grupo de{" "}
              <strong className="font-semibold text-text-primary">{single.label}</strong> se aparta
              del promedio lo suficiente como para reportarlo. Cambia el corte en "Ver por" o abre
              el heatmap para ver los números uno a uno.
            </p>
          ) : (
          <ul className={cn("flex flex-col", SIBLING_DIVIDER)}>
            {analyses.map((analysis, index) => (
              <SegmentRow
                key={analysis.segment.key}
                analysis={analysis}
                position={index + 1}
                defaultOpen={index === 0}
                threshold={results.threshold}
                resetKey={analyses.map((a) => a.segment.key).join("|")}
              />
            ))}
          </ul>
          )}
        </div>
      )}
    </section>
  );
}

/** One demographic, as a level-2 outline row that opens onto its own detail. */
function SegmentRow({
  analysis,
  position,
  defaultOpen,
  threshold,
  resetKey,
}: {
  analysis: SegmentGaps;
  position: number;
  defaultOpen: boolean;
  threshold: number;
  resetKey: string;
}) {
  const [expanded, setExpanded] = React.useState(defaultOpen);
  useResetOnChange(resetKey, () => setExpanded(defaultOpen));

  const theme = depthTheme(2);
  const { segment, widest, outliers, masked, average } = analysis;

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? `Contraer ${segment.label}` : `Expandir ${segment.label}`}
        onClick={() => setExpanded((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
        className="group -mx-2 flex cursor-pointer items-start gap-2 rounded-lg p-2 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      >
        <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/60 transition-colors group-hover:bg-border/40 group-hover:text-text-primary">
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-90")}
            strokeWidth={2.5}
          />
        </div>

        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-bold tabular-nums transition-colors group-hover:border-border",
            theme.chip
          )}
        >
          {position}
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "-ml-1 flex w-full flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md px-1 py-0.5 font-bold tracking-tight text-text-primary",
              theme.title
            )}
          >
            {segment.label}
            <span className="text-[11px] font-medium tracking-normal text-muted-foreground">
              {outliers.length > 0
                ? `${outliers.length} ${outliers.length === 1 ? "grupo rezagado" : "grupos rezagados"}`
                : "sin grupos rezagados"}
              {masked.length > 0 ? ` · ${masked.length} sin muestra` : ""}
            </span>
          </p>
        </div>

        {/* Collapsed, the spread is what tells the reader whether to open this
            cut at all, so it stays on the row. */}
        {widest && (
          <div className="mt-0.5 flex shrink-0 items-center gap-2.5">
            <span className="text-[10.5px] font-semibold text-muted-foreground">Brecha</span>
            <span className="flex h-6 items-center rounded-md border border-border/60 bg-muted/40 px-2 text-[11.5px] font-bold tabular-nums text-text-primary">
              {formatScore(widest.spread)} pts
            </span>
          </div>
        )}
      </div>

      {expanded && (
        <div
          className={cn(
            "mt-2.5 flex flex-col gap-5 pb-1 duration-200 animate-in fade-in slide-in-from-top-1",
            theme.rail,
            theme.railOffset
          )}
        >
          {widest && <WidestGapBlock widest={widest} />}

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
              {/* A short label, not a shout: the page states its headings in
                  normal case, and the live average reads as the data it is. */}
              <h3 className="text-[11.5px] font-bold text-text-secondary">
                Grupos rezagados vs. promedio general
              </h3>
              <span className="text-[11px] font-bold tabular-nums text-text-primary">
                {formatScore(average)}
              </span>
            </div>

            {outliers.length === 0 ? (
              <p className="text-[12.5px] text-muted-foreground">
                Ningún grupo de{" "}
                <strong className="font-semibold text-text-primary">{segment.label}</strong> se
                aparta negativamente del promedio.
              </p>
            ) : (
              <OutlierTable outliers={outliers} />
            )}
          </div>

          {masked.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" strokeWidth={2.2} />
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-text-primary">
                  Cobertura: {masked.length}{" "}
                  {masked.length === 1
                    ? "segmento sin muestra suficiente"
                    : "segmentos sin muestra suficiente"}
                </span>
                <span>
                  — {masked.map((row) => `${row.label} (${row.completed}/${row.invited})`).join(", ")}
                  .{" "}
                  {threshold > 1
                    ? `Se omiten para proteger la confidencialidad (umbral de ${threshold} respuestas).`
                    : "Se omiten porque todavía no tienen respuestas."}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * The groups that fall behind, as the report's own results table.
 *
 * Same table Favorabilidad and Preguntas use for their questions — rank column,
 * label, right-aligned figures, the band-coloured chip last — because this is
 * the same kind of list: things ranked worst-first with a score to read across
 * them. Three loose cards in a grid made the reader compare numbers that were
 * never on a shared baseline; a row per group puts them on one.
 *
 * Flat, with no box of its own: it already sits inside the cut's own panel, and
 * those tables read as a container inside a container. The insets are theirs
 * too — `px-4` opening the row, `pr-4` closing it.
 *
 * The middle columns are the ones the data actually has. A group's answers
 * carry no Favorables/Neutrales/Desfav. split of their own in this result, so
 * the table states what it can defend — how many answered, how far they are
 * from the average, and where they land on the 1–5 scale. Participación is not
 * a column of its own: "144 de 144" already is that fact, and a percentage
 * beside it would be the same number twice.
 */
function OutlierTable({
  outliers,
}: {
  outliers: readonly { row: SegmentStanding; gap: number }[];
}) {
  return (
    <table className="w-full border-collapse text-left">
      <thead className="bg-muted/10">
        <tr className="border-b border-border/30 text-[11px] font-semibold text-muted-foreground">
          <th className="w-10 px-4 py-2.5 text-center font-semibold">#</th>
          <th className="py-2.5 font-semibold">Grupo</th>
          <th className="hidden w-[110px] py-2.5 text-right font-semibold sm:table-cell">
            Respuestas
          </th>
          <th className="w-[110px] py-2.5 text-right font-semibold">Diferencia</th>
          <th className="w-[100px] py-2.5 pr-4 text-right font-semibold">Promedio</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/25">
        {outliers.map(({ row, gap }, index) => (
          <tr key={row.id} className="transition-colors hover:bg-muted/30">
            <td className="px-4 py-3 text-center text-[11px] font-extrabold tabular-nums text-muted-foreground">
              {index + 1}
            </td>
            <td className="py-3 pr-4 text-[12.5px] font-semibold leading-snug text-text-primary">
              {row.label}
            </td>
            <td className="hidden py-3 text-right text-[11.5px] tabular-nums text-text-secondary sm:table-cell">
              {formatCount(row.completed)} de {formatCount(row.invited)}
            </td>
            <td className="py-3 text-right text-[11.5px] font-semibold tabular-nums text-status-negative">
              {formatScore(gap)}
            </td>
            <td className="py-3 pr-4 text-right">
              <ScoreChip score={row.score} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The single widest spread in this cut, stated as min → max. */
function WidestGapBlock({ widest }: { widest: WidestGap }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <Split className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[11.5px] font-bold text-text-secondary">Mayor polarización</h3>
      </div>

      <div className="flex flex-col justify-between gap-4 overflow-hidden rounded-[16px] border border-border/60 bg-gradient-to-r from-surface to-muted/20 p-3.5 md:flex-row md:items-center sm:px-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[10.5px] font-semibold text-muted-foreground">Pregunta</span>
          <p className="truncate text-[14px] font-bold leading-snug text-text-primary">
            "{widest.rowLabel}"
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 md:justify-end">
          <div className="flex items-center gap-2 text-right">
            <div className="flex flex-col">
              <span className="text-[10.5px] font-semibold text-status-negative">Mínimo</span>
              <span className="max-w-[80px] truncate text-[11.5px] font-bold text-text-primary sm:max-w-[100px]">
                {widest.minLabel}
              </span>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-negative/15 text-[13.5px] font-black tabular-nums text-status-negative ring-1 ring-status-negative/20">
              {formatScore(widest.min)}
            </div>
          </div>

          <div className="flex w-14 shrink-0 flex-col items-center justify-center sm:w-16">
            <span className="z-10 -mb-2 whitespace-nowrap rounded-full border border-border/50 bg-surface px-1.5 py-0.5 text-[10.5px] font-extrabold text-text-primary">
              {formatScore(widest.spread)} pts
            </span>
            <div className="h-[2px] w-full border-dashed bg-border" />
          </div>

          <div className="flex items-center gap-2 text-left">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-status-positive/15 text-[13.5px] font-black tabular-nums text-status-positive ring-1 ring-status-positive/20">
              {formatScore(widest.max)}
            </div>
            <div className="flex flex-col">
              <span className="text-[10.5px] font-semibold text-status-positive">Máximo</span>
              <span className="max-w-[80px] truncate text-[11.5px] font-bold text-text-primary sm:max-w-[100px]">
                {widest.maxLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Everything this block reads off one demographic, or null when it says nothing. */
function analyseSegment(
  segment: SegmentDefinition,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): SegmentGaps | null {
  const heatmap = heatmapBySegment(results, segment, filters);
  const participation = participationBySegment(results, segment, filters);
  const standings = segmentStandings(heatmap.columns, heatmap.columnTotals, participation);

  const scored = standings.filter((row) => row.score !== null && !row.masked);
  const masked = standings.filter((row) => row.score === null || row.masked);

  const average =
    scored.length === 0
      ? 0
      : scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length;

  const outliers = scored
    .map((row) => ({ row, gap: (row.score ?? 0) - average }))
    .filter((entry) => entry.gap <= -OUTLIER_GAP)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, MAX_OUTLIERS);

  const widest = widestGap(heatmap);

  if (!widest && outliers.length === 0) return null;
  return { segment, widest, outliers, masked, average };
}

interface WidestGap {
  rowLabel: string;
  min: number;
  minLabel: string;
  max: number;
  maxLabel: string;
  spread: number;
}

/** A gap only counts when it separates groups this far apart on the 1–5 scale. */
const MIN_REPORTABLE_SPREAD = 1.5;

/**
 * The single widest score spread anywhere in the grid, read off the question
 * rows — in this mock the per-group variation lives there, and a question is
 * also the actionable unit: "Claridad estratégica va de 1,6 en Gente y Cultura
 * a 5,0 en Producto" names both the subject and the two rooms to visit.
 */
function widestGap(heatmap: HeatmapData): WidestGap | null {
  let best: WidestGap | null = null;

  const visit = (rows: readonly HeatmapRow[]) => {
    for (const row of rows) {
      if (row.kind === "question") {
        let min = Infinity;
        let max = -Infinity;
        let minIndex = -1;
        let maxIndex = -1;
        row.cells.forEach((cell, index) => {
          if (cell.score === null || cell.masked || cell.unscored) return;
          if (cell.score < min) {
            min = cell.score;
            minIndex = index;
          }
          if (cell.score > max) {
            max = cell.score;
            maxIndex = index;
          }
        });
        if (minIndex >= 0 && maxIndex >= 0 && minIndex !== maxIndex) {
          const spread = Math.round((max - min) * 10) / 10;
          if (spread >= MIN_REPORTABLE_SPREAD && (!best || spread > best.spread)) {
            best = {
              rowLabel: row.label,
              min,
              minLabel: heatmap.columns[minIndex]?.label ?? "",
              max,
              maxLabel: heatmap.columns[maxIndex]?.label ?? "",
              spread,
            };
          }
        }
      }
      visit(row.children);
    }
  };

  visit(heatmap.rows);
  return best;
}
