import * as React from "react";
import { overallDistribution, type SurveyResults, type SegmentDefinition } from "@/mocks/surveyResults";
import {
  formatPercent,
  POSITIVE,
  YELLOW,
  NEGATIVE,
  NSNR,
  FAVORABILITY_TARGET,
} from "./favorabilityScale";
import { MetricSummaryCard } from "./MetricSummaryCard";
import { Sparkline } from "@/components/survey-analytics/pulseCharts";
import { FormulaBlock } from "./FormulaBlock";
import { QuestionsTab } from "./QuestionsTab";
import { HeatmapTab } from "./HeatmapTab";
import type { ResultsSubTab } from "./ResultsSubTabSwitch";
import { useResultsFilters } from "./useResultsFilters";

function formatCount(n: number) {
 return new Intl.NumberFormat("es-CO").format(Math.round(n));
}

interface FavorabilityTabProps {
 results: SurveyResults;
 segment: SegmentDefinition;
 onSegmentChange: (key: string) => void;
}

export function FavorabilityTab({ results, segment, onSegmentChange }: FavorabilityTabProps) {
 const [activeSubTab, setActiveSubTab] = React.useState<ResultsSubTab>("questions");

  const segments = React.useMemo(
 () => results.segments.filter((candidate) => !candidate.perPerson),
 [results.segments]
 );
 const activeSegment =
 segments.find((candidate) => candidate.key === segment.key) ?? segments[0] ?? segment;

 // One filter state for both sub-tabs: narrowing to "País: Colombia" or
 // resaltando a band in the heatmap is still narrowed in Preguntas, and back.
 const filtersState = useResultsFilters(activeSegment, segments, onSegmentChange);

 const { distribution } = overallDistribution(results);
 const unfavorableCount = distribution[0] + distribution[1];
 const neutralCount = distribution[2];
 const favorableCount = distribution[3] + distribution[4];
 const nsNrCount = results.rankedQuestions.reduce((sum, question) => sum + question.nsnr, 0);

 return (
 <div className="flex h-full min-h-0 flex-col">
  <MetricSummaryCard
    accentColor="bg-status-positive"
    title="Sentimiento general"
    hint={
      <div className="flex flex-col gap-3 items-start leading-relaxed">
        <p className="text-[12px]"><strong>Sentimiento:</strong><br/>Distribución de respuestas favorables, neutrales y desfavorables en la escala de 1 a 5.</p>
        <FormulaBlock
          numerator="Respuestas favorables"
          denominator="Total de respuestas"
          result="% de favorabilidad"
        />
      </div>
    }
    bigValue={formatPercent(results.favorability)}
    caption={`Meta ${FAVORABILITY_TARGET}% · ${results.trend.length} mediciones`}
    ringsLabel="Distribución de respuestas"
    ringsTotal={`${formatCount(favorableCount + neutralCount + unfavorableCount + nsNrCount)} en total`}
    rings={[
      {
        id: "favorable",
        label: "Favorables",
        percentage: Math.round((favorableCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
        color: POSITIVE,
        count: formatCount(favorableCount),
        active: filtersState.tierBands.has("favorable"),
        onToggle: () => filtersState.toggleTierBand("favorable"),
      },
      {
        id: "neutral",
        label: "Neutrales",
        percentage: Math.round((neutralCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
        color: YELLOW,
        count: formatCount(neutralCount),
        active: filtersState.tierBands.has("neutral"),
        onToggle: () => filtersState.toggleTierBand("neutral"),
      },
      {
        id: "unfavorable",
        label: "Desfavorables",
        percentage: Math.round((unfavorableCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
        color: NEGATIVE,
        count: formatCount(unfavorableCount),
        active: filtersState.tierBands.has("unfavorable"),
        onToggle: () => filtersState.toggleTierBand("unfavorable"),
      },
      {
        id: "nsnr",
        label: "NS/NR",
        percentage: Math.round((nsNrCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
        color: NSNR,
        count: formatCount(nsNrCount),
        active: filtersState.tierBands.has("nsnr"),
        onToggle: () => filtersState.toggleTierBand("nsnr"),
      },
    ]}
    topAreasTitle="Top 3 áreas con más sentimiento negativo"
    topAreas={
      results.sections
        .filter(s => s.n > 0)
        .sort((a, b) => a.favorability - b.favorability)
        .slice(0, 3)
        .map(s => ({
          id: s.id,
          label: s.title,
          value: 100 - s.favorability,
          displayValue: formatPercent(100 - s.favorability),
        }))
    }
    chartTitle="Tendencia por medición"
    chart={
      <Sparkline
        points={results.trend.map((point) => ({ id: point.label, name: point.label, value: point.favorability }))}
        target={FAVORABILITY_TARGET}
        format={formatPercent}
        ariaLabel={`Favorabilidad de las últimas ${results.trend.length} mediciones`}
        height={56}
        showPoints
        fitTarget={false}
      />
    }
  />

 <div className="min-h-0 flex-1 flex flex-col mt-6">
 <div className=" pb-6 min-h-0 flex-1">
 {activeSubTab === "questions" ? (
 <QuestionsTab
 results={results}
 segments={segments}
 activeSegment={activeSegment}
 filtersState={filtersState}
 onSubTabChange={setActiveSubTab}
 />
 ) : (
 <HeatmapTab
 results={results}
 segments={segments}
 activeSegment={activeSegment}
 filtersState={filtersState}
 onSubTabChange={setActiveSubTab}
 />
 )}
 </div>
 </div>
 </div>
 );
}
