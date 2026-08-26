import * as React from "react";
import { ChevronRight, Split, TrendingDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type SegmentDefinition,
  type SegmentFilter,
  type SurveyResults,
} from "@/mocks/surveyResults";
import {
  AI_DETAIL_PANEL,
  AI_RANK_CELL,
  AI_ROW,
  AI_ROW_STATIC,
  AI_TBODY,
  AI_THEAD,
  AI_THEAD_ROW,
  AI_TABLE,
  AI_TITLE_CELL,
  AiSectionCard,
  AiSectionMeta,
  AiSubHeading,
} from "./AiSectionCard";
import { formatScore } from "./favorabilityScale";
import { ScoreChip } from "./ScoreChip";
// The analysis itself lives in the model: the downloaded report states the same
// brechas, and both readings have to come from one function.
import {
  analyseSegmentGaps,
  type SegmentGaps,
  type SegmentStanding,
  type WidestGap,
  confidenceFor,
} from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/**
 * Brechas entre grupos, in the analysis tab's own chrome.
 *
 * The block's logic is unchanged — it still asks each demographic where its
 * groups pull apart — but its shape is now the tab's: a table of cuts whose
 * rows open onto the detail, rather than the nested rail-and-chip outline
 * Resumen borrows from the survey builder. One cut per row means the reader can
 * compare spreads down a column before deciding which one to open, which is the
 * question this block exists to answer.
 */
export function AiGapsSection({
  segments,
  results,
  numbering,
  allowedConfidence,
}: {
  segments: readonly SegmentDefinition[];
  results: SurveyResults;
  numbering: number;
  allowedConfidence: Set<string>;
}) {
  // The analysis tab has no scope bar of its own, so the brechas are read over
  // the whole measurement — the same population the AI's lecturas rest on.
  const noFilters = React.useMemo<readonly SegmentFilter[]>(() => [], []);

  const analyses = React.useMemo<readonly SegmentGaps[]>(
    () =>
      segments
        .map((segment) => analyseSegmentGaps(segment, results, noFilters))
        .filter((analysis): analysis is SegmentGaps => analysis !== null)
        .filter((analysis) => {
          const outlierN = analysis.outliers[0]?.row.participation || 0;
          return allowedConfidence.has(confidenceFor(outlierN));
        }),
    [segments, results, noFilters, allowedConfidence]
  );

  return (
    <AiSectionCard
      numbering={numbering}
      heading="Brechas entre grupos"
      question="dónde se concentra la diferencia"
      meta={<AiSectionMeta count={analyses.length} unit="corte" unitPlural="cortes" />}
    >
      {analyses.length === 0 ? (
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          Ningún corte demográfico separa a sus grupos lo suficiente como para reportarlo. Abre el
          heatmap en Favorabilidad para ver los números uno a uno.
        </p>
      ) : (
        <table className={AI_TABLE}>
          <thead className={AI_THEAD}>
            <tr className={AI_THEAD_ROW}>
              <th className="w-10 px-4 py-2.5 text-center">#</th>
              <th className="py-2.5">Corte demográfico</th>
              <th className="hidden w-[140px] py-2.5 text-right sm:table-cell">Rezagados</th>
              <th className="w-[110px] py-2.5 text-right">Promedio</th>
              <th className="w-[110px] py-2.5 pr-4 text-right">Brecha</th>
              <th className="w-10 py-2.5 pr-4" aria-label="Detalle" />
            </tr>
          </thead>
          <tbody className={AI_TBODY}>
            {analyses.map((analysis, index) => (
              <GapRows
                key={analysis.segment.key}
                analysis={analysis}
                index={index + 1}
                threshold={results.threshold}
              />
            ))}
          </tbody>
        </table>
      )}
    </AiSectionCard>
  );
}

/** One demographic: its headline row, and the cut's own detail when open. */
function GapRows({
  analysis,
  index,
  threshold,
}: {
  analysis: SegmentGaps;
  index: number;
  threshold: number;
}) {
  const [open, setOpen] = React.useState(index === 1);
  const toggle = () => setOpen((current) => !current);

  const { segment, widest, outliers, masked, average } = analysis;

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        className={cn(AI_ROW, open && "bg-primary/[0.03]")}
      >
        <td className={AI_RANK_CELL}>{index}</td>

        <td className={AI_TITLE_CELL}>
          {segment.label}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {masked.length > 0 && (
              <span className="truncate text-[11px] font-medium text-muted-foreground">
                {masked.length} sin muestra suficiente
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
              Confianza {confidenceFor(outliers[0]?.row.participation || 0)}
            </span>
          </div>
        </td>

        <td className="hidden py-3 text-right text-[11.5px] tabular-nums text-text-secondary sm:table-cell">
          {outliers.length === 0 ? "—" : formatCount(outliers.length)}
        </td>

        <td className="py-3 text-right text-[11.5px] font-semibold tabular-nums text-text-primary">
          {formatScore(average)}
        </td>

        <td className="py-3 pr-4 text-right">
          {widest ? (
            <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-bold tabular-nums text-text-primary">
              {formatScore(widest.spread)} pts
            </span>
          ) : (
            <span className="text-[11.5px] text-muted-foreground">—</span>
          )}
        </td>

        <td className="py-3 pr-4 text-right">
          <ChevronRight
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:text-text-primary",
              open && "rotate-90"
            )}
            strokeWidth={2.4}
          />
        </td>
      </tr>

      {open && (
        <tr className="bg-muted/10">
          <td colSpan={6} className="px-4 py-4">
            <div className="flex flex-col gap-5 duration-200 animate-in fade-in slide-in-from-top-1">
              {widest && <WidestGapBlock widest={widest} />}

              <div className="flex flex-col gap-2.5">
                <AiSubHeading
                  icon={TrendingDown}
                  trailing={
                    <span className="text-[11px] font-bold tabular-nums text-text-primary">
                      {formatScore(average)}
                    </span>
                  }
                >
                  Grupos rezagados vs. promedio
                </AiSubHeading>

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
                <div
                  className={cn(
                    AI_DETAIL_PANEL,
                    "flex items-start gap-3 text-[12px] leading-relaxed text-muted-foreground"
                  )}
                >
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" strokeWidth={2.2} />
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-text-primary">
                      Cobertura: {masked.length}{" "}
                      {masked.length === 1
                        ? "segmento sin muestra suficiente"
                        : "segmentos sin muestra suficiente"}
                    </span>
                    <span>
                      —{" "}
                      {masked
                        .map((row) => `${row.label} (${row.completed}/${row.invited})`)
                        .join(", ")}
                      .{" "}
                      {threshold > 1
                        ? `Se omiten para proteger la confidencialidad (umbral de ${threshold} respuestas).`
                        : "Se omiten porque todavía no tienen respuestas."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** The groups that fall behind, as a nested table on the tab's own rhythm. */
function OutlierTable({
  outliers,
}: {
  outliers: readonly { row: SegmentStanding; gap: number }[];
}) {
  return (
    <table className={AI_TABLE}>
      <thead className={AI_THEAD}>
        <tr className={AI_THEAD_ROW}>
          <th className="w-10 px-4 py-2.5 text-center">#</th>
          <th className="py-2.5">Grupo</th>
          <th className="hidden w-[110px] py-2.5 text-right sm:table-cell">Respuestas</th>
          <th className="w-[110px] py-2.5 text-right">Diferencia</th>
          <th className="w-[100px] py-2.5 pr-4 text-right">Promedio</th>
        </tr>
      </thead>
      <tbody className={AI_TBODY}>
        {outliers.map(({ row, gap }, index) => (
          <tr key={row.id} className={AI_ROW_STATIC}>
            <td className={AI_RANK_CELL}>{index + 1}</td>
            <td className={AI_TITLE_CELL}>{row.label}</td>
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

/**
 * The single widest spread in this cut, stated as min → max.
 *
 * The question is a sentence, so it sits as a caption above; Mínimo, Máximo and
 * Brecha are each one figure, so they read across as three columns of one row —
 * the same shape "Grupos rezagados" uses right below it, so the two tables of
 * the expanded cut sit on one rhythm instead of two.
 */
function WidestGapBlock({ widest }: { widest: WidestGap }) {
  return (
    <div className="flex flex-col gap-2.5">
      <AiSubHeading icon={Split}>Mayor polarización</AiSubHeading>

      <div className={cn(AI_DETAIL_PANEL, "p-0")}>
        <div className="border-b border-border/40 px-4 py-2.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pregunta
          </span>
          <p className="mt-0.5 text-[13px] font-bold leading-snug text-text-primary">
            "{widest.rowLabel}"
          </p>
        </div>

        <table className={AI_TABLE}>
          <thead className={AI_THEAD}>
            <tr className={AI_THEAD_ROW}>
              <th className="py-2.5 pl-4">Mínimo</th>
              <th className="py-2.5">Máximo</th>
              <th className="py-2.5 pr-4 text-right">Brecha</th>
            </tr>
          </thead>
          <tbody className={AI_TBODY}>
            <tr className={AI_ROW_STATIC}>
              <td className="py-3 pl-4">
                <div className="flex items-center gap-2">
                  <ScoreChip score={widest.min} />
                  <span className="truncate text-[12px] font-medium text-text-secondary">
                    {widest.minLabel}
                  </span>
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <ScoreChip score={widest.max} />
                  <span className="truncate text-[12px] font-medium text-text-secondary">
                    {widest.maxLabel}
                  </span>
                </div>
              </td>
              <td className="py-3 pr-4 text-right">
                <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-bold tabular-nums text-text-primary">
                  {formatScore(widest.spread)} pts
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
