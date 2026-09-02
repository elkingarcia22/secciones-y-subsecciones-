import * as React from "react";
import { ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RingGauge } from "@/components/survey-analytics/pulseCharts";

import { EmptyState } from "@/components/feedback";
import type { SurveyDraft } from "@/components/survey-builder";
import { buildAnswerMatrix, buildOpenComments, buildQuestionBreakdowns, buildRespondents, sentimentTotals, type Sentiment } from "@/mocks/questionResponses";
import { flattenResultSections, sectionResultsForFilters, type SectionResult, type SegmentDefinition, type SurveyResults } from "@/mocks/surveyResults";
import { CommentsSentimentView, scopeToQuestion } from "./CommentsSentimentView";
import { CommentsFiltersButton, CommentsSearchBox, commentFilterCounts, commentTopics, useCommentFilters } from "./CommentsToolbar";
import { PARTICIPANT_SCORE_LEGEND } from "./favorabilityScale";
import { IndividualResponsesView, type AnswerDrillDown } from "./IndividualResponsesView";
import { MeasurementScaleButton } from "./MeasurementScaleButton";
import { AnimatedNumber } from "./MiniMetricCard";
import { ResultsSummaryCard } from "./ResultsSummaryCard";
import { SpectrumScale } from "@/components/survey-analytics/pulseCharts";
import { QuestionBreakdownView } from "./QuestionBreakdownView";
import { QuestionViewSwitch, type QuestionView } from "./QuestionViewSwitch";
import { ResultsFilterChips, ResultsFilterControls, THREE_TIER_HIGHLIGHT } from "./ResultsFilterToolbar";
import { RosterFilterButton, useRosterFilters } from "./RosterFilters";
import { COMMENT_FILTER_KEYS, commentMatchesFilters } from "./summaryModel";
import { SENTIMENT_NEGATIVE_CEILING, SENTIMENT_POSITIVE_FLOOR, SENTIMENT_SCALE_LEGEND, SENTIMENT_STYLES, SENTIMENT_WEIGHT, sentimentAverage, SENTIMENT_ORDER } from "./sentimentScale";
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
  const [sentimentFilter, setSentimentFilter] = React.useState<ReadonlySet<Sentiment>>(new Set());
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
    () => comments.filter((comment) => {
      if (!commentMatchesFilters(comment, filtersState.filters, segments)) return false;
      if (sentimentFilter.size > 0 && !sentimentFilter.has(comment.sentiment)) return false;
      return true;
    }),
    [comments, filtersState.filters, segments, sentimentFilter]
  );

  const toggleSentimentFilter = React.useCallback((sentiment: Sentiment) => {
    setSentimentFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sentiment)) next.delete(sentiment);
      else next.add(sentiment);
      return next;
    });
  }, []);

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
 const sentimentCounts = React.useMemo(
 () => sentimentTotals(scopedComments, overrides),
 [scopedComments, overrides]
 );
 const sentiment = React.useMemo(() => sentimentAverage(sentimentCounts), [sentimentCounts]);

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
 <ResultsSummaryCard
 className="mb-6 mt-1 shrink-0"
 label="Sentimiento promedio"
 tone={sentiment.index === null ? "neutral" : SENTIMENT_TONE[sentiment.type]}
 value={
 sentiment.index === null ? (
 <span className="text-text-muted">—</span>
 ) : (
 <AnimatedNumber value={sentiment.index} format={(value) => Math.round(value).toString()} />
 )
 }
 valueAside={
 sentiment.index !== null && (
 <span
 className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-bold leading-none"
 style={{
 backgroundColor: SENTIMENT_STYLES[sentiment.type].background,
 borderColor: SENTIMENT_STYLES[sentiment.type].border,
 color: SENTIMENT_STYLES[sentiment.type].foreground,
 }}
 >
 <SentimentIcon type={sentiment.type} />
 {SENTIMENT_STYLES[sentiment.type].label}
 </span>
 )
 }
 caption={`${formatCount(sentiment.counted)} ${sentiment.counted === 1 ? "comentario analizado" : "comentarios analizados"} · índice de 0 a 100`}
 hint={
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
 {formatCount(sentiment.counted)} comentarios
 </span>
 </div>
 <span className="text-[13px] font-semibold">=</span>
 <span className="font-semibold">
 {sentiment.index === null
 ? "sin comentarios"
 : `${Math.round(sentiment.index)} · ${SENTIMENT_STYLES[sentiment.type].label}`}
 </span>
 </div>
 </div>
 </div>
 }
  rightContent={
    <div className="flex gap-0">
      {/* Rings de métricas - izquierda con separador */}
      <div className="flex flex-col gap-3 flex-1 lg:border-r lg:border-border/40 lg:pr-8">
        <span className="text-[11px] font-semibold text-text-muted">Resumen de respuestas</span>
        <div className="flex items-center justify-between gap-4">
          {(() => {
            const maxPossible = results.participation.invited * totals.questions;
            const rings = [
              { id: "questions", label: "Preguntas", value: totals.questions, max: totals.questions, color: "text-primary" },
              { id: "answers", label: "Respuestas", value: totals.answers, max: maxPossible, color: "text-status-positive" },
              { id: "people", label: "Personas", value: respondents.length, max: results.participation.invited, color: "text-[#EAB308]" },
            ];
            return rings.map((ring) => (
              <div key={ring.id} className="flex flex-col items-center gap-1.5">
                <div className={cn("relative", ring.color)}>
                  <RingGauge
                    value={ring.max > 0 ? (ring.value / ring.max) * 100 : 0}
                    ariaLabel={ring.label}
                    size={60}
                    strokeWidth={5.5}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-text-primary">
                    {formatCount(ring.value)}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-text-muted leading-tight text-center">{ring.label}</span>
                <span className="text-[9px] text-text-muted">de {formatCount(ring.max)}</span>
              </div>
            ));
          })()}
        </div>
      </div>
      {/* Sentiment segments - derecha con filtros */}
      <div className="flex flex-col gap-2.5 flex-1 pl-8">
        <span className="text-[11px] font-semibold text-text-muted">Comentarios por sentimiento</span>
        <div className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-muted dark:bg-white/10">
          {SENTIMENT_ORDER.filter((id) => sentimentCounts[id] > 0).map((id) => (
            <span
              key={id}
              className={cn(
                "h-full min-w-[3px] pulse-bar-grow origin-left transition-opacity duration-200",
                sentimentFilter.size > 0 && !sentimentFilter.has(id as Sentiment) && "opacity-30"
              )}
              style={{
                flexGrow: sentimentCounts[id],
                backgroundColor: SENTIMENT_STYLES[id].color,
              }}
            />
          ))}
        </div>
        <ul className="flex flex-col gap-0.5">
          {SENTIMENT_ORDER.map((id) => {
            const isActive = sentimentFilter.has(id as Sentiment);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => toggleSentimentFilter(id as Sentiment)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-[12px] transition-colors duration-200",
                    "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isActive && "bg-primary/[0.06] ring-1 ring-primary/30",
                    sentimentFilter.size > 0 && !isActive && "opacity-60"
                  )}
                >
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: SENTIMENT_STYLES[id].color }} />
                  <span className="min-w-0 flex-1 truncate font-medium text-text-secondary">
                    {SENTIMENT_STYLES[id].plural.charAt(0).toUpperCase() + SENTIMENT_STYLES[id].plural.slice(1)}
                  </span>
                  <span className="shrink-0 font-bold tabular-nums text-text-primary">{formatCount(sentimentCounts[id])}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  }
 chartTitle="Dónde cae el promedio en la escala"
 chartInset
 chart={
 <SpectrumScale
 value={sentiment.index}
 min={0}
 max={100}
 zones={[
 { id: "negative", label: `Negativo · hasta ${SENTIMENT_NEGATIVE_CEILING}`, from: 0, to: SENTIMENT_NEGATIVE_CEILING, color: SENTIMENT_STYLES.negative.color },
 { id: "neutral", label: "Neutral", from: SENTIMENT_NEGATIVE_CEILING, to: SENTIMENT_POSITIVE_FLOOR, color: SENTIMENT_STYLES.neutral.color },
 { id: "positive", label: `Positivo · desde ${SENTIMENT_POSITIVE_FLOOR}`, from: SENTIMENT_POSITIVE_FLOOR, to: 100, color: SENTIMENT_STYLES.positive.color },
 ]}
 format={(value) => Math.round(value).toString()}
 ariaLabel={`Sentimiento promedio ${sentiment.index === null ? "sin comentarios" : Math.round(sentiment.index)} en una escala de 0 a 100`}
 />
 }
 />

 {/* pb-20: the screen's floating action rail hovers over the last ~80px of
 the scroll area, and this tab's lists end in a real control. */}
 <div className="min-h-0 flex-1 pb-20 ">
 <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card sm:p-8">
 {/* Same sticky toolbar the Favorabilidad views use: title, count, the
 shared filters, the view switch and the scale legend. */}
 <div className="sticky top-3 z-30 -mt-6 pt-6 pb-2 sm:-mt-8 sm:pt-8 bg-surface">
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
/** Card tone per sentiment reading — the same three the badge uses. */
const SENTIMENT_TONE: Readonly<Record<Sentiment, "positive" | "yellow" | "negative">> = {
 positive: "positive",
 neutral: "yellow",
 negative: "negative",
};

function SentimentIcon({ type }: { type: Sentiment }) {
 const Icon = SENTIMENT_STYLES[type].icon;
 return <Icon className="h-3 w-3" strokeWidth={2.5} />;
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
