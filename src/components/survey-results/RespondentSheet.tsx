import * as React from "react";
import { CalendarDays, CheckCircle2, Clock, Gauge, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  OpenComment,
  QuestionBreakdown,
  Respondent,
  RespondentAnswer,
  Sentiment,
} from "@/mocks/questionResponses";
import { effectiveSentiment } from "@/mocks/questionResponses";
import type { SectionResult } from "@/mocks/surveyResults";
import { RespondentAnswerCell } from "./RespondentAnswerCell";
import { ResultsSectionTree } from "./ResultsSectionTree";
import { countSectionQuestions } from "./sectionTotals";
import { bandForScore, formatScore, tierForScore } from "./favorabilityScale";
import { cn } from "@/lib/utils";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

interface RespondentSheetProps {
  respondent: Respondent;
  sections: readonly SectionResult[];
  answers: ReadonlyMap<string, RespondentAnswer>;
  breakdowns: ReadonlyMap<string, QuestionBreakdown>;
  comments: readonly OpenComment[];
  sentimentOverrides: ReadonlyMap<string, Sentiment>;
  highlightBands?: ReadonlySet<string>;
  hasHiddenBands?: boolean;
}

/**
 * Everything one person answered, in the order they answered it.
 *
 * The survey's own outline, question by question, with each answer on the right
 * — so the sheet reads like the form they filled in rather than like a data
 * dump. Sections stay open by default: this is a document to scroll, not a tree
 * to explore.
 */
export function RespondentSheet({
  respondent,
  sections,
  answers,
  breakdowns,
  comments,
  sentimentOverrides,
  highlightBands,
  hasHiddenBands,
}: RespondentSheetProps) {
  const sentimentByQuestion = React.useMemo(() => {
    const map = new Map<string, Sentiment>();
    for (const comment of comments) {
      if (comment.respondentId !== respondent.id) continue;
      map.set(comment.questionId, effectiveSentiment(comment, sentimentOverrides));
    }
    return map;
  }, [comments, respondent.id, sentimentOverrides]);

  const answeredCount = React.useMemo(
    () => [...answers.values()].filter((answer) => !answer.skipped).length,
    [answers]
  );

  const renderQuestions = React.useCallback(
    (section: SectionResult) => (
      <ul className="flex flex-col divide-y divide-border/40">
        {section.questions.map((question, index) => {
          const answer = answers.get(question.id);
          let isDimmed = false;
          if (hasHiddenBands && highlightBands && answer && !answer.skipped) {
            if (answer.nsnr) {
              isDimmed = !highlightBands.has("nsnr");
            } else if (typeof answer.value === "number") {
              const tierId = tierForScore(answer.value).id;
              isDimmed = !highlightBands.has(tierId);
            } else if (answer.type === "open") {
              const sent = sentimentByQuestion.get(question.id);
              if (sent === "positive") isDimmed = !highlightBands.has("favorable");
              else if (sent === "warning") isDimmed = !highlightBands.has("neutral");
              else if (sent === "negative") isDimmed = !highlightBands.has("unfavorable");
            }
          }

          return (
            <li
              key={question.id}
              className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6 transition-all duration-300"
              style={{
                opacity: isDimmed ? 0.3 : 1,
                filter: isDimmed ? "grayscale(100%)" : "none",
              }}
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted/60 text-[10px] font-extrabold tabular-nums text-muted-foreground"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-snug text-text-primary">
                    {question.statement || "Pregunta sin enunciado"}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                    {breakdowns.get(question.id)?.formatLabel ?? "Escala"}
                  </p>
                </div>
              </div>

              <div className="flex justify-start sm:max-w-[380px] sm:justify-end">
                <RespondentAnswerCell
                  answer={answer}
                  breakdown={breakdowns.get(question.id)}
                  sentiment={sentimentByQuestion.get(question.id)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    ),
    [answers, breakdowns, sentimentByQuestion, highlightBands, hasHiddenBands]
  );

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <SheetHeader respondent={respondent} answeredCount={answeredCount} />
      <ResultsSectionTree
        sections={sections}
        renderQuestions={renderQuestions}
        renderSubtitle={(section) => <>{countSectionQuestions(section)} preguntas</>}
        expandAll
      />
    </div>
  );
}

function SheetHeader({
  respondent,
  answeredCount,
}: {
  respondent: Respondent;
  answeredCount: number;
}) {
  const band = respondent.score !== null ? bandForScore(respondent.score) : null;
  const traits = [respondent.area, respondent.country, respondent.age, respondent.gender].filter(
    (value): value is string => Boolean(value)
  );
  const identityLine =
    respondent.email ??
    "Identidad y datos demográficos protegidos por el anonimato de la encuesta";

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <span
        aria-hidden
        className={
          respondent.anonymous
            ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-extrabold text-primary"
        }
      >
        {respondent.anonymous ? (
          <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2} />
        ) : (
          respondent.initials
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-[14px] font-bold tracking-tight text-text-primary">
            {respondent.name}
          </h3>
          {/* Only what the survey's own privacy setting allows: on an anonymous
              survey every demographic is null, so these render empty. */}
          {traits.map((value) => (
            <Badge key={value} variant="neutral" className="text-[11px]">
              {value}
            </Badge>
          ))}
          {respondent.leader && (
            <Badge variant="neutral" className="text-[11px]">
              Líder: {respondent.leader}
            </Badge>
          )}
        </div>
        {/* Truncated rather than wrapped: the line is a privacy note, and letting
            it reflow to two lines gives back the height this header just saved. */}
        <p
          className="mt-0.5 truncate text-[12px] font-medium text-muted-foreground"
          title={identityLine}
        >
          {identityLine}
        </p>

        {/* One inline strip rather than a bordered grid below: three short facts
            do not need a third of the card's height to be read. */}
        <dl className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <SheetFact
            icon={respondent.status === "complete" ? CheckCircle2 : Clock}
            label="Estado"
            value={respondent.status === "complete" ? "Completada" : "Parcial"}
          />
          <FactDivider />
          <SheetFact icon={Gauge} label="Respondidas" value={formatCount(answeredCount)} />
          <FactDivider />
          <SheetFact icon={CalendarDays} label="Enviada" value={respondent.submittedLabel} />
        </dl>
      </div>

      {band && respondent.score !== null && (
        <div
          className="flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-2"
          /* The band name carries the reading, so no "Su promedio" caption above
             it; the tooltip is what still says which number this is. */
          title={`Su promedio: ${formatScore(respondent.score)} de 5 — ${band.label}`}
          style={{
            backgroundColor: band.background,
            borderColor: band.border,
            color: band.foreground,
          }}
        >
          <span className="flex items-baseline gap-0.5">
            <span className="text-[24px] font-extrabold leading-none tabular-nums">
              {formatScore(respondent.score)}
            </span>
            <span className="text-[11px] font-bold leading-none opacity-60">/5</span>
          </span>
          <span
            className="border-l pl-3 text-[12px] font-bold leading-none"
            style={{ borderColor: band.border }}
          >
            {band.label}
          </span>
        </div>
      )}
    </header>
  );
}

/** Hairline between two inline facts — a divider, not a character. */
function FactDivider() {
  return <span aria-hidden className="h-3 w-px shrink-0 bg-border/70" />;
}

function SheetFact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={2} />
        {label}
      </dt>
      <dd className="text-[12px] font-bold tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}
