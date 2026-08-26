import * as React from "react";
import { AlertTriangle, Lightbulb, RefreshCw, Search, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SurveyDraft } from "@/components/survey-builder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/feedback";
import {
  buildOpenComments,
  buildRespondents,
  type Sentiment,
} from "@/mocks/questionResponses";
import { buildSurveyAnalysis, type InsightKind } from "@/mocks/surveyInsights";
import type { SurveyResults } from "@/mocks/surveyResults";
import { AiGapsSection } from "./AiGapsSection";
import { AiPrioritiesSection } from "./AiPrioritiesSection";
import { AiStrengthsSection } from "./AiStrengthsSection";
import { AiVoiceSection } from "./AiVoiceSection";
import {
  InsightConfidenceFilter,
  useConfidenceFilter,
} from "./InsightConfidenceFilter";
import { CONFIDENCE_LEGEND, CONFIDENCE_ORDER, type InsightConfidence } from "./insightConfidence";
import { InsightGroupList, type InsightGroup } from "./InsightGroupList";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import { MiniMetricCard, AnimatedNumber } from "./MiniMetricCard";
import {
  SCOPE_ALL,
  buildPriorities,
  buildStrengths,
  defaultFindingLevel,
  findingsAtLevel,
  resolveScope,
  sentimentRollup,
  confidenceFor,
  type AlertTarget,
} from "./summaryModel";

interface AiAnalysisTabProps {
  draft: SurveyDraft;
  results: SurveyResults;
  /** Opens the tab that can answer whatever the reader just pressed. */
  onNavigate: (target: AlertTarget) => void;
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
export function AiAnalysisTab({ draft, results, onNavigate }: AiAnalysisTabProps) {
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const confidence = useConfidenceFilter();
  const analysis = React.useMemo(() => buildSurveyAnalysis(results), [results]);

  /* ------------------------------------------------------------- evidencia */

  // The blocks that used to live in Resumen — prioridades, fortalezas, brechas
  // y voz — read over the whole measurement here. This tab has no scope bar and
  // no demographic filters of its own, so there is only one population to read,
  // which is the same one the AI's own lecturas rest on.
  const scope = React.useMemo(() => resolveScope(results, SCOPE_ALL), [results]);
  const findings = React.useMemo(
    () => findingsAtLevel(scope, defaultFindingLevel(scope)),
    [scope]
  );

  const respondents = React.useMemo(() => buildRespondents(draft, results), [draft, results]);
  const comments = React.useMemo(
    () => buildOpenComments(draft, results, respondents),
    [draft, results, respondents]
  );
  const [progress, setProgress] = React.useState(0);
  const [loaderText, setLoaderText] = React.useState("Procesando respuestas y calculando favorabilidad...");
  
  React.useEffect(() => {
    if (isAnalyzing) {
      let current = 0;
      setLoaderText("Procesando respuestas y calculando favorabilidad...");
      
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 8) + 2;
        if (current >= 100) {
          clearInterval(interval);
          setProgress(100);
          setLoaderText("¡Análisis completado!");
          setTimeout(() => {
             setIsAnalyzing(false);
             setProgress(0);
          }, 800);
        } else {
          setProgress(current);
          if (current < 25) {
             setLoaderText("Procesando respuestas y calculando favorabilidad...");
          } else if (current < 50) {
             setLoaderText("Identificando fortalezas y áreas de mejora...");
          } else if (current < 75) {
             setLoaderText("Analizando brechas demográficas...");
          } else {
             setLoaderText("Leyendo comentarios y detectando sentimiento...");
          }
        }
      }, 400);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  const noOverrides = React.useMemo(() => new Map<string, Sentiment>(), []);
  const sentiment = React.useMemo(
    () => sentimentRollup(comments, noOverrides),
    [comments, noOverrides]
  );

  const priorities = React.useMemo(
    () => buildPriorities(findings, sentiment.topics),
    [findings, sentiment.topics]
  );

  const allowedConfidence = React.useMemo(() => {
    const allowed = new Set<string>();
    if (confidence.levels.has("high")) allowed.add("alta");
    if (confidence.levels.has("medium")) allowed.add("media");
    if (confidence.levels.has("low")) allowed.add("baja");
    return allowed;
  }, [confidence.levels]);

  const filteredPriorities = React.useMemo(() => {
    return priorities.filter((p) => allowedConfidence.has(p.confidence));
  }, [priorities, allowedConfidence]);

  const strengths = React.useMemo(() => buildStrengths(findings), [findings]);
  const filteredStrengths = React.useMemo(() => {
    return strengths.filter((s) => allowedConfidence.has(confidenceFor(s.n)));
  }, [strengths, allowedConfidence]);

  const filteredSentiment = React.useMemo(() => {
    return {
      ...sentiment,
      topics: sentiment.topics.filter(t => allowedConfidence.has(confidenceFor(t.total)))
    };
  }, [sentiment, allowedConfidence]);

  // Per-person demographics cannot be a column of a cut, the same rule the
  // Resumen's brechas block follows.
  const gapSegments = React.useMemo(
    () => results.segments.filter((candidate) => !candidate.perPerson),
    [results.segments]
  );

  // The analysis is derived synchronously; the delay only exists so the state
  // the real feature will have — "this takes a moment" — is visible in the UI.
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
      <div className="grid shrink-0 grid-cols-2 gap-3 pt-6 sm:grid-cols-4 sm:pt-8">
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
      <div className="min-h-0 flex-1 pb-20 pt-6">
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
                  className="h-9 gap-2 text-[13px] font-bold border-ai-gradient-surface hover:opacity-80 transition-opacity"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5 text-[#2d5cf7]", isAnalyzing && "animate-spin")} />
                  <span className="text-ai-gradient">{isAnalyzing ? "Analizando…" : "Re-analizar"}</span>
                </Button>
                <MeasurementScaleButton
                  items={CONFIDENCE_LEGEND}
                  title="Confiabilidad de la lectura"
                  description="Cada lectura dice qué tan directa es la cifra en la que se apoya. Alta viene de un número de la medición; media es una interpretación razonable; baja es un indicio que conviene confirmar en las demás pestañas."
                />
              </div>
            </div>
          </div>

          {isAnalyzing ? (
            <AnalyzingLoader progress={progress} text={loaderText} />
          ) : (
            <>
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

              <AiPrioritiesSection
                priorities={filteredPriorities}
                numbering={visibleGroups.length + 1}
                onNavigate={onNavigate}
              />

              <AiStrengthsSection strengths={filteredStrengths} numbering={visibleGroups.length + 2} />

              <AiGapsSection
                segments={gapSegments}
                results={results}
                numbering={visibleGroups.length + 3}
                allowedConfidence={allowedConfidence}
              />

              <AiVoiceSection sentiment={filteredSentiment} numbering={visibleGroups.length + 4} />
            </>
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

function AnalyzingLoader({ progress, text }: { progress: number; text: string }) {
  return (
    <div className="relative flex flex-col min-h-[300px] p-[2px] rounded-xl bg-ai-gradient shimmer-mirror shadow-sm animate-in fade-in duration-300 select-none">
      <div className="relative z-10 flex-1 w-full bg-ai-mesh-card rounded-[calc(var(--radius-xl)-2px)] flex flex-col items-center justify-center p-6 gap-6">
        
        {/* Pulsing UBITS AI Icon */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-1">
          <div className="absolute w-11 h-11 rounded-full bg-ai-gradient opacity-20 blur-xl animate-pulse" />
          <svg width="42" height="42" viewBox="0 0 24 24" className="relative">
            <defs>
              <linearGradient id="aiLoaderIconGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--ai-gradient-start))" />
                <stop offset="100%" stopColor="hsl(var(--ai-gradient-end))" />
              </linearGradient>
            </defs>
            <path
              d="M12,3 Q12,12 3,12 Q12,12 12,21 Q12,12 21,12 Q12,12 12,3 Z"
              fill="none"
              stroke="url(#aiLoaderIconGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[pulse_1.8s_infinite_ease-in-out]"
            />
            <path
              d="M19,5 Q19,7 17,7 Q19,7 19,9 Q19,7 21,7 Q19,7 19,5 Z"
              fill="url(#aiLoaderIconGrad)"
              className="animate-[pulse_1.3s_infinite_ease-in-out] [animation-delay:0.3s]"
            />
            <circle
              cx="5.5"
              cy="18.5"
              r="1.75"
              fill="url(#aiLoaderIconGrad)"
              className="animate-[pulse_1.5s_infinite_ease-in-out] [animation-delay:0.6s]"
            />
          </svg>
        </div>
        
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[16px] font-bold text-ai-gradient">
            Generando nuevo análisis
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-2">
          <div className="flex justify-between items-end text-[11.5px] font-bold">
            <span className="text-text-secondary">Procesando respuestas</span>
            <span className="text-ai-gradient">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-ai-gradient rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-[11px] text-text-secondary mt-2">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
