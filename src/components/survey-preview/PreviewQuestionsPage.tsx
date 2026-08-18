import * as React from "react";
import { ChevronRight, Clock3, ListChecks, UsersRound } from "lucide-react";
import { MINUTES_PER_QUESTION, depthLabel, type SurveyQuestion } from "@/components/survey-builder";
import { PreviewQuestionCard } from "./PreviewQuestionCard";
import { PreviewScaleMatrix } from "./PreviewScaleMatrix";
import type { PreviewAnswer } from "./PreviewAnswerField";
import { groupQuestionBlocks, toPreviewQuestion, type PreviewPage } from "./previewModel";

/**
 * A page of questions — a section, a subsection, or the demographics block.
 *
 * It opens the same way the welcome page does: a cover card that says what this
 * part of the survey is, where it sits in the whole, and what it will take.
 * Underneath, the questions, grouped so that a battery of statements on one
 * scale reads as a single table instead of a stack of identical cards.
 */

interface PreviewQuestionsPageProps {
  page: Extract<PreviewPage, { kind: "section" | "demographics" }>;
  answers: Readonly<Record<string, PreviewAnswer>>;
  followUps: Readonly<Record<string, string>>;
  onAnswer: (questionId: string, value: PreviewAnswer) => void;
  onFollowUp: (questionId: string, value: string) => void;
}

export function PreviewQuestionsPage({
  page,
  answers,
  followUps,
  onAnswer,
  onFollowUp,
}: PreviewQuestionsPageProps) {
  const questions: readonly SurveyQuestion[] = React.useMemo(
    () => (page.kind === "section" ? page.questions : page.fields.map(toPreviewQuestion)),
    [page]
  );

  const blocks = React.useMemo(() => groupQuestionBlocks(questions), [questions]);
  const minutes = Math.max(1, Math.round(questions.length * MINUTES_PER_QUESTION));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-8 sm:px-8">
      {/* Cover. Same card language as the welcome page: the accent rule marks
          "this is the page talking", not a question. */}
      <header className="relative overflow-hidden rounded-2xl border border-border/50 bg-surface p-6 shadow-md sm:p-7">
        {/* Subtle top accent to mark it as a header without being intrusive */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
        {/* Very faint background gradient to give it slight depth compared to questions */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent pointer-events-none" />

        {page.kind === "section" ? (
          <SectionTrail page={page} />
        ) : (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
            <UsersRound className="h-3.5 w-3.5" strokeWidth={2.4} />
            Sobre ti
          </span>
        )}

        <h1 className="mt-3 text-[26px] font-bold leading-[1.15] tracking-tight text-text-primary">
          {page.title}
        </h1>

        {page.description.trim() && (
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-text-secondary">
            {page.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Meta icon={ListChecks} label={`${questions.length} ${questions.length === 1 ? "pregunta" : "preguntas"}`} />
          <Meta icon={Clock3} label={`${minutes} min aprox.`} />
        </div>
      </header>

      {blocks.map((block) =>
        block.kind === "matrix" ? (
          <PreviewScaleMatrix
            key={block.id}
            steps={block.steps}
            questions={block.questions}
            startIndex={block.startIndex}
            answers={answers}
            onAnswer={onAnswer}
          />
        ) : (
          <PreviewQuestionCard
            key={block.id}
            question={block.question}
            index={block.index}
            value={answers[block.question.id] ?? null}
            onChange={(value) => onAnswer(block.question.id, value)}
            followUp={followUps[block.question.id] ?? ""}
            onFollowUpChange={(value) => onFollowUp(block.question.id, value)}
          />
        )
      )}
    </div>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof ListChecks; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary">
      <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      {label}
    </span>
  );
}

/**
 * The full path down to this page. Ancestors stay legible but recede, so the
 * eye lands on the level being answered while the block it belongs to is still
 * readable right above the title.
 */
function SectionTrail({ page }: { page: Extract<PreviewPage, { kind: "section" }> }) {
  return (
    <nav aria-label="Ubicación en la encuesta" className="flex flex-wrap items-center gap-1.5">
      {page.trail.map((crumb) => (
        <span key={crumb.numbering} className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-text-secondary">
            <span className="tabular-nums text-text-muted">{crumb.numbering}.</span> {crumb.title}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-text-muted/70" strokeWidth={2.4} />
        </span>
      ))}

      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
        {depthLabel(page.depth)} {page.numbering}
      </span>
    </nav>
  );
}
