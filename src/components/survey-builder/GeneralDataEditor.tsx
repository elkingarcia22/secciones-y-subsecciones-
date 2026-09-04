import * as React from "react";
import {
  EyeOff,
  Globe,
  Minus,
  Plus,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toneChip, toneText, type Tone } from "@/lib/tone";
import { DualDateRangePicker } from "@/components/date";
import { MagicCard } from "@/components/ui/magic-card";
import { Switch } from "@/components/ui/switch";
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
import { KIND_VISUAL } from "./kindVisual";

interface GeneralDataEditorProps {
  draft: SurveyDraft;
  onChange: (patch: Partial<SurveyDraft>) => void;
  /** True once the author has tried to move past this step with required
   * fields still empty — flips on the missing-field highlighting rather than
   * showing it by default on a blank form. */
  showValidation?: boolean;
}

const REQUIRED_FIELD_HINT = "Este campo es obligatorio";

/**
 * The two visibility choices are a toggle between two equally valid ways to
 * run a survey, not a warning/safe pair — so both take the same brand blue
 * rather than singling one out in its own accent.
 */
const VISIBILITY_TONE: Readonly<Record<SurveyVisibility, Tone>> = {
  public: "brand",
  anonymous: "brand",
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
  // Only the kind label chip wears the survey's own accent — the header icon
  // stays brand blue like every other step's, instead of repainting itself
  // by what was picked here.
  const kindTone = draft.kind ? KIND_VISUAL[draft.kind].tone : "brand";

  // Local to the form: whether the description field is shown at all. Starts
  // on when the draft already carries a description (editing an existing
  // survey), off otherwise, so a blank new survey doesn't open with an extra
  // field nobody asked for.
  const [descriptionEnabled, setDescriptionEnabled] = React.useState(
    () => draft.description.trim() !== ""
  );

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
    <section className="flex min-w-0 flex-1 flex-col self-start rounded-2xl border border-border/60 bg-surface shadow-card">
      {/* The same header the participants and demographics steps carry — icon
          chip, title, and the one figure worth reading from here — so the five
          panels of the wizard read as five pages of one document.
          Sticky against the workspace's own scroll container (no nested
          overflow here) so it stays put while the fields below scroll, with
          just the one scrollbar the workspace already owns. */}
      <div className="sticky top-0 z-10 flex items-center gap-3 rounded-t-2xl border-b border-border/60 bg-surface px-6 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <Settings2 className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-bold tracking-tight text-text-primary">
          Datos generales
        </h2>
        {draft.kind && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold"
            style={toneChip(kindTone)}
          >
            {SURVEY_KIND_LABELS[draft.kind]}
          </span>
        )}
      </div>

      {/* `cascade-enter` here staggers this step's own fields in one at a
          time — name, then description, then dates, and so on — the same
          settle-in language the preview cascade uses for a page's pieces. */}
      <div className="flex flex-col gap-5 px-6 py-6 cascade-enter">
        {/* Name leads: it is the first thing the author decides and the one
            field that shows up outside this form, in the header title. The
            description toggle rides alongside it — turning it on reveals the
            field right below rather than committing every survey to one. */}
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-text-primary">
            Nombre de la encuesta
          </span>
          <span className="flex items-center gap-3">
            <input
              value={draft.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Escribe el nombre de la encuesta"
              aria-label="Nombre de la encuesta"
              aria-invalid={!!nameError}
              autoFocus
              className={cn(
                "h-10 min-w-0 flex-1 rounded-md border bg-surface px-3 text-[13px] text-text-primary outline-none transition-all focus:ring-2 placeholder:text-muted-foreground/70",
                nameError
                  ? "border-destructive focus:border-destructive focus:ring-destructive/25"
                  : "border-border focus:border-primary focus:ring-primary/25"
              )}
            />
            <span className="flex shrink-0 items-center gap-2">
              <span className="text-[12px] font-medium text-text-secondary">
                Añadir descripción
              </span>
              <Switch
                size="sm"
                checked={descriptionEnabled}
                onCheckedChange={(checked) => {
                  setDescriptionEnabled(checked);
                  if (!checked) onChange({ description: "" });
                }}
                aria-label="Añadir descripción"
              />
            </span>
          </span>
          {nameError && <span className="text-[12px] text-destructive">{nameError}</span>}
        </label>

        {descriptionEnabled && (
          <Field label="Descripción" hint={`Máximo ${MAX_DESCRIPTION_LENGTH} caracteres`}>
            <textarea
              value={draft.description}
              onChange={(event) =>
                onChange({ description: event.target.value.slice(0, MAX_DESCRIPTION_LENGTH) })
              }
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={2}
              autoFocus
              aria-label="Descripción de la encuesta"
              className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70"
            />
          </Field>
        )}

        <Field label="Tipo de encuesta" error={kindError}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5" role="radiogroup" aria-label="Tipo de encuesta">
            {KIND_OPTIONS.map(([optionValue, label]) => {
              const { icon: Icon, tone } = KIND_VISUAL[optionValue];
              const isSelected = draft.kind === optionValue;
              return (
                <MagicCard
                  key={optionValue}
                  role="radio"
                  aria-checked={isSelected}
                  isSelected={isSelected}
                  tone={tone}
                  onClick={() => onChange({ kind: optionValue })}
                  className={cn(kindError && !isSelected && "border-destructive/50")}
                  contentClassName="flex-col items-center justify-center gap-2 h-full"
                >
                  <div
                    className={cn(
                      "absolute -right-2 -top-2 flex size-3.5 items-center justify-center rounded-full border transition-colors",
                      !isSelected && "border-border/60"
                    )}
                    style={isSelected ? { borderColor: "currentColor" } : undefined}
                  >
                    {isSelected && <div className="size-1.5 rounded-full bg-current" />}
                  </div>
                  {/* The kind's own mark, on the tinted chip the home draws
                      its template badges on — so "Cultura" is the same green
                      heart in the shelf and here. */}
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                    style={toneChip(tone)}
                  >
                    <Icon className="size-[18px]" strokeWidth={2} />
                  </span>
                  <span
                    className="text-center text-[12px] font-semibold leading-tight"
                    style={isSelected ? undefined : { color: "var(--color-text-secondary)" }}
                  >
                    {label}
                  </span>
                </MagicCard>
              );
            })}
          </div>
        </Field>

        {/* Flight-booking experience: two distinct inputs for start and end dates with a unified dual-month range picker */}
        <DualDateRangePicker
          startDate={startDate}
          endDate={parseISODate(draft.endDate)}
          startError={startDateError}
          endError={endDateError}
          locale="es"
          onChange={({ startDate: newStart, endDate: newEnd }) => {
            onChange({
              startDate: toISODate(newStart),
              endDate: toISODate(newEnd),
            });
          }}
        />

        <Field label="Tipo de visibilidad">
          <div className="grid gap-4 sm:grid-cols-2">
            {VISIBILITY_OPTIONS.map(([optionValue, label]) => {
              const isSelected = draft.visibility === optionValue;
              const Icon = optionValue === "public" ? Globe : EyeOff;
              const tone = VISIBILITY_TONE[optionValue];
              return (
                <MagicCard
                  key={optionValue}
                  isSelected={isSelected}
                  tone={tone}
                  onClick={() => onChange({ visibility: optionValue })}
                  contentClassName="flex-col items-start gap-3"
                >
                  <div className="flex w-full items-center gap-2.5">
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                        !isSelected && "tone-reveal-chip"
                      )}
                      style={isSelected ? toneChip(tone) : undefined}
                    >
                      <Icon className="size-[17px]" strokeWidth={2} />
                    </span>
                    <span
                      className={cn("text-[14px] font-semibold", !isSelected && "tone-reveal-text")}
                      style={isSelected ? toneText(tone) : undefined}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[13px] font-semibold text-text-primary">
                      {SURVEY_VISIBILITY_HEADLINES[optionValue]}
                    </p>
                    <p className="text-[12px] leading-relaxed text-text-secondary">
                      {SURVEY_VISIBILITY_NOTES[optionValue]}
                    </p>
                  </div>
                </MagicCard>
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
                  className="h-8 w-12 shrink-0 rounded-md border border-border bg-surface text-center text-[14px] font-bold tabular-nums text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25"
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
                <p className="text-[13px] font-semibold text-text-primary">
                  Mínimo de colaboradores por grupo
                </p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
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
      <span className="text-[13px] font-semibold text-text-primary">{label}</span>
      {children}
      {error ? (
        <span className="text-[12px] text-destructive">{error}</span>
      ) : (
        hint && <span className="text-[12px] text-muted-foreground">{hint}</span>
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
          "h-10 rounded-md px-3 text-[13px]",
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
