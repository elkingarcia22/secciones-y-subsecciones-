import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@/components/survey-builder";
import type { PreviewAnswer } from "./PreviewAnswerField";

/**
 * A run of statements sharing one rating scale, drawn as a matrix.
 *
 * The scale is written once across the top and every statement is a row, so the
 * page shows the whole battery at a glance and the statements can be compared
 * against each other — which is the point of asking them together. Repeating
 * five buttons under five statements says the same thing five times as long.
 *
 * It keeps a table's structure without being a `<table>`: a grid gives the
 * columns a shared width while letting a row stay a single clickable band.
 */

interface PreviewScaleMatrixProps {
  steps: readonly string[];
  questions: readonly SurveyQuestion[];
  /** Position of the first row in the page, 1-based. */
  startIndex: number;
  answers: Readonly<Record<string, PreviewAnswer>>;
  onAnswer: (questionId: string, value: PreviewAnswer) => void;
}

export function PreviewScaleMatrix({
  steps,
  questions,
  startIndex,
  answers,
  onAnswer,
}: PreviewScaleMatrixProps) {
  // Shared track: the header and every row line up because they are laid out
  // from the same template.
  const columns = {
    gridTemplateColumns: `minmax(220px, 1fr) repeat(${steps.length}, minmax(88px, 116px))`,
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div
            style={columns}
            className="grid items-end gap-x-1 border-b border-border/60 bg-surface-muted px-5 py-3"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">
              Enunciado
            </span>
            {steps.map((step) => (
              <span
                key={step}
                className="px-1 text-center text-[12px] font-semibold leading-tight text-text-secondary"
              >
                {step}
              </span>
            ))}
          </div>

          {questions.map((question, index) => {
            const value = answers[question.id];
            const selected = typeof value === "string" ? value : "";

            return (
              <div
                key={question.id}
                style={columns}
                className={cn(
                  "group/row grid items-center gap-x-1 px-5 py-3.5 transition-colors",
                  index > 0 && "border-t border-border/60",
                  selected ? "bg-primary/[0.035]" : "hover:bg-surface-muted"
                )}
              >
                <div className="flex min-w-0 items-start gap-2.5 pr-6">
                  <span
                    className={cn(
                      "mt-px shrink-0 text-[11px] font-bold tabular-nums transition-colors",
                      selected ? "text-primary" : "text-text-muted"
                    )}
                  >
                    {startIndex + index}
                  </span>
                  <p className="min-w-0 text-[14px] font-medium leading-snug text-text-primary">
                    {question.statement.trim() || (
                      <span className="italic text-text-muted">Pregunta sin enunciado</span>
                    )}
                    {!question.required && (
                      <span className="ml-1.5 text-[12px] font-normal text-text-muted">
                        (opcional)
                      </span>
                    )}
                  </p>
                </div>

                {steps.map((step) => {
                  const isSelected = selected === step;
                  return (
                    <button
                      key={step}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${question.statement || "Pregunta"}: ${step}`}
                      onClick={() => onAnswer(question.id, isSelected ? null : step)}
                      className="flex h-9 items-center justify-center rounded-lg transition-colors hover:bg-primary/5"
                    >
                      <span
                        className={cn(
                          "flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 transition-all duration-150",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border bg-surface group-hover/row:border-text-muted"
                        )}
                      >
                        {isSelected && <span className="h-[7px] w-[7px] rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
