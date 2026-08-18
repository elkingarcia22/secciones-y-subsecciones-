import { cn } from "@/lib/utils";
import { supportsFollowUps, type SurveyQuestion } from "@/components/survey-builder";
import { PreviewAnswerField, type PreviewAnswer } from "./PreviewAnswerField";

/**
 * One question as the respondent meets it: its position, its wording, whether
 * it is required, and the control to answer it.
 *
 * The number is the anchor — it is what someone refers to when they say "me
 * quedé en la 4" — so it is the only thing that keeps a fixed slot on the left
 * while the statement takes whatever width it needs.
 */

interface PreviewQuestionCardProps {
  question: SurveyQuestion;
  /** 1-based position inside its page. */
  index: number;
  value: PreviewAnswer;
  onChange: (value: PreviewAnswer) => void;
  followUp: string;
  onFollowUpChange: (value: string) => void;
}

/**
 * Which follow-up wording a rating earns. NPS bands are the product's own
 * (0-6 / 7-8 / 9-10); the 5-step scales split the same three ways, so a single
 * set of three messages covers every scale that supports follow-ups.
 */
function followUpPrompt(question: SurveyQuestion, value: PreviewAnswer): string | null {
  const { kind, followUpEnabled, followUps } = question.scale;
  if (!followUpEnabled || !supportsFollowUps(kind)) return null;
  if (typeof value !== "string" || value === "") return null;

  const score = Number(value);
  if (Number.isNaN(score)) return null;

  const band =
    kind === "nps"
      ? score <= 6
        ? "detractors"
        : score <= 8
          ? "neutrals"
          : "promoters"
      : score <= 2
        ? "detractors"
        : score === 3
          ? "neutrals"
          : "promoters";

  return followUps[band].trim() || "Cuéntanos por qué elegiste esta respuesta";
}

export function PreviewQuestionCard({
  question,
  index,
  value,
  onChange,
  followUp,
  onFollowUpChange,
}: PreviewQuestionCardProps) {
  const prompt = followUpPrompt(question, value);
  const isAnswered = Array.isArray(value) ? value.length > 0 : Boolean(value);

  return (
    <article
      className={cn(
        "group relative rounded-2xl border bg-surface p-5 shadow-card transition-colors duration-200 sm:p-6",
        isAnswered ? "border-primary/30" : "border-border/50"
      )}
    >
      {/* Answered rail: a quiet mark down the left edge, so scanning a long
          page shows what is still pending without a badge on every card. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-5 left-0 w-[3px] rounded-full transition-colors duration-200",
          isAnswered ? "bg-primary" : "bg-transparent"
        )}
      />

      <header className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            "mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold tabular-nums transition-colors",
            isAnswered ? "bg-primary text-white" : "bg-surface-muted text-text-secondary"
          )}
        >
          {index}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-text-primary">
            {question.statement.trim() || (
              <span className="italic text-text-muted">Pregunta sin enunciado</span>
            )}
          </h3>
          {/* Most questions are required, so the quiet exception is what is
              worth naming — a badge on every card would be noise. */}
          {!question.required && (
            <p className="mt-1 text-[11.5px] font-medium text-text-muted">Opcional</p>
          )}
        </div>
      </header>

      <PreviewAnswerField question={question} value={value} onChange={onChange} />

      {prompt && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <label className="flex flex-col gap-2">
            <span className="text-[12.5px] font-semibold text-text-primary">{prompt}</span>
            <textarea
              value={followUp}
              onChange={(event) => onFollowUpChange(event.target.value)}
              rows={3}
              placeholder="Escribe tu respuesta"
              className="w-full resize-y rounded-lg border border-border/70 bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
        </div>
      )}
    </article>
  );
}
