import * as React from "react";
import { motion } from "framer-motion";
import {
  AlignLeft,
  ChevronDown,
  ChevronRight,
  Gauge,
  ListChecks,
  ListOrdered,
  MessageSquareQuote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { QuestionType } from "@/components/survey-builder";
import type { QuestionBreakdown } from "@/mocks/questionResponses";
import type { QuestionResult, SectionResult } from "@/mocks/surveyResults";
import { AnswerTallyList } from "./AnswerTallyList";
import { ResultsSectionTree } from "./ResultsSectionTree";
import { ResultsSortHeader } from "./ResultsSortHeader";
import { countSectionAnswers, countSectionQuestions } from "./sectionTotals";
import type { ResultLevel } from "./resultLevels";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/** Icon per question format, the same ones the builder's catalog uses. */
const TYPE_ICONS: Readonly<Record<QuestionType, typeof ListOrdered>> = {
  scale: ListOrdered,
  open: AlignLeft,
  single: ListChecks,
  multiple: ListChecks,
  dropdown: ChevronDown,
};

interface QuestionBreakdownViewProps {
  sections: readonly SectionResult[];
  breakdowns: ReadonlyMap<string, QuestionBreakdown>;
  visibleLevels: ReadonlySet<ResultLevel>;
  /** Opens the roster filtered to whoever gave that answer. */
  onDrillDown: (questionId: string, tallyId: string) => void;
  /** Jumps to Comentarios, narrowed to one open question. */
  onOpenComments: (questionId: string) => void;
}

/**
 * Every question with its answers counted out, option by option.
 *
 * This view counts; it does not score. Favorabilidad already owns the verdict —
 * the percentage, the bands, the stacked shape — and repeating it here gave the
 * reader two places to read the same judgement and a scale that meant nothing
 * for the half of the survey that isn't Likert. So the columns here are the
 * ones a counting question needs: what format the question is, how many people
 * answered it, how many opted out. The verdict lives one tab away.
 *
 * Structurally it borrows Favorabilidad's own section table — the same accordion
 * of sections, the same column headers, the same sortable headings — so the two
 * tabs read as one report. A row opens into its tally, where each option carries
 * its count, its share and a tooltip, and clicking one opens the people behind
 * it.
 */
export function QuestionBreakdownView({
  sections,
  breakdowns,
  visibleLevels,
  onDrillDown,
  onOpenComments,
}: QuestionBreakdownViewProps) {
  const renderQuestions = React.useCallback(
    (section: SectionResult, revealDelay: number) => (
      <QuestionTable
        questions={section.questions}
        breakdowns={breakdowns}
        hideCounts={!visibleLevels.has("question")}
        onDrillDown={onDrillDown}
        onOpenComments={onOpenComments}
        revealDelay={revealDelay}
      />
    ),
    [breakdowns, visibleLevels, onDrillDown, onOpenComments]
  );

  const renderMetric = React.useCallback(
    (section: SectionResult) => {
      const level: ResultLevel =
        section.depth === 1 ? "section" : section.depth === 2 ? "subsection2" : "subsection3";
      if (!visibleLevels.has(level)) return <HiddenValue />;

      // What a section is worth in this tab is how much it was answered — not
      // how well. One number, with its make-up in the tooltip.
      const answers = countSectionAnswers(section);
      const questions = countSectionQuestions(section);
      return <AnswerCountBadge answers={answers} questions={questions} />;
    },
    [visibleLevels]
  );

  return (
    <ResultsSectionTree
      sections={sections}
      renderQuestions={renderQuestions}
      renderMetric={renderMetric}
      renderSubtitle={(section) => (
        <>
          {countSectionQuestions(section)} preguntas ·{" "}
          {formatCount(countSectionAnswers(section))} respuestas
        </>
      )}
    />
  );
}

/** A muted dash where a level's number would be, same as the other tabs. */
function HiddenValue() {
  return (
    <span
      className="inline-flex h-5 items-center px-1.5 text-[12px] font-medium leading-none text-muted-foreground/40"
      title="Total oculto: este nivel está desmarcado en Niveles"
    >
      —
    </span>
  );
}

/** A section's answer total, with what it is built from in the tooltip. */
function AnswerCountBadge({ answers, questions }: { answers: number; questions: number }) {
  const perQuestion = questions > 0 ? Math.round(answers / questions) : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-text-primary">
          {formatCount(answers)}
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            resp.
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="z-[100] px-2.5 py-1 text-[11px] font-medium">
        {formatCount(answers)} respuestas en {questions} preguntas · {formatCount(perQuestion)} por
        pregunta en promedio
      </TooltipContent>
    </Tooltip>
  );
}

type SortKey = "label" | "answers";

/**
 * A section's questions as a flat table: headers, columns, and a row that
 * opens into its own tally. No box of its own — it already sits inside the
 * section card, and a container inside a container reads as a mistake.
 */
function QuestionTable({
  questions,
  breakdowns,
  hideCounts,
  onDrillDown,
  onOpenComments,
  revealDelay = 0,
}: {
  questions: readonly QuestionResult[];
  breakdowns: ReadonlyMap<string, QuestionBreakdown>;
  hideCounts: boolean;
  onDrillDown: (questionId: string, tallyId: string) => void;
  onOpenComments: (questionId: string) => void;
  /** Delay before this table's rows start cascading in — set by the section
   * tree so questions only start once the row above them has settled. */
  revealDelay?: number;
}) {
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
  const [ascending, setAscending] = React.useState(true);

  const sorted = React.useMemo(() => {
    if (!sortKey) return questions;
    const direction = ascending ? 1 : -1;
    return [...questions].sort((a, b) => {
      if (sortKey === "label") return a.statement.localeCompare(b.statement) * direction;
      return (a.n + a.nsnr - (b.n + b.nsnr)) * direction;
    });
  }, [questions, sortKey, ascending]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAscending((current) => !current);
    else {
      setSortKey(key);
      setAscending(true);
    }
  };

  return (
    <table className="w-full border-collapse text-left">
      <thead className="bg-muted/30">
        <tr className="border-b border-border/60 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
          <th className="w-10 px-4 py-2.5 text-center">#</th>
          <th className="py-2.5">
            <ResultsSortHeader
              label="Pregunta"
              sortKey="label"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
            />
          </th>
          <th className="hidden w-[190px] py-2.5 lg:table-cell">Formato</th>
          <th className="hidden w-[80px] py-2.5 text-right xl:table-cell">NS/NR</th>
          <th className="w-[120px] py-2.5 text-right">
            <ResultsSortHeader
              label="Respuestas"
              sortKey="answers"
              activeKey={sortKey}
              ascending={ascending}
              onSort={toggleSort}
              className="justify-end"
            />
          </th>
          <th className="w-10 py-2.5 pr-4" aria-label="Detalle" />
        </tr>
      </thead>
      <motion.tbody
        className="divide-y divide-border/25"
        initial="hidden"
        animate="show"
        custom={revealDelay}
        variants={cascadeContainer}
      >
        {sorted.map((question, index) => (
          <QuestionRows
            key={question.id}
            index={index + 1}
            question={question}
            breakdown={breakdowns.get(question.id)}
            hideCounts={hideCounts}
            onDrillDown={onDrillDown}
            onOpenComments={onOpenComments}
          />
        ))}
      </motion.tbody>
    </table>
  );
}

/** One question: its summary row, plus the detail row when it is open. */
function QuestionRows({
  index,
  question,
  breakdown,
  hideCounts,
  onDrillDown,
  onOpenComments,
}: {
  index: number;
  question: QuestionResult;
  breakdown: QuestionBreakdown | undefined;
  hideCounts: boolean;
  onDrillDown: (questionId: string, tallyId: string) => void;
  onOpenComments: (questionId: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const Icon = TYPE_ICONS[breakdown?.type ?? "scale"];
  const isNps = breakdown?.scaleKind === "nps";
  const isOpenText = breakdown?.type === "open";
  const total = question.n + question.nsnr;

  const toggle = () => setOpen((current) => !current);

  return (
    <>
      <motion.tr
        variants={cascadeItem}
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
          {question.statement || "Pregunta sin enunciado"}
          {/* The format follows the statement below the fold, where the column
              is gone — it is what the row means, not decoration. */}
          <span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground lg:hidden">
            <Icon className="h-3 w-3" strokeWidth={2} />
            {breakdown?.formatLabel ?? "Escala"}
          </span>
        </td>

        <td className="hidden py-3 pr-4 lg:table-cell">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
            <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="truncate">{breakdown?.formatLabel ?? "Escala"}</span>
          </span>
        </td>

        <td className="hidden py-3 pr-4 text-right text-[12px] font-medium tabular-nums text-muted-foreground xl:table-cell">
          {hideCounts ? <HiddenValue /> : question.nsnr > 0 ? formatCount(question.nsnr) : "—"}
        </td>

        <td className="py-3 pr-4 text-right">
          {hideCounts ? (
            <HiddenValue />
          ) : isOpenText ? (
            <WrittenAnswersBadge count={breakdown?.commentCount ?? 0} />
          ) : (
            <AnswerTotal
              answered={question.n}
              nsnr={question.nsnr}
              total={total}
              isNps={isNps}
            />
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
      </motion.tr>

      {open && (
        <tr className="bg-muted/30">
          <td colSpan={6} className="px-4 py-4">
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              {isOpenText ? (
                <OpenQuestionPanel
                  count={breakdown?.commentCount ?? 0}
                  onOpenComments={() => onOpenComments(question.id)}
                />
              ) : breakdown && breakdown.tallies.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Respuestas por opción
                  </p>
                  <AnswerTallyList
                    breakdown={breakdown}
                    dense={isNps}
                    onDrillDown={(tallyId) => onDrillDown(question.id, tallyId)}
                  />
                  {breakdown.multiSelect && (
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Pregunta de múltiples respuestas: los porcentajes son sobre personas, así que
                      suman más de 100%.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[12px] font-medium text-muted-foreground">
                  Esta pregunta no registró respuestas.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * How many people answered a question, with the make-up behind the number.
 *
 * A bare total hides the one thing that changes how it should be read — whether
 * the people counted actually picked something or opted out — so the split
 * lives in the tooltip rather than in a second column nobody lines up.
 */
function AnswerTotal({
  answered,
  nsnr,
  total,
  isNps,
}: {
  answered: number;
  nsnr: number;
  total: number;
  isNps?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default items-center gap-1.5">
          {isNps && (
            <Badge variant="info" className="gap-1 whitespace-nowrap px-1.5 text-[10px]">
              <Gauge className="h-2.5 w-2.5" strokeWidth={2} />
              NPS
            </Badge>
          )}
          <span className="text-[13px] font-bold tabular-nums text-text-primary">
            {formatCount(total)}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="z-[100] px-2.5 py-1 text-[11px] font-medium">
        {formatCount(answered)} eligieron una opción
        {nsnr > 0 ? ` · ${formatCount(nsnr)} No sabe / No responde` : " · sin NS/NR"}
      </TooltipContent>
    </Tooltip>
  );
}

/** An open question is counted in what people wrote, not in options picked. */
function WrittenAnswersBadge({ count }: { count: number }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-default items-center gap-1.5">
          <MessageSquareQuote className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
          <span className="text-[13px] font-bold tabular-nums text-text-primary">
            {formatCount(count)}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="z-[100] px-2.5 py-1 text-[11px] font-medium">
        {formatCount(count)} personas escribieron una respuesta
      </TooltipContent>
    </Tooltip>
  );
}

/** An open question has no options to tally — it has what people wrote. */
function OpenQuestionPanel({
  count,
  onOpenComments,
}: {
  count: number;
  onOpenComments: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface px-4 py-3">
      <p className="text-[12px] font-medium leading-relaxed text-text-secondary">
        {formatCount(count)} personas escribieron una respuesta. El sentimiento de cada una lo
        detecta la IA y se puede corregir.
      </p>
      <button
        type="button"
        onClick={onOpenComments}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/30 bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <MessageSquareQuote className="h-3.5 w-3.5" strokeWidth={2} />
        Ver comentarios
      </button>
    </div>
  );
}
