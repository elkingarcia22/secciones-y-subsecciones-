import { Angry, Check, ChevronDown, Frown, Laugh, Meh, Smile, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMOJI_STEPS,
  LINEAR_STEPS,
  NPS_MAX,
  NPS_MIN,
  STAR_STEPS,
  likertSteps,
  type QuestionOption,
  type QuestionType,
  type SurveyQuestion,
} from "@/components/survey-builder";

/**
 * The controls a respondent actually touches.
 *
 * Unlike the builder's ScalePreview — a static sketch drawn next to a form —
 * these are live: the author can answer their own survey inside the drawer and
 * see how a scale behaves when it is picked, which is most of what a preview is
 * for. Nothing is stored; the drawer throws the answers away when it closes.
 */

export type PreviewAnswer = string | readonly string[] | null;

interface PreviewAnswerFieldProps {
  question: SurveyQuestion;
  value: PreviewAnswer;
  onChange: (value: PreviewAnswer) => void;
}

const EMOJI_FACES = [Angry, Frown, Meh, Smile, Laugh];

const asArray = (value: PreviewAnswer): readonly string[] =>
  Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];

const asText = (value: PreviewAnswer): string => (typeof value === "string" ? value : "");

export function PreviewAnswerField({ question, value, onChange }: PreviewAnswerFieldProps) {
  if (question.type === "open") {
    return (
      <textarea
        value={asText(value)}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="Escribe tu respuesta"
        className="w-full resize-y rounded-lg border border-border/70 bg-surface px-4 py-3 text-[14px] leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted hover:border-border focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    );
  }

  if (question.type === "dropdown") {
    return <DropdownField options={question.options} value={asText(value)} onChange={onChange} />;
  }

  if (question.type === "single" || question.type === "multiple") {
    return (
      <ChoiceField
        type={question.type}
        options={question.options}
        selected={asArray(value)}
        onChange={onChange}
      />
    );
  }

  return <ScaleField question={question} value={value} onChange={onChange} />;
}

/* -------------------------------------------------------------------------- */
/* Choice types                                                               */
/* -------------------------------------------------------------------------- */

function ChoiceField({
  type,
  options,
  selected,
  onChange,
}: {
  type: Extract<QuestionType, "single" | "multiple">;
  options: readonly QuestionOption[];
  selected: readonly string[];
  onChange: (value: PreviewAnswer) => void;
}) {
  if (options.length === 0) return <EmptyOptions />;

  const toggle = (id: string) => {
    if (type === "single") {
      onChange(selected[0] === id ? null : id);
      return;
    }
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  return (
    // Capped: a full-width band for the word "Remoto" reads as a mistake, and
    // a shorter line is faster to scan down a list of options.
    <ul className="flex max-w-2xl flex-col gap-2">
      {options.map((option, index) => {
        const isSelected = selected.includes(option.id);
        return (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={isSelected}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-150",
                isSelected
                  ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary))]"
                  : "border-border/70 bg-surface hover:border-primary/40 hover:bg-primary/[0.03]"
              )}
            >
              <span
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors",
                  type === "single" ? "rounded-full" : "rounded-xs",
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface group-hover:border-primary/50"
                )}
              >
                {isSelected &&
                  (type === "single" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : (
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  ))}
              </span>
              <span className="min-w-0 flex-1 text-[14px] font-medium text-text-primary">
                {option.label.trim() || `Opción ${index + 1}`}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function DropdownField({
  options,
  value,
  onChange,
}: {
  options: readonly QuestionOption[];
  value: string;
  onChange: (value: PreviewAnswer) => void;
}) {
  if (options.length === 0) return <EmptyOptions />;

  return (
    <div className="relative max-w-md">
      <Select value={value} onValueChange={(val) => onChange(val || null)}>
        <SelectTrigger className="w-full appearance-none rounded-xl border border-border/70 bg-surface px-4 py-6 text-[14px] font-medium text-text-primary outline-none transition-colors hover:border-border focus:border-primary focus:ring-4 focus:ring-primary/10">
          <SelectValue placeholder="Buscar o seleccionar…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label.trim() || `Opción ${index + 1}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Scales                                                                     */
/* -------------------------------------------------------------------------- */

function ScaleField({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion;
  value: PreviewAnswer;
  onChange: (value: PreviewAnswer) => void;
}) {
  const { kind, minLabel, maxLabel, allowDontKnow } = question.scale;
  const selected = asText(value);

  if (kind === "likert" || kind === "likert-nom035") {
    const steps = likertSteps(question);
    const options = allowDontKnow ? [...steps, "No sabe / no responde"] : steps;

    return (
      <div className="flex flex-wrap gap-2">
        {options.map((step) => {
          const isSelected = selected === step;
          const isOptOut = step === "No sabe / no responde";
          return (
            <button
              key={step}
              type="button"
              onClick={() => onChange(isSelected ? null : step)}
              aria-pressed={isSelected}
              className={cn(
                "flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-center text-[13px] font-medium leading-tight transition-all duration-150",
                isOptOut && "border-dashed",
                isSelected
                  ? "border-primary bg-primary text-white shadow-card"
                  : "border-border/70 bg-surface text-text-secondary hover:-translate-y-px hover:border-primary/40 hover:text-text-primary"
              )}
            >
              {step}
            </button>
          );
        })}
      </div>
    );
  }

  if (kind === "nps") {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: NPS_MAX - NPS_MIN + 1 }, (_, index) => {
            const step = String(NPS_MIN + index);
            const isSelected = selected === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onChange(isSelected ? null : step)}
                aria-pressed={isSelected}
                className={cn(
                  "h-11 w-11 rounded-xl border text-[13px] font-bold tabular-nums transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary text-white shadow-[0_6px_16px_-8px_hsl(var(--primary)/0.9)]"
                    : "border-border/70 bg-surface text-text-secondary hover:-translate-y-px hover:border-primary/40 hover:text-text-primary"
                )}
              >
                {step}
              </button>
            );
          })}
        </div>
        <EndLabels min={minLabel || "Nada probable"} max={maxLabel || "Muy probable"} />
      </div>
    );
  }

  if (kind === "stars") {
    const picked = Number(selected) || 0;
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: STAR_STEPS }, (_, index) => {
            const step = index + 1;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onChange(picked === step ? null : String(step))}
                aria-label={`${step} de ${STAR_STEPS}`}
                aria-pressed={picked === step}
                className="rounded-lg p-1.5 transition-transform duration-150 hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    step <= picked
                      ? "fill-status-warning text-status-warning"
                      : "text-border hover:text-status-warning/50"
                  )}
                  strokeWidth={2}
                />
              </button>
            );
          })}
        </div>
        <EndLabels min={minLabel} max={maxLabel} />
      </div>
    );
  }

  if (kind === "emoji") {
    const picked = Number(selected) || 0;
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          {Array.from({ length: EMOJI_STEPS }, (_, index) => {
            const step = index + 1;
            const Face = EMOJI_FACES[index] ?? Meh;
            const isSelected = picked === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onChange(isSelected ? null : String(step))}
                aria-label={`${step} de ${EMOJI_STEPS}`}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-2xl border p-2.5 transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-transparent text-text-muted hover:-translate-y-px hover:border-border/70 hover:text-text-secondary"
                )}
              >
                <Face className="h-7 w-7" strokeWidth={2} />
              </button>
            );
          })}
        </div>
        <EndLabels min={minLabel} max={maxLabel} />
      </div>
    );
  }

  if (kind === "linear") {
    const picked = Number(selected) || 0;
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {Array.from({ length: LINEAR_STEPS }, (_, index) => {
            const step = index + 1;
            const isSelected = picked === step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => onChange(isSelected ? null : String(step))}
                aria-pressed={isSelected}
                className={cn(
                  "h-11 min-w-[44px] rounded-xl border px-3 text-[13px] font-bold tabular-nums transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary text-white shadow-[0_6px_16px_-8px_hsl(var(--primary)/0.9)]"
                    : "border-border/70 bg-surface text-text-secondary hover:-translate-y-px hover:border-primary/40 hover:text-text-primary"
                )}
              >
                {step}
              </button>
            );
          })}
        </div>
        <EndLabels min={minLabel} max={maxLabel} />
      </div>
    );
  }

  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-3 text-[13px] text-text-muted">
      Esta pregunta todavía no tiene un tipo de escala configurado.
    </p>
  );
}

function EndLabels({ min, max }: { min: string; max: string }) {
  if (!min && !max) return null;
  return (
    <div className="flex items-center justify-between gap-4 text-[12px] font-medium text-text-muted">
      <span>{min}</span>
      <span className="text-right">{max}</span>
    </div>
  );
}

function EmptyOptions() {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-3 text-[13px] text-text-muted">
      Esta pregunta todavía no tiene opciones de respuesta.
    </p>
  );
}
