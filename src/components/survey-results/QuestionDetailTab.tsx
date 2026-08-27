import * as React from "react";
import { Gauge, Info, ListChecks, MessageSquareQuote, Users, Vote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/feedback";
import type { SurveyDraft } from "@/components/survey-builder";
import {
  buildAnswerMatrix,
  buildOpenComments,
  buildQuestionBreakdowns,
  buildRespondents,
  sentimentTotals,
  type Sentiment,
} from "@/mocks/questionResponses";
import {
  flattenResultSections,
  sectionResultsForFilters,
  type SectionResult,
  type SegmentDefinition,
  type SurveyResults,
} from "@/mocks/surveyResults";
import { CommentsSentimentView, scopeToQuestion } from "./CommentsSentimentView";
import {
  CommentsFiltersButton,
  CommentsSearchBox,
  commentFilterCounts,
  commentTopics,
  useCommentFilters,
} from "./CommentsToolbar";
import { PARTICIPANT_SCORE_LEGEND } from "./favorabilityScale";
import { IndividualResponsesView, type AnswerDrillDown } from "./IndividualResponsesView";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import { MiniMetricCard, AnimatedNumber } from "./MiniMetricCard";
import { QuestionBreakdownView } from "./QuestionBreakdownView";
import { QuestionViewSwitch, type QuestionView } from "./QuestionViewSwitch";
import { ResultsFilterChips, ResultsFilterControls, THREE_TIER_HIGHLIGHT } from "./ResultsFilterToolbar";
import { RosterFilterButton, useRosterFilters } from "./RosterFilters";
import { COMMENT_FILTER_KEYS, commentMatchesFilters } from "./summaryModel";
import {
  SENTIMENT_NEGATIVE_CEILING,
  SENTIMENT_POSITIVE_FLOOR,
  SENTIMENT_SCALE_LEGEND,
  SENTIMENT_STYLES,
  SENTIMENT_WEIGHT,
  sentimentAverage,
  type SentimentAverage,
} from "./sentimentScale";
import { useResultsFilters } from "./useResultsFilters";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

interface QuestionDetailTabProps {
  draft: SurveyDraft;
  results: SurveyResults;
  segment: SegmentDefinition;
  onSegmentChange: (key: string) => void;
}

/**
 * Preguntas — the response-level view of the measurement.
 *
 * The other tabs aggregate: Participación counts who answered, Favorabilidad
 * scores what they said, eNPS reduces it to one number. None of them can answer
 * the three questions a manager actually arrives with — *how many people picked
 * a 4 on this*, *what did this person answer*, and *what did they write* — so
 * this tab is the one that keeps the responses themselves.
 *
 * Three readings of the same data, one switch between them, and they are wired
 * to each other: a tally row opens the roster narrowed to the people behind it,
 * an open question opens its comments. Sections, subsections and
 * sub-subsections nest exactly as the author wrote them, through the same
 * outline chrome the Favorabilidad tab uses, so the report reads as one screen.
 */
export function QuestionDetailTab({
  draft,
  results,
  segment,
  onSegmentChange,
}: QuestionDetailTabProps) {
  const [view, setView] = React.useState<QuestionView>("breakdown");
  const [drill, setDrill] = React.useState<AnswerDrillDown | null>(null);
  const [focusQuestionId, setFocusQuestionId] = React.useState<string | null>(null);
  // Search and filters belong to the toolbar row, so they live with the header
  // rather than inside the view they narrow.
  const commentFilters = useCommentFilters();
  // Corrections live with the reader's session, keyed by comment. A Map keeps
  // "no correction" distinguishable from "corrected back to the AI's reading".
  const [overrides, setOverrides] = React.useState<ReadonlyMap<string, Sentiment>>(new Map());

  const segments = React.useMemo(
    () => results.segments.filter((candidate) => !candidate.perPerson),
    [results.segments]
  );
  const activeSegment =
    segments.find((candidate) => candidate.key === segment.key) ?? segments[0] ?? segment;
  const filtersState = useResultsFilters(activeSegment, segments, onSegmentChange);

  const sections = React.useMemo(
    () => sectionResultsForFilters(results, filtersState.filters),
    [results, filtersState.filters]
  );

  const breakdowns = React.useMemo(
    () => buildQuestionBreakdowns(draft, { ...results, sections }),
    [draft, results, sections]
  );
  const allRespondents = React.useMemo(() => buildRespondents(draft, results), [draft, results]);
  const respondents = allRespondents;

  const matrix = React.useMemo(
    () => buildAnswerMatrix(respondents, breakdowns),
    [respondents, breakdowns]
  );

  // "Por persona" narrows through the toolbar like every other view: the state
  // lives here so its trigger can sit beside "Personalizar" instead of inside
  // the roster pane, while the chips and the count stay next to the list.
  const rosterFilters = useRosterFilters(respondents);
  const comments = React.useMemo(
    () => buildOpenComments(draft, { ...results, sections }, respondents),
    [draft, results, sections, respondents]
  );

  // "Filtrar a fondo" narrows who is in view, and a comment carries the same
  // demographics an answer does — so the same filter that reshapes the sections
  // reshapes the comment list, its counts and its KPIs. An anonymous survey
  // strips the demographics, and there `commentMatchesFilters` keeps the
  // comment rather than inventing a group for it.
  const scopedComments = React.useMemo(
    () => comments.filter((comment) => commentMatchesFilters(comment, filtersState.filters, segments)),
    [comments, filtersState.filters, segments]
  );

  // Only the demographics a comment carries are offered: the rest would look
  // like a filter and behave like nothing.
  const commentSegments = React.useMemo(
    () => segments.filter((candidate) => COMMENT_FILTER_KEYS.includes(candidate.key)),
    [segments]
  );

  const topics = React.useMemo(() => commentTopics(scopedComments), [scopedComments]);

  // The counts the filter popover shows are of the comments actually in play —
  // one question's when the reader arrived from it, all of them otherwise.
  const commentCounts = React.useMemo(
    () => commentFilterCounts(scopeToQuestion(scopedComments, focusQuestionId), overrides),
    [scopedComments, focusQuestionId, overrides]
  );

  // The KPI reads the corrections rather than counting them: a label the reader
  // fixed should move the average, which is the only reason correcting one is
  // worth the click.
  const sentiment = React.useMemo(
    () => sentimentAverage(sentimentTotals(scopedComments, overrides)),
    [scopedComments, overrides]
  );

  const totals = React.useMemo(() => {
    let questions = 0;
    let answers = 0;
    for (const section of flattenResultSections(sections)) {
      questions += section.questions.length;
      for (const question of section.questions) answers += question.n + question.nsnr;
    }
    return { questions, answers };
  }, [sections]);

  const setSentiment = React.useCallback((commentId: string, sentiment: Sentiment) => {
    setOverrides((current) => new Map(current).set(commentId, sentiment));
  }, []);

  const clearSentiment = React.useCallback((commentId: string) => {
    setOverrides((current) => {
      const next = new Map(current);
      next.delete(commentId);
      return next;
    });
  }, []);

  const drillToPeople = React.useCallback((questionId: string, tallyId: string) => {
    setDrill({ questionId, tallyId });
    setView("people");
  }, []);

  const openComments = React.useCallback((questionId: string) => {
    setFocusQuestionId(questionId);
    setView("comments");
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid shrink-0 grid-cols-2 gap-3 pt-6 sm:grid-cols-3 sm:pt-8 lg:grid-cols-5">
        <MiniMetricCard size="compact"
          icon={ListChecks}
          label="Preguntas"
          value={<AnimatedNumber value={totals.questions} format={formatCount} />}
        />
        <MiniMetricCard size="compact"
          icon={Vote}
          label="Respuestas registradas"
          value={<AnimatedNumber value={totals.answers} format={formatCount} />}
        />
        <MiniMetricCard size="compact"
          icon={Users}
          label="Personas con respuesta"
          value={<AnimatedNumber value={respondents.length} format={formatCount} />}
        />
        <MiniMetricCard size="compact"
          icon={MessageSquareQuote}
          label="Comentarios abiertos"
          value={<AnimatedNumber value={scopedComments.length} format={formatCount} />}
        />
        <SentimentAverageCard average={sentiment} />
      </div>

      {/* pb-20: the screen's floating action rail hovers over the last ~80px of
          the scroll area, and this tab's lists end in a real control. */}
      <div className="min-h-0 flex-1 pb-20 pt-6">
        <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card sm:p-8">
          {/* Same sticky toolbar the Favorabilidad views use: title, count, the
              shared filters, the view switch and the scale legend. */}
          <div className="sticky top-3 z-30 -mt-6 bg-surface pb-2 pt-6 sm:-mt-8 sm:pt-8">
            <div className="flex flex-wrap items-center gap-4 pb-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-bold text-text-primary">
                  {VIEW_TITLES[view]}
                </h3>
                <Badge
                  variant="neutral"
                  className="h-5 px-1.5 text-[11px] font-semibold tabular-nums"
                >
                  {view === "breakdown"
                    ? totals.questions
                    : view === "people"
                      ? respondents.length
                      : scopedComments.length}
                </Badge>
              </div>

              <div className="ml-auto flex items-center justify-end gap-3">
                {view === "people" && <RosterFilterButton state={rosterFilters} />}
                {(view === "breakdown" || view === "people") && (
                  <ResultsFilterControls
                    segments={segments}
                    activeSegment={activeSegment}
                    onSegmentChange={filtersState.handleSegmentChange}
                    filterableSegments={view === "people" ? [] : segments}
                    filters={filtersState.filters}
                    onApplyFilter={filtersState.applyFilter}
                    onClearFilters={filtersState.clearFilters}
                    visibleLevels={filtersState.visibleLevels}
                    hasHiddenLevels={filtersState.hasHiddenLevels}
                    onToggleLevel={filtersState.toggleLevel}
                    onResetLevels={filtersState.resetLevels}
                    highlightBands={filtersState.tierBands}
                    hasHiddenBands={filtersState.hasHiddenTierBands}
                    onToggleBand={filtersState.toggleTierBand}
                    onResetBands={filtersState.resetTierBands}
                    showViewBy={false}
                    showHighlight={view === "people"}
                    showFilters={view === "breakdown"}
                    highlightScale={THREE_TIER_HIGHLIGHT}
                    {...(view === "breakdown" ? {} : { hiddenLevelOptions: ["section", "subsection2", "subsection3", "question"] })}
                  />
                )}
                {view === "comments" && (
                  <>
                    <CommentsSearchBox
                      value={commentFilters.query}
                      onChange={commentFilters.setQuery}
                    />
                    <CommentsFiltersButton
                      filters={commentFilters}
                      topics={topics}
                      counts={commentCounts}
                      segmentFilters={{
                        segments: commentSegments,
                        filters: filtersState.filters,
                        onApplyFilter: filtersState.applyFilter,
                        onClearFilters: filtersState.clearFilters,
                      }}
                    />
                    {/* Only "Personalizar" travels over from Favorabilidad: there is
                        no score to resaltar here, and "Ver por" pivots a table
                        this view doesn't have. */}
                    <ResultsFilterControls
                      segments={segments}
                      activeSegment={activeSegment}
                      onSegmentChange={filtersState.handleSegmentChange}
                      filterableSegments={[]}
                      filters={filtersState.filters}
                      onApplyFilter={filtersState.applyFilter}
                      onClearFilters={filtersState.clearFilters}
                      visibleLevels={filtersState.visibleLevels}
                      hasHiddenLevels={filtersState.hasHiddenLevels}
                      onToggleLevel={filtersState.toggleLevel}
                      onResetLevels={filtersState.resetLevels}
                      highlightBands={filtersState.tierBands}
                      hasHiddenBands={filtersState.hasHiddenTierBands}
                      onToggleBand={filtersState.toggleTierBand}
                      onResetBands={filtersState.resetTierBands}
                      showViewBy={false}
                      showFilters={false}
                      showHighlight={false}
                    />
                  </>
                )}
                <QuestionViewSwitch value={view} onChange={setView} />
                {view === "people" && (
                  <MeasurementScaleButton
                    items={PARTICIPANT_SCORE_LEGEND}
                    title="Promedio por participante"
                    description="El número junto a cada nombre es el promedio de sus respuestas (de 1 a 5), agrupado en tres niveles: Favorable (4-5), Neutral (3-3.9) y Desfavorable (1-2.9). Las preguntas abiertas y NS/NR no cuentan."
                  />
                )}
                {view === "comments" && (
                  <MeasurementScaleButton items={SENTIMENT_SCALE_LEGEND} />
                )}
              </div>
            </div>

            {(view === "breakdown" || view === "comments") && (
              <ResultsFilterChips
                filters={filtersState.filters}
                segments={segments}
                onRemoveFilter={filtersState.removeFilter}
                onClearFilters={filtersState.clearFilters}
              />
            )}
          </div>

          {view === "breakdown" &&
            (hasAnyContent(sections) ? (
              <QuestionBreakdownView
                sections={sections}
                breakdowns={breakdowns}
                visibleLevels={filtersState.visibleLevels}
                onDrillDown={drillToPeople}
                onOpenComments={openComments}
              />
            ) : (
              <EmptyState
                icon={ListChecks}
                title="Sin preguntas con respuestas"
                description="Los filtros activos dejan fuera todas las preguntas de esta encuesta."
              />
            ))}

          {view === "people" && (
            <IndividualResponsesView
              sections={sections}
              respondents={respondents}
              breakdowns={breakdowns}
              matrix={matrix}
              comments={comments}
              sentimentOverrides={overrides}
              drill={drill}
              rosterFilters={rosterFilters}
              anonymous={draft.visibility === "anonymous"}
              highlightBands={filtersState.tierBands}
              hasHiddenBands={filtersState.hasHiddenTierBands}
            />
          )}

          {view === "comments" && (
            <CommentsSentimentView
              sections={sections}
              comments={scopedComments}
              overrides={overrides}
              filters={commentFilters}
              visibleLevels={filtersState.visibleLevels}
              onOverride={setSentiment}
              onResetOverride={clearSentiment}
              focusQuestionId={focusQuestionId}
              onClearFocus={() => setFocusQuestionId(null)}
              populationFiltered={filtersState.filters.length > 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * The average sentiment of every open comment, and the reading it lands on.
 *
 * The tab's fifth KPI used to count how many labels the reader had corrected —
 * a number about the reader's own housekeeping, not about the measurement. What
 * a manager arrives asking is *how did the written answers go*, so the card now
 * answers that: one index on favorability's own 0–100 ground, with the reading
 * it falls in spelled out beside it, and the split behind it on hover.
 */
function SentimentAverageCard({ average }: { average: SentimentAverage }) {
  const style = SENTIMENT_STYLES[average.type];
  const empty = average.index === null;

  return (
    <MiniMetricCard size="compact"
      icon={Gauge}
      label="Sentimiento promedio"
      color={empty ? undefined : style.foreground}
      value={
        empty ? (
          <span className="text-[24px] text-muted-foreground">—</span>
        ) : (
          <span className="flex flex-wrap items-baseline gap-2">
            <AnimatedNumber
              value={average.index ?? 0}
              format={(value) => Math.round(value).toString()}
            />
            {/* The number alone is a scale nobody has seen before; the word is
                what makes it readable at a glance, so they travel together. */}
            <span
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold leading-none"
              style={{
                backgroundColor: style.background,
                borderColor: style.border,
                color: style.foreground,
              }}
            >
              <style.icon className="h-3 w-3" strokeWidth={2.5} />
              {style.label}
            </span>
          </span>
        )
      }
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-md bg-muted/30 p-1 text-muted-foreground transition-colors hover:text-text-primary"
            >
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[400px] border-none bg-surface-nav p-4 text-white shadow-drawer">
            <div className="flex flex-col items-start gap-3 leading-relaxed">
              <p className="text-[12px]">
                <strong>Sentimiento promedio:</strong>
                <br />
                Cada comentario vale {SENTIMENT_WEIGHT.positive} si es positivo,{" "}
                {SENTIMENT_WEIGHT.neutral} si es neutral y {SENTIMENT_WEIGHT.negative} si es
                negativo. El promedio se lee como Positivo desde{" "}
                {SENTIMENT_POSITIVE_FLOOR}, Negativo hasta {SENTIMENT_NEGATIVE_CEILING} y Neutral
                entre los dos. Las correcciones que hagas a una lectura de la IA entran en el
                cálculo.
              </p>
              {/* No multiplier here — the weights already put the result on
                  0–100, so the shared FormulaBlock's "× 100" would be wrong. */}
              <div className="flex w-full flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  Fórmula
                </span>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <div className="flex flex-col items-center text-center leading-tight">
                    <span className="border-b border-current px-2 pb-0.5 leading-tight">
                      Suma del valor de cada comentario
                    </span>
                    <span className="px-2 pt-0.5 leading-tight opacity-80">
                      {formatCount(average.counted)} comentarios
                    </span>
                  </div>
                  <span className="text-[13px] font-semibold">=</span>
                  <span className="font-semibold">
                    {average.index === null
                      ? "sin comentarios"
                      : `${Math.round(average.index)} · ${SENTIMENT_STYLES[average.type].label}`}
                  </span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </MiniMetricCard>
  );
}

const VIEW_TITLES: Readonly<Record<QuestionView, string>> = {
  breakdown: "Detalle por secciones",
  people: "Respuestas individuales",
  comments: "Comentarios y sentimiento",
};

const hasAnyContent = (sections: readonly SectionResult[]): boolean =>
  sections.some(
    (section) => section.questions.length > 0 || hasAnyContent(section.children)
  );
