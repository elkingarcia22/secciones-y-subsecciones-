import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  Minus,
  TrendingDown,
  HelpCircle,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { overallDistribution, type SurveyResults, type SegmentDefinition } from "@/mocks/surveyResults";
import { 
  formatPercent,
  POSITIVE, POSITIVE_BG, POSITIVE_BORDER, POSITIVE_TEXT,
  YELLOW, YELLOW_BG, YELLOW_BORDER, YELLOW_TEXT,
  NEGATIVE, NEGATIVE_BG, NEGATIVE_BORDER, NEGATIVE_TEXT,
  NSNR, NSNR_BG, NSNR_BORDER, NSNR_TEXT
} from "./favorabilityScale";
import { MiniMetricCard, AnimatedNumber } from "./MiniMetricCard";
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

  // The survey's demographic breakdowns are the "Ver por" options — per-person
  // ones are not, since a grid or a list of one row per respondent has nothing
  // to pivot or group by.
  const filterableSegments = results.segments.filter(s => s.type === "demographic");
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
      <div className="grid shrink-0 grid-cols-2 gap-3 pt-6 sm:grid-cols-3 sm:pt-8 lg:grid-cols-5">
        <MiniMetricCard size="compact"
          icon={BarChart3}
          label="Total de favorabilidad"
          value={<AnimatedNumber value={results.favorability} format={formatPercent} />}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                <div className="flex flex-col gap-3 items-start leading-relaxed">
                  <p className="text-[12px]"><strong>Favorabilidad:</strong><br/>La favorabilidad es el porcentaje de respuestas favorables en una escala de 1 a 5, donde se consideran "favorables" las respuestas de 4 y 5.</p>
                  <FormulaBlock
                    numerator="Respuestas favorables"
                    denominator="Total de respuestas"
                    result="% de favorabilidad"
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </MiniMetricCard>

        <MiniMetricCard size="compact"
          icon={TrendingUp}
          label="Favorables"
          value={<AnimatedNumber value={favorableCount} format={formatCount} />}
          color={POSITIVE_TEXT}
        />
        <MiniMetricCard size="compact"
          icon={Minus}
          label="Neutrales"
          value={<AnimatedNumber value={neutralCount} format={formatCount} />}
          color={YELLOW_TEXT}
        />
        <MiniMetricCard size="compact"
          icon={TrendingDown}
          label="Desfavorables"
          value={<AnimatedNumber value={unfavorableCount} format={formatCount} />}
          color={NEGATIVE_TEXT}
        />
        <MiniMetricCard size="compact"
          icon={HelpCircle}
          label="No sabe / No responde"
          value={<AnimatedNumber value={nsNrCount} format={formatCount} />}
          color={NSNR_TEXT}
        />
      </div>

      <div className="min-h-0 flex-1 flex flex-col">
        <div className="pt-6 pb-6 min-h-0 flex-1">
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
