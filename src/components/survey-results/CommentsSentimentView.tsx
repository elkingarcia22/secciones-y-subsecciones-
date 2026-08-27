import * as React from "react";
import {
  ChevronRight,
  MessageSquareQuote,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/feedback";
import type { SectionResult } from "@/mocks/surveyResults";
import {
  effectiveSentiment,
  type OpenComment,
  type Sentiment,
} from "@/mocks/questionResponses";
import {
  matchesCommentFilters,
  type CommentFiltersState,
} from "./CommentsToolbar";
import { CommentsSummaryBar } from "./CommentsSummaryBar";
import { levelForDepth, type ResultLevel } from "./resultLevels";
import { ResultsSectionTree } from "./ResultsSectionTree";
import {
  SentimentBreakdownDots,
  SentimentBreakdownHeaders,
  SentimentWithBreakdown,
  sentimentGroups,
} from "./SentimentBreakdown";
import { ConfidenceMeter, SentimentSegmentedControl } from "./SentimentControls";
import { AI_CONFIDENCE_FLOOR, SENTIMENT_STYLES } from "./sentimentScale";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/** Comments shown per question before asking for the rest. */
const PAGE_SIZE = 6;

interface CommentsSentimentViewProps {
  /** The survey's own outline, so comments are read where they were written. */
  sections: readonly SectionResult[];
  comments: readonly OpenComment[];
  overrides: ReadonlyMap<string, Sentiment>;
  /** Search and filters, owned by the toolbar up in the header row. */
  filters: CommentFiltersState;
  /** Levels still showing their totals, straight from "Personalizar". */
  visibleLevels: ReadonlySet<ResultLevel>;
  onOverride: (commentId: string, sentiment: Sentiment) => void;
  onResetOverride: (commentId: string) => void;
  /** Set when the reader jumped here from one open question. */
  focusQuestionId: string | null;
  onClearFocus: () => void;
  /**
   * Whether "Filtrar a fondo" is narrowing the population. It only changes what
   * an empty list is allowed to claim: with a filter on, no comments means the
   * filter left none, not that the survey never asked an open question.
   */
  populationFiltered?: boolean;
}

/**
 * What people wrote, kept where they wrote it.
 *
 * A comment only means something next to the question that provoked it, and
 * every question lives in a section — so this view is the same accordion the
 * Secciones and Favorabilidad views use, with the written answers as the body
 * instead of a tally or a score. One flat wall of quotes forced every card to
 * repeat its own section and question just to be legible, and cost a screenful
 * of chrome before the first comment; the outline says all of that once, at the
 * top of the branch.
 *
 * The sentiment the model read stays a *suggestion*: it is a correctable label
 * on each comment, a shape per section on the right of every header, and a
 * filter in the toolbar — never a panel of its own.
 */
export function CommentsSentimentView({
  sections,
  comments,
  overrides,
  filters,
  visibleLevels,
  onOverride,
  onResetOverride,
  focusQuestionId,
  onClearFocus,
  populationFiltered = false,
}: CommentsSentimentViewProps) {
  const scoped = React.useMemo(
    () => scopeToQuestion(comments, focusQuestionId),
    [comments, focusQuestionId]
  );

  const visible = React.useMemo(
    () => scoped.filter((comment) => matchesCommentFilters(comment, filters, overrides)),
    [scoped, filters, overrides]
  );

  /** Comments by the question they answer — the body of every branch below. */
  const byQuestion = React.useMemo(() => {
    const grouped = new Map<string, OpenComment[]>();
    for (const comment of visible) {
      const bucket = grouped.get(comment.questionId);
      if (bucket) bucket.push(comment);
      else grouped.set(comment.questionId, [comment]);
    }
    return grouped as ReadonlyMap<string, readonly OpenComment[]>;
  }, [visible]);

  // The outline, cut down to the branches that still hold a comment. Filtering
  // the list has to filter the tree too: a section header over nothing is worse
  // than no header.
  const outline = React.useMemo(() => pruneToComments(sections, byQuestion), [sections, byQuestion]);

  const filtersActive = filters.isNarrowed;

  // The strip above the outline counts what is in scope, not what survived the
  // filters: it is the reference the filters are read against.
  const scopedGroups = React.useMemo(() => sentimentGroups(scoped, overrides), [scoped, overrides]);
  const correctedCount = React.useMemo(
    () => scoped.filter((comment) => overrides.has(comment.id)).length,
    [scoped, overrides]
  );

  // The branch the tree itself opens on arrival — first section, its first
  // subsection, and so on down. Its questions open with it, so the reader lands
  // on comments instead of on a closed table.
  const firstBranch = React.useMemo(() => defaultOpenBranch(outline), [outline]);

  if (comments.length === 0) {
    return populationFiltered ? (
      <EmptyState
        icon={Search}
        title="Sin comentarios en esta población"
        description="Nadie de los grupos que dejaste en el filtro escribió una respuesta abierta. Quita o cambia el filtro para volver a verlas."
      />
    ) : (
      <EmptyState
        icon={MessageSquareQuote}
        title="Esta encuesta no tiene preguntas abiertas"
        description="Los comentarios aparecen aquí cuando la encuesta incluye al menos una pregunta abierta. Agrega una en la próxima medición para recoger texto libre."
      />
    );
  }

  const focused = focusQuestionId ? scoped[0] : null;

  return (
    <div className="flex flex-col gap-4">
      {focused && (
        <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2">
          <p className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-primary">
            Solo «{focused.questionStatement}»
          </p>
          <button
            type="button"
            onClick={onClearFocus}
            aria-label="Ver los comentarios de todas las preguntas"
            className="shrink-0 rounded-md p-0.5 text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      <CommentsSummaryBar groups={scopedGroups} corrected={correctedCount} />

      {outline.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin comentarios que coincidan"
          description="Prueba con otros filtros o limpia la búsqueda."
          className="border-none bg-transparent shadow-none"
        />
      ) : (
        <ResultsSectionTree
          sections={outline}
          // A filtered tree is a short tree: opening every branch saves the
          // reader three clicks to reach the four comments that survived.
          expandAll={filtersActive || focusQuestionId !== null}
          renderSubtitle={(section) => {
            const questions = countCommentQuestions(section, byQuestion);
            const total = countSectionComments(section, byQuestion);
            return (
              <>
                {questions} {questions === 1 ? "pregunta abierta" : "preguntas abiertas"} ·{" "}
                {formatCount(total)} comentarios
              </>
            );
          }}
          renderMetric={(section) =>
            visibleLevels.has(levelForDepth(section.depth)) ? (
              <SectionCommentMetric
                comments={collectSectionComments(section, byQuestion)}
                overrides={overrides}
              />
            ) : (
              <HiddenValue />
            )
          }
          renderQuestions={(section) => (
            <CommentedQuestionTable
              section={section}
              byQuestion={byQuestion}
              overrides={overrides}
              hideCounts={!visibleLevels.has("question")}
              autoOpenQuestionId={focusQuestionId}
              openByDefault={filtersActive || firstBranch.has(section.id)}
              onOverride={onOverride}
              onResetOverride={onResetOverride}
            />
          )}
        />
      )}
    </div>
  );
}

/** A muted dash where a level's number would be, same as the other tabs. */
function HiddenValue() {
  return (
    <span
      className="inline-flex h-5 items-center px-1.5 text-[12px] font-medium leading-none text-muted-foreground/40"
      title="Total oculto: este nivel está desmarcado en Personalizar"
    >
      —
    </span>
  );
}

/** The comments in play: one question's, when the reader jumped in from it. */
export const scopeToQuestion = (
  comments: readonly OpenComment[],
  focusQuestionId: string | null
): readonly OpenComment[] =>
  focusQuestionId ? comments.filter((comment) => comment.questionId === focusQuestionId) : comments;

/* ------------------------------------------------------------------ outline */

/**
 * The section tree with only the questions that still have a comment.
 *
 * Built as new nodes rather than by hiding rows: `ResultsSectionTree` counts
 * what it is given, so a pruned copy is what keeps every subtitle and every
 * section metric honest under a filter.
 */
function pruneToComments(
  sections: readonly SectionResult[],
  byQuestion: ReadonlyMap<string, readonly OpenComment[]>
): readonly SectionResult[] {
  const pruned: SectionResult[] = [];

  for (const section of sections) {
    const questions = section.questions.filter((question) => byQuestion.has(question.id));
    const children = pruneToComments(section.children, byQuestion);
    if (questions.length === 0 && children.length === 0) continue;
    pruned.push({ ...section, questions, children });
  }

  return pruned;
}

/**
 * The ids the tree starts open on: the first root, then the first child at each
 * level below it — the same path `ResultsSectionTree` expands by default.
 */
function defaultOpenBranch(sections: readonly SectionResult[]): ReadonlySet<string> {
  const ids = new Set<string>();
  let current = sections[0];
  while (current) {
    ids.add(current.id);
    current = current.children[0];
  }
  return ids;
}

const collectSectionComments = (
  section: SectionResult,
  byQuestion: ReadonlyMap<string, readonly OpenComment[]>
): readonly OpenComment[] => [
  ...section.questions.flatMap((question) => byQuestion.get(question.id) ?? []),
  ...section.children.flatMap((child) => collectSectionComments(child, byQuestion)),
];

const countSectionComments = (
  section: SectionResult,
  byQuestion: ReadonlyMap<string, readonly OpenComment[]>
): number => collectSectionComments(section, byQuestion).length;

const countCommentQuestions = (
  section: SectionResult,
  byQuestion: ReadonlyMap<string, readonly OpenComment[]>
): number =>
  section.questions.filter((question) => byQuestion.has(question.id)).length +
  section.children.reduce((sum, child) => sum + countCommentQuestions(child, byQuestion), 0);

/* ------------------------------------------------------------- header metric */

/**
 * A branch's comment total, with its sentiment split behind "Detalles".
 *
 * The slot the other tabs use for a score: Favorabilidad puts a percentage
 * here with its four shares one toggle away, so comments put their count here
 * with the three sentiments one toggle away. Same control, same place — a bar
 * drawn on every header would have been a fourth way of reading the same tree.
 */
function SectionCommentMetric({
  comments,
  overrides,
}: {
  comments: readonly OpenComment[];
  overrides: ReadonlyMap<string, Sentiment>;
}) {
  const groups = React.useMemo(() => sentimentGroups(comments, overrides), [comments, overrides]);
  if (groups.total === 0) return null;

  return (
    <SentimentWithBreakdown groups={groups}>
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-text-primary">
        {formatCount(groups.total)}
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          coment.
        </span>
      </span>
    </SentimentWithBreakdown>
  );
}

/* ----------------------------------------------------------------- questions */

/**
 * A section's open questions, in the same table the Secciones view uses.
 *
 * Same header row, same numbering column, same chevron that opens a detail row
 * underneath — what changes is what the detail row holds: the written answers
 * rather than a tally of options.
 */
function CommentedQuestionTable({
  section,
  byQuestion,
  overrides,
  hideCounts,
  autoOpenQuestionId,
  openByDefault,
  onOverride,
  onResetOverride,
}: {
  section: SectionResult;
  byQuestion: ReadonlyMap<string, readonly OpenComment[]>;
  overrides: ReadonlyMap<string, Sentiment>;
  hideCounts: boolean;
  autoOpenQuestionId: string | null;
  openByDefault: boolean;
  onOverride: (commentId: string, sentiment: Sentiment) => void;
  onResetOverride: (commentId: string) => void;
}) {
  return (
    <table className="w-full border-collapse text-left">
      <thead className="bg-muted/30">
        <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          <th className="w-10 px-4 py-2.5 text-center">#</th>
          <th className="py-2.5">Pregunta abierta</th>
          {/* One column per sentiment, the same shape Favorabilidad gives its
              four groups — a share per column, the count in the tooltip. */}
          <th className="hidden py-2.5 xl:table-cell">
            <SentimentBreakdownHeaders className="justify-end pr-6" />
          </th>
          <th className="w-[120px] py-2.5 text-right">Comentarios</th>
          <th className="w-10 py-2.5 pr-4" aria-label="Detalle" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border/25">
        {section.questions.map((question, index) => (
          <QuestionCommentRows
            key={question.id}
            index={index + 1}
            statement={question.statement}
            comments={byQuestion.get(question.id) ?? []}
            overrides={overrides}
            hideCounts={hideCounts}
            defaultOpen={openByDefault || question.id === autoOpenQuestionId}
            onOverride={onOverride}
            onResetOverride={onResetOverride}
          />
        ))}
      </tbody>
    </table>
  );
}

/** One open question: its summary row, and its comments when it is open. */
function QuestionCommentRows({
  index,
  statement,
  comments,
  overrides,
  hideCounts,
  defaultOpen,
  onOverride,
  onResetOverride,
}: {
  index: number;
  statement: string;
  comments: readonly OpenComment[];
  overrides: ReadonlyMap<string, Sentiment>;
  hideCounts: boolean;
  defaultOpen: boolean;
  onOverride: (commentId: string, sentiment: Sentiment) => void;
  onResetOverride: (commentId: string) => void;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [limit, setLimit] = React.useState(PAGE_SIZE);
  const groups = React.useMemo(() => sentimentGroups(comments, overrides), [comments, overrides]);

  const toggle = () => setOpen((current) => !current);

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
        className={cn(
          "group cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
          open && "bg-primary/[0.03]"
        )}
      >
        <td className="px-4 py-3 text-center text-[11px] font-extrabold tabular-nums text-muted-foreground">
          {index}
        </td>

        <td className="py-3 pr-4 text-[13px] font-semibold leading-snug text-text-primary">
          {statement || "Pregunta abierta"}
          {/* Below the fold the three columns are gone, so the split follows
              the statement in its compact form instead of disappearing. */}
          {!hideCounts && (
            <span className="mt-1.5 flex xl:hidden">
              <SentimentBreakdownDots groups={groups} compact />
            </span>
          )}
        </td>

        <td className="hidden py-3 xl:table-cell">
          {hideCounts ? (
            <span className="flex justify-end pr-6">
              <HiddenValue />
            </span>
          ) : (
            <SentimentBreakdownDots groups={groups} className="justify-end pr-6" />
          )}
        </td>

        <td className="py-3 pr-4 text-right">
          {hideCounts ? (
            <HiddenValue />
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <MessageSquareQuote className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
              <span className="text-[13px] font-bold tabular-nums text-text-primary">
                {formatCount(comments.length)}
              </span>
            </span>
          )}
        </td>

        <td className="py-3 pr-4 text-right">
          <ChevronRight
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:text-text-primary",
              open && "rotate-90"
            )}
            strokeWidth={2}
          />
        </td>
      </tr>

      {open && (
        <tr className="bg-muted/30">
          <td colSpan={5} className="px-4 py-4">
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Hairlines only, no box: the list already sits inside the open
                  question, inside the section card — a third outline around it
                  read as a container by mistake rather than as one column of
                  text to go down. */}
              <ul className="divide-y divide-border/40">
                {comments.slice(0, limit).map((comment) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    sentiment={effectiveSentiment(comment, overrides)}
                    corrected={overrides.has(comment.id)}
                    onOverride={(next) => onOverride(comment.id, next)}
                    onReset={() => onResetOverride(comment.id)}
                  />
                ))}
              </ul>
              {comments.length > limit && (
                <button
                  type="button"
                  onClick={() => setLimit((current) => current + PAGE_SIZE * 2)}
                  className="mr-auto rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-[12px] font-semibold text-text-secondary transition-colors hover:bg-muted/40"
                >
                  Ver {formatCount(comments.length - limit)} comentarios más
                </button>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ comments */

/**
 * One written answer.
 *
 * The section and the question are already three rows above it, so the row
 * carries only what is its own: the text, who wrote it, and the label — plus
 * the model's confidence when it is low enough to be worth a second look.
 */
function CommentRow({
  comment,
  sentiment,
  corrected,
  onOverride,
  onReset,
}: {
  comment: OpenComment;
  sentiment: Sentiment;
  corrected: boolean;
  onOverride: (next: Sentiment) => void;
  onReset: () => void;
}) {
  const low = comment.aiConfidence < AI_CONFIDENCE_FLOOR && !corrected;

  return (
    <li
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-6 gap-y-2 px-1 py-3 transition-colors",
        // The row sits on the section's muted ground, so hover lifts to the
        // surface instead of darkening further.
        "hover:bg-surface",
        low && "bg-status-warning/[0.05]"
      )}
    >
      <div className="flex min-w-[280px] flex-1 flex-col gap-1.5">
        {/* The quote at reading weight, not display weight: the row is text to
            be read, and there are twenty more under it. */}
        <p className="text-[13px] leading-relaxed text-text-primary">“{comment.text}”</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            {comment.anonymous && <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2} />}
            <span className="font-medium text-text-secondary">{comment.respondentName}</span>
          </span>
          {/* No área next to the quote on an anonymous survey: a written answer
              plus a department is often enough to guess who wrote it. */}
          {comment.area && <span>{comment.area}</span>}
          <span>{comment.submittedLabel}</span>
          <span className="rounded-full bg-muted/60 px-1.5 py-px font-medium text-text-secondary">
            {comment.topic}
          </span>
          {low && <ConfidenceMeter value={comment.aiConfidence} low />}
          {corrected && (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2} />
              La IA leyó “{SENTIMENT_STYLES[comment.aiSentiment].label}”
            </span>
          )}
        </p>
      </div>

      <SentimentSegmentedControl
        value={sentiment}
        aiValue={comment.aiSentiment}
        corrected={corrected}
        onChange={onOverride}
        onReset={onReset}
      />
    </li>
  );
}
