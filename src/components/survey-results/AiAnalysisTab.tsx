import * as React from "react";
import { AlertTriangle, Lightbulb, RefreshCw, Search, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback";
import { buildSurveyAnalysis, type InsightKind } from "@/mocks/surveyInsights";
import type { SurveyResults } from "@/mocks/surveyResults";
import {
  InsightConfidenceFilter,
  useConfidenceFilter,
} from "./InsightConfidenceFilter";
import { CONFIDENCE_LEGEND, CONFIDENCE_ORDER, type InsightConfidence } from "./insightConfidence";
import { InsightGroupList, type InsightGroup } from "./InsightGroupList";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import { MiniMetricCard, AnimatedNumber } from "./MiniMetricCard";

interface AiAnalysisTabProps {
  results: SurveyResults;
}

/** How long the mock re-analysis takes, in ms. */
const REANALYSIS_MS = 1400;

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/** The three questions a reader arrives with, in the order they arrive in. */
const KIND_META: Readonly<Record<InsightKind, { heading: string; question: string }>> = {
  finding: { heading: "Hallazgos", question: "qué pasó en esta medición" },
  risk: { heading: "Riesgos", question: "qué está en juego si no se atiende" },
  recommendation: { heading: "Qué hacer", question: "por dónde abrir el plan" },
};

const KIND_ORDER: readonly InsightKind[] = ["finding", "risk", "recommendation"];

/**
 * The AI reading of the measurement, in the report's own chrome.
 *
 * Every other tab is built the same way: the headline numbers as a row of small
 * cards, then one surface with a sticky toolbar over a collapsible outline. This
 * tab used to be a tinted panel over a three-column card grid — a shape that
 * appears nowhere else in the report, which made the analysis read as a
 * different product rather than as the last view of the same one. Now it is the
 * same shell as Comentarios: the numbers on top, the summary as one strip, and
 * the claims as rows that open onto the figure they rest on.
 */
export function AiAnalysisTab({ results }: AiAnalysisTabProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const confidence = useConfidenceFilter();
  const analysis = React.useMemo(() => buildSurveyAnalysis(results), [results]);

  // The analysis is derived synchronously; the delay only exists so the state
  // the real feature will have — "this takes a moment" — is visible in the UI.
  React.useEffect(() => {
    if (!isAnalyzing) return;
    const timer = window.setTimeout(() => setIsAnalyzing(false), REANALYSIS_MS);
    return () => window.clearTimeout(timer);
  }, [isAnalyzing]);

  const visibleGroups = React.useMemo<readonly InsightGroup[]>(
    () =>
      KIND_ORDER.map((kind) => ({
        id: kind,
        heading: KIND_META[kind].heading,
        question: KIND_META[kind].question,
        items: analysis.insights.filter(
          (insight) => insight.kind === kind && confidence.levels.has(insight.confidence)
        ),
      })).filter((group) => group.items.length > 0),
    [analysis, confidence.levels]
  );

  const counts = React.useMemo(() => {
    const total = analysis.insights.length;
    const byKind = (kind: InsightKind) =>
      analysis.insights.filter((insight) => insight.kind === kind).length;
    const byConfidence = Object.fromEntries(
      CONFIDENCE_ORDER.map((level) => [
        level,
        analysis.insights.filter((insight) => insight.confidence === level).length,
      ])
    ) as Record<InsightConfidence, number>;

    return {
      total,
      finding: byKind("finding"),
      risk: byKind("risk"),
      recommendation: byKind("recommendation"),
      byConfidence,
      solidShare: total > 0 ? Math.round((byConfidence.high / total) * 100) : 0,
    };
  }, [analysis]);

  const visibleCount = visibleGroups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* The same KPI row every other tab opens with. What the analysis is made
          of, so the reader knows the size of the reading before entering it. */}
      <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pt-6 sm:grid-cols-4 sm:px-8 sm:pt-8">
        <MiniMetricCard
          icon={Search}
          label="Hallazgos"
          value={<AnimatedNumber value={counts.finding} format={formatCount} />}
        />
        <MiniMetricCard
          icon={AlertTriangle}
          label="Riesgos"
          value={<AnimatedNumber value={counts.risk} format={formatCount} />}
          tone={counts.risk > 0 ? "negative" : "neutral"}
        />
        <MiniMetricCard
          icon={Lightbulb}
          label="Acciones sugeridas"
          value={<AnimatedNumber value={counts.recommendation} format={formatCount} />}
        />
        <MiniMetricCard
          icon={ShieldCheck}
          label="Confiabilidad alta"
          value={
            <span className="tabular-nums">
              <AnimatedNumber value={counts.solidShare} format={(v) => `${v}%`} />
            </span>
          }
          tone="positive"
        />
      </div>

      {/* pb-20: the screen's floating action rail hovers over the last ~80px. */}
      <div className="min-h-0 flex-1 px-6 pb-20 pt-6 sm:px-8">
        <div className="flex flex-col gap-6 rounded-2xl border border-border/50 bg-surface p-6 shadow-sm sm:p-8">
          {/* Same sticky toolbar the Preguntas and Favorabilidad views use. */}
          <div className="sticky top-4 z-30 -mt-6 bg-surface pb-2 pt-6 sm:-mt-8 sm:pt-8">
            <div className="flex flex-wrap items-center gap-4 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-text-primary">Lectura de la IA</h3>
                <Badge
                  variant="neutral"
                  className="h-5 px-1.5 text-[11px] font-semibold tabular-nums"
                >
                  {visibleCount}
                </Badge>
              </div>

              <div className="ml-auto flex items-center justify-end gap-3">
                <InsightConfidenceFilter filter={confidence} counts={counts.byConfidence} />
                <Button
                  variant="outline"
                  onClick={() => setIsAnalyzing(true)}
                  disabled={isAnalyzing}
                  className="h-9 gap-2 text-[13px] font-semibold"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isAnalyzing && "animate-spin")} />
                  {isAnalyzing ? "Analizando…" : "Re-analizar"}
                </Button>
                <MeasurementScaleButton
                  items={CONFIDENCE_LEGEND}
                  title="Confiabilidad de la lectura"
                  description="Cada lectura dice qué tan directa es la cifra en la que se apoya. Alta viene de un número de la medición; media es una interpretación razonable; baja es un indicio que conviene confirmar en las demás pestañas."
                />
              </div>
            </div>
          </div>

          <AnalysisSummary summary={analysis.summary} isAnalyzing={isAnalyzing} />

          {visibleGroups.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Sin lecturas con esta confiabilidad"
              description="Ninguna de las lecturas de esta medición cae en las bandas seleccionadas. Vuelve a marcarlas en «Confiabilidad» para ver el análisis completo."
              className="border-none bg-transparent shadow-none"
            />
          ) : (
            <InsightGroupList groups={visibleGroups} isAnalyzing={isAnalyzing} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The executive summary as one strip above the outline.
 *
 * The same place — and the same muted ground — Comentarios puts its sentiment
 * distribution: a fixed reference the reader passes over on the way into the
 * detail, not a panel that owns the top third of the screen.
 *
 * It is two lines of prose, though, not a row of figures, so it is padded like
 * a block of reading rather than like a control strip: room around the text and
 * a line height a paragraph can be read at.
 */
function AnalysisSummary({
  summary,
  isAnalyzing,
}: {
  summary: string;
  isAnalyzing: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 px-6 py-5">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] font-semibold leading-none text-text-secondary">
        <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.4} />
        Resumen general
        <span className="ml-auto text-[11px] font-medium text-muted-foreground">
          Generado a partir de los resultados de esta medición
        </span>
      </span>

      {isAnalyzing ? (
        <div className="space-y-2 py-0.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[84%]" />
        </div>
      ) : (
        <p className="max-w-5xl text-[13px] leading-[1.75] text-text-primary">{summary}</p>
      )}
    </div>
  );
}
