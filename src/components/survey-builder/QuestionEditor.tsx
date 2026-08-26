import * as React from "react";
import { Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionOptionsEditor } from "./QuestionOptionsEditor";
import { ScalePreview } from "./ScalePreview";
import {
  QUESTION_TYPES,
  RATING_TYPES,
  SCALE_TYPES,
  changeQuestionType,
  changeScaleType,
  hasEndLabels,
  hasOptions,
  needsRatingType,
  supportsDontKnow,
  supportsFollowUps,
  type CatalogEntry,
} from "./questionCatalog";
import type {
  NpsFollowUps,
  QuestionType,
  RatingType,
  ScaleType,
  SurveyQuestion,
} from "./surveyBuilderTypes";

interface QuestionEditorProps {
  /** The question as it stands in the survey right now. */
  question: SurveyQuestion;
  index: number;
  /** True once the author has tried to leave the sections step with this
   * question still incomplete — flips on the missing-field highlighting
   * rather than greeting a blank form with errors. */
  showValidation?: boolean;
  /** Every change writes straight to the survey — there is no draft to save. */
  onChange: (question: SurveyQuestion) => void;
  /** Click outside (or Escape) closes the editor; anything typed is already committed. */
  onClose: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

const REQUIRED_FIELD_HINT = "Este campo es obligatorio";

/**
 * The expanded form for one question. Which fields appear is driven entirely by
 * the catalog (`questionCatalog.ts`) rather than by branches here, so a new
 * question type shows up correctly without touching this component.
 *
 * It edits the survey directly, on every keystroke: there is nothing to
 * "Guardar" because there is no draft. Clicking outside — or pressing Escape —
 * closes the form with whatever was written already in place.
 */
export function QuestionEditor({
  question,
  index,
  showValidation = false,
  onChange,
  onClose,
  onDuplicate,
  onRemove,
}: QuestionEditorProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  // While the removal banner is up, a click outside answers that decision
  // rather than closing the whole form underneath it.
  useClickOutside(rootRef, onClose, !isConfirmingRemove);

  const { scale } = question;
  const isScale = question.type === "scale";

  const patchScale = (patch: Partial<SurveyQuestion["scale"]>) =>
    onChange({ ...question, scale: { ...scale, ...patch } });

  const patchFollowUp = (patch: Partial<NpsFollowUps>) =>
    patchScale({ followUps: { ...scale.followUps, ...patch } });

  const showFollowUps = isScale && supportsFollowUps(scale.kind) && scale.followUpEnabled;

  const statementError =
    showValidation && question.statement.trim() === "" ? REQUIRED_FIELD_HINT : undefined;

  // A long form pushes the footer below the fold, so the removal prompt can be
  // raised by a click the author can't see the answer to. Bring it to them.
  const promptRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isConfirmingRemove) return;
    promptRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isConfirmingRemove]);

  // Escape is the reflex for "get me out of this form". While the removal
  // banner is up, it dismisses that decision first rather than skipping past
  // it to whatever closing would do.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    if (isConfirmingRemove) {
      setIsConfirmingRemove(false);
      return;
    }
    onClose();
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold tracking-tight text-primary">
          Pregunta {index + 1}
          <span className="font-semibold text-muted-foreground">
            ({question.required ? "obligatoria" : "opcional"})
          </span>
        </p>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setIsConfirmingRemove(true)}
              aria-label={`Eliminar pregunta ${index + 1}`}
              className="shrink-0 rounded-md border border-border/70 p-1.5 text-muted-foreground/70 transition-all hover:border-status-negative/30 hover:bg-status-negative/5 hover:text-status-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Eliminar pregunta</TooltipContent>
        </Tooltip>
      </div>

      {/* Type selectors. Full width on its own — only "Escala de valoración"
          has variations to configure, so only it splits into two columns. */}
      <div className={cn("grid gap-3", isScale && "sm:grid-cols-2")}>
        <Field label="Tipo de pregunta">
          <CatalogSelect
            entries={QUESTION_TYPES}
            value={question.type}
            placeholder="Tipo de pregunta"
            ariaLabel="Tipo de pregunta"
            onChange={(type: QuestionType) => onChange(changeQuestionType(question, type))}
          />
        </Field>

        {isScale && (
          <Field label="Tipo de escala">
            <CatalogSelect
              entries={SCALE_TYPES}
              value={scale.kind}
              placeholder="Tipo de escala"
              ariaLabel="Tipo de escala"
              onChange={(kind: ScaleType) => onChange(changeScaleType(question, kind))}
            />
          </Field>
        )}

        {isScale && needsRatingType(scale.kind) && (
          <Field label="Tipo de valoración">
            <CatalogSelect
              entries={RATING_TYPES}
              value={scale.ratingType}
              placeholder="Tipo de valoración"
              ariaLabel="Tipo de valoración"
              onChange={(ratingType: RatingType) => patchScale({ ratingType })}
            />
          </Field>
        )}
      </div>

      {/* Statement */}
      <Field label="Pregunta o enunciado" error={statementError}>
        <textarea
          value={question.statement}
          onChange={(event) => onChange({ ...question, statement: event.target.value })}
          placeholder="Escribe aquí la pregunta o enunciado"
          aria-label="Pregunta o enunciado"
          rows={2}
          className={cn(
            "w-full resize-y rounded-md border bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-all focus:ring-2 placeholder:text-muted-foreground/70",
            statementError
              ? "border-destructive focus:border-destructive focus:ring-destructive/25"
              : "border-border focus:border-primary focus:ring-primary/25"
          )}
        />
      </Field>

      {isScale && <ScalePreview question={question} />}

      {isScale && hasEndLabels(scale.kind) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Etiqueta mínima">
            <TextField
              value={scale.minLabel}
              placeholder="Escribe aquí la etiqueta mínima"
              onChange={(minLabel) => patchScale({ minLabel })}
            />
          </Field>
          <Field label="Etiqueta máxima">
            <TextField
              value={scale.maxLabel}
              placeholder="Escribe aquí la etiqueta máxima"
              onChange={(maxLabel) => patchScale({ maxLabel })}
            />
          </Field>
        </div>
      )}

      {hasOptions(question.type) && (
        <QuestionOptionsEditor
          options={question.options}
          showValidation={showValidation}
          onChange={(options) => onChange({ ...question, options })}
        />
      )}

      {showFollowUps && (
        <section className="flex flex-col gap-3 rounded-md border border-border/70 p-3.5">
          <h4 className="text-[12px] font-bold tracking-tight text-text-primary">
            Preguntas de profundidad
          </h4>
          <Field label="Pregunta para detractores">
            <TextField
              value={scale.followUps.detractors}
              placeholder="Escribe aquí la pregunta o enunciado"
              onChange={(detractors) => patchFollowUp({ detractors })}
            />
          </Field>
          <Field label="Pregunta para neutrales">
            <TextField
              value={scale.followUps.neutrals}
              placeholder="Escribe aquí la pregunta o enunciado"
              onChange={(neutrals) => patchFollowUp({ neutrals })}
            />
          </Field>
          <Field label="Pregunta para promotores">
            <TextField
              value={scale.followUps.promoters}
              placeholder="Escribe aquí la pregunta o enunciado"
              onChange={(promoters) => patchFollowUp({ promoters })}
            />
          </Field>
        </section>
      )}

      {/* Footer. Swapped out wholesale by the removal prompt below, so the
          decision lands exactly where the author was looking. */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-end gap-x-5 gap-y-3 border-t border-border/60 pt-3.5",
          isConfirmingRemove && "hidden"
        )}
      >
        {isScale && supportsDontKnow(scale.kind) && (
          <ToggleField
            label="Añadir opción no sabe / no responde"
            checked={scale.allowDontKnow}
            onChange={(allowDontKnow) => patchScale({ allowDontKnow })}
          />
        )}

        {isScale && supportsFollowUps(scale.kind) && (
          <ToggleField
            label="Preguntas de profundidad"
            checked={scale.followUpEnabled}
            onChange={(followUpEnabled) => patchScale({ followUpEnabled })}
          />
        )}

        <ToggleField
          label="Obligatoria"
          checked={question.required}
          onChange={(required) => onChange({ ...question, required })}
        />

        <button
          type="button"
          onClick={onDuplicate}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold text-text-primary transition-all hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2.2} />
          Duplicar
        </button>
      </div>

      {/* The removal prompt takes the footer's place rather than stacking under
          it: the decision lands exactly where the author was looking, and the
          buttons they might fat-finger are gone while it is up. */}
      {isConfirmingRemove && (
        <div
          ref={promptRef}
          role="alertdialog"
          aria-label="Eliminar pregunta"
          className="-mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border/60 bg-status-negative/5 px-4 py-3 animate-in fade-in duration-200"
        >
          <p className="min-w-0 text-[12.5px] leading-relaxed text-text-secondary">
            <span className="font-bold text-status-negative">¿Eliminar esta pregunta? </span>
            Esta acción no se puede deshacer.
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsConfirmingRemove(false)}
              className="rounded-full px-4"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onRemove}
              className="rounded-full px-4 font-semibold"
            >
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold text-text-secondary">{label}</span>
      {children}
      {error && <span className="text-[11.5px] text-destructive">{error}</span>}
    </label>
  );
}

function TextField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-md border border-border bg-surface px-3 text-[13px] text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70"
    />
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-text-secondary">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}

/**
 * A select backed by one of the catalogs. Generic over the value so the caller
 * keeps its narrow union type instead of falling back to `string`.
 */
function CatalogSelect<T extends string>({
  entries,
  value,
  placeholder,
  ariaLabel,
  onChange,
}: {
  entries: readonly CatalogEntry<T>[];
  value: T | null;
  placeholder: string;
  ariaLabel: string;
  onChange: (value: T) => void;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={(next) => onChange(next as T)}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("h-10 rounded-md px-3 text-[13px]", !value && "text-muted-foreground")}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      {/* Opens below the trigger instead of over it (Radix's item-aligned
          default), so the field you are changing stays visible while you pick. */}
      <SelectContent position="popper" sideOffset={6} className="w-[var(--radix-select-trigger-width)]">
        {entries.map(({ value: entryValue, label, icon: Icon }) => (
          <SelectItem key={entryValue} value={entryValue} className="text-[13px]">
            <span className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
              {label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
