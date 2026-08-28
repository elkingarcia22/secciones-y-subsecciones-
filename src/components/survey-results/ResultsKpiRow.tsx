import { Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";

function mapVerdictToState(variant: string): "success" | "pending" | "failed" {
  if (variant === "positive") return "success";
  if (variant === "warning" || variant === "info" || variant === "neutral") return "pending";
  return "failed";
}
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  FavorabilityDistributionCard,
  SurveyMetricCard,
} from "@/components/survey-analytics";
import { overallDistribution, type SurveyResults } from "@/mocks/surveyResults";
import {
  VERDICT_COPY,
  deltaTone,
  favorabilitySegments,
  formatDelta,
  formatPercent,
  verdictForFavorability,
} from "./favorabilityScale";

interface ResultsKpiRowProps {
  results: SurveyResults;
  /** Name of the measurement the deltas compare against. */
  previousLabel: string;
}

/**
 * The three headline numbers.
 *
 * Each one answers a different question — *how do people feel*, *how many told
 * us*, *would they recommend us* — so each gets its own card from the analytics
 * kit: the favorability one is a distribution, the other two are metrics. Three
 * things matter in each and they are the three the reference leaves out: the
 * comparison against the previous measurement, enough of the underlying shape to
 * judge the number, and a plain-language reading so nobody has to remember what
 * a healthy favorability is.
 */
export function ResultsKpiRow({ results, previousLabel }: ResultsKpiRowProps) {
  const { distribution, n, nsnr } = overallDistribution(results);
  const verdict = VERDICT_COPY[verdictForFavorability(results.favorability)];
  const favorabilityDelta = results.favorability - results.previousFavorability;
  const participationDelta = results.participation.rate - results.participation.previousRate;
  const missing = results.participation.invited - results.participation.completed;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <FavorabilityDistributionCard
        title="FAVORABILIDAD"
        value={formatPercent(results.favorability)}
        subtitle={`sobre ${results.rankedQuestions.length} preguntas de escala`}
        deltaLabel={`${formatDelta(favorabilityDelta)} vs ${previousLabel}`}
        deltaTone={deltaTone(favorabilityDelta)}
        segments={favorabilitySegments(distribution, "kpi", nsnr)}
        total={n + nsnr}
        showLegend={false}
        actions={
          <StatusBadge 
            state={mapVerdictToState(verdict.variant)} 
            labels={{ [mapVerdictToState(verdict.variant)]: verdict.label }} 
          />
        }
      />

      <SurveyMetricCard
        title="PARTICIPACIÓN"
        value={formatPercent(results.participation.rate)}
        subtitle={`${results.participation.completed.toLocaleString("es-CO")} de ${results.participation.invited.toLocaleString("es-CO")} colaboradores`}
        deltaLabel={`${formatDelta(participationDelta)} vs ${previousLabel}`}
        deltaTone={deltaTone(participationDelta)}
      >
        <div className="w-full space-y-2 text-[11px] text-muted-foreground font-medium">
          <Progress value={results.participation.rate} className="h-2" />
          <span>
            {missing === 0
              ? "Respondió toda la audiencia"
              : `${missing} personas sin responder`}
          </span>
        </div>
      </SurveyMetricCard>

      {results.nps ? (
        <SurveyMetricCard
          title="ENPS"
          value={`${results.nps.score > 0 ? "+" : ""}${results.nps.score}`}
          subtitle={`sobre ${results.nps.n.toLocaleString("es-CO")} respuestas`}
          deltaLabel={`${results.nps.score - results.nps.previousScore > 0 ? "+" : ""}${
            results.nps.score - results.nps.previousScore
          } pts vs ${previousLabel}`}
          deltaTone={deltaTone(results.nps.score - results.nps.previousScore)}
        >
          <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground font-medium">
            <span>
              {results.nps.promoters} promotores · {results.nps.passives} neutros ·{" "}
              {results.nps.detractors} detractores
            </span>
            <StatusBadge
              state={
                results.nps.score >= 20
                  ? "success"
                  : results.nps.score >= 0
                    ? "pending"
                    : "failed"
              }
              labels={{
                success: "Zona favorable",
                pending: "Zona neutra",
                failed: "Zona de riesgo"
              }}
            />
          </div>
        </SurveyMetricCard>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex h-full flex-col justify-center gap-2 py-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-4 w-4" />
              <span className="text-xs font-bold tracking-widest">ENPS</span>
            </div>
            <p className="text-sm font-semibold text-text-primary">Esta encuesta no lo midió</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              El eNPS aparece cuando la encuesta incluye una pregunta de recomendabilidad.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
