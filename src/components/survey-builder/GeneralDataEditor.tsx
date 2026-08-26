import * as React from "react";
import {
  BrainCircuit,
  EyeOff,
  Gauge,
  Globe,
  Heart,
  Info,
  Minus,
  Plus,
  Shapes,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "@/components/date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ANONYMITY_THRESHOLD_MIN,
  MAX_DESCRIPTION_LENGTH,
  SURVEY_KIND_LABELS,
  SURVEY_VISIBILITY_HEADLINES,
  SURVEY_VISIBILITY_LABELS,
  SURVEY_VISIBILITY_NOTES,
  type SurveyDraft,
  type SurveyKind,
  type SurveyVisibility,
} from "./surveyBuilderTypes";

interface GeneralDataEditorProps {
  draft: SurveyDraft;
  onChange: (patch: Partial<SurveyDraft>) => void;
  /** True once the author has tried to move past this step with required
   * fields still empty — flips on the missing-field highlighting rather than
   * showing it by default on a blank form. */
  showValidation?: boolean;
}

const REQUIRED_FIELD_HINT = "Este campo es obligatorio";

/** One icon per survey kind, so the list is scannable by shape, not just text. */
const KIND_ICONS: Readonly<Record<SurveyKind, LucideIcon>> = {
  cultura: Heart,
  clima: Sprout,
  enps: Gauge,
  otros: Shapes,
  ia: BrainCircuit,
};

const KIND_OPTIONS = Object.entries(SURVEY_KIND_LABELS) as [SurveyKind, string][];
const VISIBILITY_OPTIONS = Object.entries(SURVEY_VISIBILITY_LABELS) as [SurveyVisibility, string][];

/** `yyyy-mm-dd` ⇄ Date, kept local so the draft stays a plain serialisable shape. */
function parseISODate(value: string): Date | null {
  if (value === "") return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toISODate(date: Date | undefined): string {
  if (!date) return "";
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The survey's own settings: what it is called, what it measures, when it runs
 * and how traceable the answers are. Distinct from the respondent-facing blocks
 * in the panel — nobody taking the survey ever sees this.
 */
export function GeneralDataEditor({ draft, onChange, showValidation = false }: GeneralDataEditorProps) {
  // A closing date before the start is the one combination that makes the
  // survey impossible to run, so it is worth catching in the form.
  const hasInvalidRange =
    draft.startDate !== "" && draft.endDate !== "" && draft.endDate < draft.startDate;

  const nameError =
    showValidation && draft.name.trim() === "" ? REQUIRED_FIELD_HINT : undefined;
  const kindError =
    showValidation && draft.kind === null ? REQUIRED_FIELD_HINT : undefined;
  const startDateError =
    showValidation && draft.startDate === "" ? REQUIRED_FIELD_HINT : undefined;
  // The impossible-range message takes precedence: it is the more specific,
  // more actionable problem once a date is actually present.
  const endDateError = hasInvalidRange
    ? "El cierre no puede ser antes del inicio"
    : showValidation && draft.endDate === ""
      ? REQUIRED_FIELD_HINT
      : undefined;

  const startDate = parseISODate(draft.startDate);
  const isAnonymous = draft.visibility === "anonymous";

  // Typed independently of `draft.anonymityThreshold` so a digit being typed
  // (including an empty field mid-edit, or a value below the floor) isn't
  // immediately clamped back — that would fight the author's keystrokes.
  // The stepper buttons write straight to the draft, so this only needs to
  // follow along when the value changes from outside a manual edit.
  const [thresholdInput, setThresholdInput] = React.useState(() => String(draft.anonymityThreshold));
  React.useEffect(() => {
    setThresholdInput(String(draft.anonymityThreshold));
  }, [draft.anonymityThreshold]);

  const commitThreshold = () => {
    const parsed = Number.parseInt(thresholdInput, 10);
    const next = Number.isNaN(parsed)
      ? draft.anonymityThreshold
      : Math.max(ANONYMITY_THRESHOLD_MIN, parsed);
    onChange({ anonymityThreshold: next });
    setThresholdInput(String(next));
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col self-start rounded-2xl border border-border/50 bg-surface p-6 shadow-card">
      <div className="flex flex-col gap-5">
        {/* Name leads: it is the first thing the author decides and the one
            field that shows up outside this form, in the header title. */}
        <Field label="Nombre de la encuesta" error={nameError}>
          <input
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Escribe el nombre de la encuesta"
            aria-label="Nombre de la encuesta"
            aria-invalid={!!nameError}
            className={cn(
              "h-11 w-full rounded-md border bg-surface px-3 text-[13px] text-text-primary outline-none transition-all focus:ring-2 placeholder:text-muted-foreground/70",
              nameError
                ? "border-destructive focus:border-destructive focus:ring-destructive/25"
                : "border-border focus:border-primary focus:ring-primary/25"
            )}
          />
        </Field>

        <Field label="Descripción (Opcional)" hint={`Máximo ${MAX_DESCRIPTION_LENGTH} caracteres`}>
          <textarea
            value={draft.description}
            onChange={(event) =>
              onChange({ description: event.target.value.slice(0, MAX_DESCRIPTION_LENGTH) })
            }
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={2}
            aria-label="Descripción de la encuesta"
            className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70"
          />
        </Field>

        {/* A single DateRangePicker gives the Avianca/Despegar booking experience,
            showing two months and allowing the user to select the range in one go. */}
        <div className="grid gap-4 sm:grid-cols-1">
          <DateRangePicker
            label="Fechas de la encuesta"
            placeholder="Selecciona el rango (Inicio - Cierre)"
            locale="es"
            value={{
              from: startDate ?? undefined,
              to: parseISODate(draft.endDate) ?? undefined,
            }}
            error={startDateError || endDateError}
            onChange={(range) => {
              onChange({
                startDate: toISODate(range?.from),
                endDate: toISODate(range?.to),
              });
            }}
          />
        </div>

        <Field label="Tipo de encuesta" error={kindError}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {KIND_OPTIONS.map(([optionValue, label]) => {
              const Icon = KIND_ICONS[optionValue];
              const isSelected = draft.kind === optionValue;
              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => onChange({ kind: optionValue })}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2.5 rounded-lg border p-4 transition-all hover:bg-surface-hover",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-surface text-text-secondary hover:border-border-hover",
                    kindError && !isSelected && "border-destructive/50"
                  )}
                >
                  <Icon className="size-6" strokeWidth={1.5} />
                  <span className="text-center text-[12px] font-medium leading-tight">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Tipo de visibilidad">
          <div className="grid gap-4 sm:grid-cols-2">
            {VISIBILITY_OPTIONS.map(([optionValue, label]) => {
              const isSelected = draft.visibility === optionValue;
              const Icon = optionValue === "public" ? Globe : EyeOff;
              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => onChange({ visibility: optionValue })}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all hover:bg-surface-hover",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-surface hover:border-border-hover"
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <Icon className={cn("size-5", isSelected ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
                    <span className={cn("text-[14px] font-semibold", isSelected ? "text-primary" : "text-text-primary")}>
                      {label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[12.5px] font-semibold text-text-primary">
                      {SURVEY_VISIBILITY_HEADLINES[optionValue]}
                    </p>
                    <p className="text-[12px] leading-relaxed text-text-secondary">
                      {SURVEY_VISIBILITY_NOTES[optionValue]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Field>

        {/* A stepper card instead of a plain dropdown, but the number
            itself stays a real input — nudge it with the buttons, or type
            a value directly when the target is further away. */}
        {isAnonymous && (
            <div className="mt-1 flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-surface px-4 py-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label="Reducir el mínimo de colaboradores"
                  disabled={draft.anonymityThreshold <= ANONYMITY_THRESHOLD_MIN}
                  onClick={() =>
                    onChange({
                      anonymityThreshold: Math.max(
                        ANONYMITY_THRESHOLD_MIN,
                        draft.anonymityThreshold - 1
                      ),
                    })
                  }
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 text-text-secondary transition-all hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={thresholdInput}
                  onChange={(event) =>
                    setThresholdInput(event.target.value.replace(/[^0-9]/g, ""))
                  }
                  onBlur={commitThreshold}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  aria-label="Mínimo de colaboradores por grupo"
                  className="h-8 w-12 shrink-0 rounded-md border border-border bg-surface text-center text-[15px] font-bold tabular-nums text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25"
                />
                <button
                  type="button"
                  aria-label="Aumentar el mínimo de colaboradores"
                  onClick={() =>
                    onChange({ anonymityThreshold: draft.anonymityThreshold + 1 })
                  }
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 text-text-secondary transition-all hover:border-primary/40 hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </div>

              <div className="h-8 w-px shrink-0 bg-border/60" />

              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-text-primary">
                  Mínimo de colaboradores por grupo
                </p>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                  Un grupo solo verá sus resultados cuando al menos {draft.anonymityThreshold}{" "}
                  de sus colaboradores hayan respondido.
                </p>
              </div>
            </div>
          )}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Required-field message. Takes over the hint slot in the error's voice
   * rather than stacking both — one message under the input is enough. */
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[12.5px] font-semibold text-text-primary">{label}</span>
      {children}
      {error ? (
        <span className="text-[11.5px] text-destructive">{error}</span>
      ) : (
        hint && <span className="text-[11.5px] text-muted-foreground">{hint}</span>
      )}
    </label>
  );
}

/**
 * A select over a `[value, label]` list, keeping the caller's union type.
 * `icons` is optional so the same component serves plain lists.
 */
function LabelledSelect<T extends string>({
  options,
  value,
  placeholder,
  ariaLabel,
  icons,
  hasError = false,
  onChange,
}: {
  options: readonly [T, string][];
  /** Null before the author has picked one — Radix shows the placeholder
   * for an empty string just as it would for an unset value. */
  value: T | null;
  placeholder?: string;
  ariaLabel: string;
  icons?: Readonly<Record<T, LucideIcon>>;
  hasError?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger
        aria-label={ariaLabel}
        aria-invalid={hasError}
        className={cn(
          "h-11 rounded-md px-3 text-[13px]",
          hasError && "border-destructive focus:border-destructive focus:ring-destructive/25"
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={6}
        className="w-[var(--radix-select-trigger-width)]"
      >
        {options.map(([optionValue, label]) => {
          // Annotated: indexing a Record keyed by the generic T yields a type
          // TypeScript won't accept as a component without this widening.
          const Icon: LucideIcon | undefined = icons?.[optionValue];
          return (
            <SelectItem key={optionValue} value={optionValue} className="text-[13px]">
              <span className="flex items-center gap-2">
                {Icon && <Icon className="size-3.5 text-muted-foreground" strokeWidth={2} />}
                {label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
