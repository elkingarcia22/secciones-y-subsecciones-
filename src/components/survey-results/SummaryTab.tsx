import * as React from "react";
import type { SurveyDraft } from "@/components/survey-builder";
import {
  buildOpenComments,
  buildRespondents,
  type OpenComment,
  type Sentiment,
} from "@/mocks/questionResponses";
import {
  participationBySegment,
  sectionResultsForFilters,
  type SegmentDefinition,
  type SegmentFilter,
  type SurveyResults,
} from "@/mocks/surveyResults";
import { SummaryFilterBar } from "./SummaryFilterBar";
import { SummaryGaps } from "./SummaryGaps";
import { SummaryHeadline } from "./SummaryHeadline";
import { SummaryPriorities } from "./SummaryPriorities";
import { SummarySentimentCard } from "./SummarySentimentCard";
import { SummaryStrengths } from "./SummaryStrengths";
import {
  SUMMARY_BLOCKS,
  VIEW_GENERAL,
  buildPriorities,
  buildStrengths,
  defaultFindingLevel,
  findingsAtLevel,
  resolveScope,
  scopedMetrics,
  scopedQuestionIds,
  sentimentRollup,
  type AlertTarget,
  type FindingLevel,
  type SummaryBlock,
} from "./summaryModel";

interface SummaryTabProps {
  draft: SurveyDraft;
  results: SurveyResults;
  segment: SegmentDefinition;
  segments: readonly SegmentDefinition[];
  onSegmentChange: (key: string) => void;
  /**
   * The demographic the page is read through, or `VIEW_GENERAL` for the whole
   * measurement. Owned by the screen so the cut survives a tab switch, like
   * the scope and the filters.
   */
  viewBy: string;
  onViewByChange: (key: string) => void;
  /** Opens the tab that can answer whatever the reader just pressed. */
  onNavigate: (target: AlertTarget) => void;
  /** The branch in view. Owned by the screen so it survives a tab switch. */
  scopeId: string;
  onScopeChange: (id: string) => void;
  /** Demographic narrowing, owned by the screen for the same reason. */
  filters: readonly SegmentFilter[];
  onApplyFilter: (key: string, optionId: string) => void;
  onRemoveFilter: (key: string) => void;
  onClearFilters: () => void;
}

/**
 * Resumen — the screen that decides what the reader does next.
 *
 * The rest of the report states the same facts many times over — the worst
 * block appears in the ranking, the heatmap, the AI tab and the comments — and
 * a summary that repeats them an eighth time adds reading, not insight. So
 * every block here answers a question no other block answers: the KPIs say
 * *how did it go*, the executive reading says *can I trust it and where does
 * it hurt*, the priorities say *what first and why* — pairing the score with
 * the comments that confirm it — the strengths say *what to lean on*, the gaps
 * say *where it concentrates*, the voice block says *in whose words*, and the
 * AI strip says *what analysis waits one tab away*. One conclusion, told once,
 * each time from the angle that makes it actionable.
 *
 * Nothing here compares against an earlier measurement. This screen answers
 * "¿qué pasa hoy y qué hago con eso?"; the history of a figure is a different
 * question, and mixing the two turns every number into two numbers.
 *
 * Everything obeys one bar. Narrow to "3.2 Reconocimiento", or to "País:
 * Colombia", and every block is recomputed over what is left — because the
 * second question a reader asks is always "and inside the part that is
 * failing?".
 */
export function SummaryTab({
  draft,
  results,
  segment,
  segments,
  onSegmentChange: _onSegmentChange,
  viewBy,
  onViewByChange,
  onNavigate,
  scopeId,
  onScopeChange,
  filters,
  onApplyFilter,
  onRemoveFilter,
  onClearFilters,
}: SummaryTabProps) {
  const [level, setLevel] = React.useState<FindingLevel | null>(null);
  const [visibleBlocks, setVisibleBlocks] = React.useState<ReadonlySet<SummaryBlock>>(
    () => new Set(SUMMARY_BLOCKS.map((block) => block.id))
  );

  const toggleBlock = React.useCallback((block: SummaryBlock) => {
    setVisibleBlocks((current) => {
      const next = new Set(current);
      if (next.has(block)) next.delete(block);
      else next.add(block);
      return next;
    });
  }, []);
  const resetBlocks = React.useCallback(
    () => setVisibleBlocks(new Set(SUMMARY_BLOCKS.map((block) => block.id))),
    []
  );

  /* ----------------------------------------------------------- población */

  // The demographic filters rebuild the section tree before anything reads it,
  // so a filtered headline, a filtered ranking and a filtered priority all rest
  // on the same narrowed population rather than each one narrowing its own way.
  const filteredResults = React.useMemo<SurveyResults>(
    () =>
      filters.length === 0
        ? results
        : { ...results, sections: sectionResultsForFilters(results, filters) },
    [results, filters]
  );

  const scope = React.useMemo(
    () => resolveScope(filteredResults, scopeId),
    [filteredResults, scopeId]
  );
  const metrics = React.useMemo(() => scopedMetrics(scope), [scope]);

  /* ----------------------------------------------------------- hallazgos */

  // A level is offered only when it actually ranks something. Inside "3.2" the
  // "Secciones" level holds exactly one row, and a ranking of one row is a
  // control that answers nothing.
  const availableLevels = React.useMemo(() => {
    const all = ["section", "subsection2", "subsection3", "question"] as const;
    const rankable = all.filter((candidate) => findingsAtLevel(scope, candidate).length >= 2);
    return rankable.length > 0
      ? rankable
      : all.filter((candidate) => findingsAtLevel(scope, candidate).length > 0);
  }, [scope]);
  const defaultLevel = React.useMemo(() => defaultFindingLevel(scope), [scope]);
  const activeLevel = level && availableLevels.includes(level) ? level : defaultLevel;

  const findings = React.useMemo(
    () => findingsAtLevel(scope, activeLevel),
    [scope, activeLevel]
  );

  /* ---------------------------------------------------------- comentarios */

  const respondents = React.useMemo(() => buildRespondents(draft, results), [draft, results]);
  const comments = React.useMemo(
    () => buildOpenComments(draft, results, respondents),
    [draft, results, respondents]
  );
  const scopedIds = React.useMemo(() => scopedQuestionIds(scope), [scope]);
  const scopedComments = React.useMemo(
    () =>
      comments.filter(
        (comment) => scopedIds.has(comment.questionId) && matchesFilters(comment, filters)
      ),
    [comments, scopedIds, filters]
  );

  // The summary reads the model's own labels: corrections live in the comments
  // view, which owns that state and is where a reader goes to make them.
  const noOverrides = React.useMemo(() => new Map<string, Sentiment>(), []);
  const sentiment = React.useMemo(
    () => sentimentRollup(scopedComments, noOverrides),
    [scopedComments, noOverrides]
  );

  /* ------------------------------------------------- prioridades y cambios */

  const priorities = React.useMemo(
    () => buildPriorities(findings, sentiment.topics),
    [findings, sentiment.topics]
  );
  const strengths = React.useMemo(() => buildStrengths(findings), [findings]);

  /* ------------------------------------------------------------ segmentos */

  // "Ver por" decides which cuts the brechas block opens onto: the whole set
  // in General — the page has no reason to prefer one demographic before the
  // reader names one — or that single cut once they do.
  const gapSegments = React.useMemo(
    () =>
      viewBy === VIEW_GENERAL
        ? segments
        : segments.filter((candidate) => candidate.key === viewBy),
    [segments, viewBy]
  );



  const participation = React.useMemo(
    () => participationBySegment(results, segment, filters),
    [results, segment, filters]
  );

  // With a demographic filter on, the survey-wide participation is no longer
  // the participation of the people in view, so it is re-totalled from the
  // groups that survived the filter.
  const scopedParticipation = React.useMemo(() => {
    if (filters.length === 0) return results.participation;
    const completed = participation.reduce((sum, row) => sum + row.completed, 0);
    const inProgress = participation.reduce((sum, row) => sum + row.inProgress, 0);
    const invited = participation.reduce((sum, row) => sum + row.invited, 0);
    return {
      completed,
      inProgress,
      invited,
      rate: invited === 0 ? 0 : Math.round((completed / invited) * 1000) / 10,
      // Carried through because the type demands it; the Resumen never reads a
      // previous measurement, so nothing on this screen shows it.
      previousRate: results.participation.previousRate,
    };
  }, [filters, participation, results.participation]);

  /* --------------------------------------------------------------- lectura */

  const headlineResults = React.useMemo<SurveyResults>(
    () => ({ ...filteredResults, participation: scopedParticipation }),
    [filteredResults, scopedParticipation]
  );

  const shows = (block: SummaryBlock) => visibleBlocks.has(block);

  return (
    <div className="flex flex-col gap-6 pb-4">
      <SummaryFilterBar
        sections={results.sections}
        scope={scope}
        onScopeChange={onScopeChange}
        segments={segments}
        viewBy={viewBy}
        onViewByChange={onViewByChange}
        filters={filters}
        onApplyFilter={onApplyFilter}
        onRemoveFilter={onRemoveFilter}
        onClearFilters={onClearFilters}
        level={activeLevel}
        availableLevels={availableLevels}
        onLevelChange={setLevel}
        visibleBlocks={visibleBlocks}
        onToggleBlock={toggleBlock}
        onResetBlocks={resetBlocks}
      />

      <SummaryHeadline
        results={headlineResults}
        scope={scope}
        metrics={metrics}
        sentiment={sentiment}
        filtered={filters.length > 0}
        onNavigate={onNavigate}
      />

      {shows("prioridades") && (
        <SummaryPriorities priorities={priorities} onNavigate={onNavigate} />
      )}

      {shows("fortalezas") && <SummaryStrengths strengths={strengths} />}

      {shows("brechas") && (
        <SummaryGaps
          segments={gapSegments}
          results={results}
          filters={filters}
          onOpenHeatmap={() => onNavigate("favorability")}
        />
      )}

      {shows("voz") && (
        <SummarySentimentCard
          sentiment={sentiment}
          onOpenComments={() => onNavigate("questions")}
        />
      )}
    </div>
  );
}

/**
 * Whether a comment was written by somebody the filters keep.
 *
 * Only the demographics a comment actually carries can be honoured; an
 * anonymous survey strips them, and then a filtered comment list would be a
 * fiction. So an unknown value is kept rather than guessed at, and the card
 * keeps saying what it counted.
 */
function matchesFilters(comment: OpenComment, filters: readonly SegmentFilter[]): boolean {
  // Grouped by demographic first: several options of one demographic are a
  // union ("Área: Producto o Tecnología"), different demographics intersect.
  const byKey = new Map<string, string[]>();
  for (const filter of filters) {
    const group = byKey.get(filter.key);
    if (group) group.push(filter.optionId);
    else byKey.set(filter.key, [filter.optionId]);
  }

  return [...byKey.entries()].every(([key, optionIds]) => {
    const value = key === "area" ? comment.area : key === "country" ? comment.country : null;
    return value === null || optionIds.some((optionId) => value === optionId);
  });
}

