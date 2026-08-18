import * as React from "react";
import { BookOpen, Database, Lock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useClickOutside } from "@/hooks/useClickOutside";
import { InlineDeleteConfirm } from "./InlineDeleteConfirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuestionOptionsEditor } from "./QuestionOptionsEditor";
import { DEMOGRAPHIC_TYPES, demographicTypeLabel, findSystemDemographic } from "./demographics";
import { MIN_OPTIONS, buildOption } from "./questionCatalog";
import type { DemographicField, DemographicType } from "./surveyBuilderTypes";

interface DemographicEditorProps {
  field: DemographicField;
  index: number;
  onChange: (field: DemographicField) => void;
  onRemove: () => void;
  onClose: () => void;
}

/**
 * The expanded form for one demographic.
 *
 * It edits the survey directly on every keystroke, and closes by clicking
 * outside (or Escape): there is no draft to discard because there is nothing
 * here you can lose track of — a label, a list of options, and whether it is
 * required.
 *
 * Whether a preloadable field is activated and whether it is shown to the
 * participant are both decided from its row in "Datos precargados del
 * sistema", not here — opening this editor is purely about wording and
 * options, so it never duplicates a control the row already owns.
 *
 * What is editable also depends on where the field comes from. A system
 * field's options are the platform's own values, so they are shown and locked:
 * rewording "Tecnología" here would produce a segment that matches nobody. Its
 * wording is still yours to change — that is what the participant reads.
 *
 * Only a field written just for this survey (custom) can be deleted. System,
 * module and imported fields are toggled on/off from their own rows instead —
 * nothing about them is ever thrown away here.
 */
export function DemographicEditor({
  field,
  index,
  onChange,
  onRemove,
  onClose,
}: DemographicEditorProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  // While the removal banner is up, a click outside answers that decision
  // rather than closing the whole form underneath it.
  useClickOutside(rootRef, onClose, !isConfirmingRemove);
  const isCustom = field.source === "custom";
  const isSystem = field.source === "system";
  const isLibrary = field.source === "library";
  const systemEntry = isSystem && field.catalogKey ? findSystemDemographic(field.catalogKey) : null;

  // A long form pushes the footer below the fold, so the removal prompt can be
  // raised by a click the author can't see the answer to. Bring it to them.
  const promptRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isConfirmingRemove) return;
    promptRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isConfirmingRemove]);

  // Escape is the reflex for "cierra esto". While the removal banner is up,
  // it dismisses that decision first rather than skipping past it to closing.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    if (isConfirmingRemove) {
      setIsConfirmingRemove(false);
      return;
    }
    onClose();
  };

  const changeType = (type: DemographicType) => {
    // Switching type never leaves a choice question with fewer options than it
    // can be answered with.
    const missing = Math.max(0, MIN_OPTIONS - field.options.length);
    onChange({
      ...field,
      type,
      options: missing === 0
        ? field.options
        : [...field.options, ...Array.from({ length: missing }, () => buildOption())],
    });
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-4" onKeyDown={handleKeyDown}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold tracking-tight text-primary">
          Dato demográfico {index + 1}
          <span className="font-semibold text-muted-foreground">
            {!field.visible ? "(no se muestra)" : field.required ? "(obligatorio)" : "(opcional)"}
          </span>
          {field.preloadable && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              <Database className="h-2.5 w-2.5" strokeWidth={2.6} />
              Precargado
            </span>
          )}
          {isLibrary && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              <BookOpen className="h-2.5 w-2.5" strokeWidth={2.6} />
              Del módulo de encuestas
            </span>
          )}
        </p>

        {isCustom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setIsConfirmingRemove(true)}
                aria-label={`Eliminar dato demográfico ${index + 1}`}
                className="shrink-0 rounded-md border border-border/70 p-1.5 text-muted-foreground/70 transition-all hover:border-status-negative/30 hover:bg-status-negative/5 hover:text-status-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Eliminar dato demográfico</TooltipContent>
          </Tooltip>
        )}
      </div>

      <Field
        label="Pregunta o enunciado"
        hint={!field.visible ? "Solo se usa como nombre del filtro en los resultados." : undefined}
      >
        <textarea
          value={field.label}
          onChange={(event) => onChange({ ...field, label: event.target.value })}
          placeholder="Escribe aquí la pregunta o enunciado"
          aria-label="Pregunta o enunciado del dato demográfico"
          rows={2}
          className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70"
        />
      </Field>

      {isSystem ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11.5px] font-semibold text-text-secondary">
              Opciones de respuesta
            </span>
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground">
              <Lock className="h-3 w-3" strokeWidth={2.4} />
              Las define la plataforma
            </span>
          </div>

          <ul className="flex flex-wrap gap-1.5">
            {field.options.map((option) => (
              <li
                key={option.id}
                className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11.5px] font-medium text-text-secondary"
              >
                {option.label}
              </li>
            ))}
          </ul>

          {systemEntry && (
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">
              {systemEntry.origin} Se responde como {demographicTypeLabel(field.type).toLowerCase()}.
            </p>
          )}
        </div>
      ) : (
        <>
          <Field label="Tipo de respuesta">
            <Select value={field.type} onValueChange={(next) => changeType(next as DemographicType)}>
              <SelectTrigger
                aria-label="Tipo de respuesta"
                className="h-10 rounded-md px-3 text-[13px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={6}
                className="w-[var(--radix-select-trigger-width)]"
              >
                {DEMOGRAPHIC_TYPES.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value} className="text-[13px]">
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <QuestionOptionsEditor
            options={field.options}
            onChange={(options) => onChange({ ...field, options })}
          />
        </>
      )}

      {/* Nothing is asked of a hidden field, so there is nothing to require and no
          helper control to place. */}
      {field.visible && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-end gap-x-5 gap-y-3 border-t border-border/60 pt-3.5",
            isConfirmingRemove && "hidden"
          )}
        >
          <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-text-secondary">
            Obligatoria
            <Switch
              checked={field.required}
              onCheckedChange={(required) => onChange({ ...field, required })}
              aria-label="Obligatoria"
            />
          </label>
        </div>
      )}

      {/* The removal prompt takes the footer's place — or, on a hidden field
          with no footer at all, is simply the bottom of the form — rather than
          the header the trash button sits in, so it lands where a question's
          own removal prompt does. */}
      {isConfirmingRemove && (
        <div ref={promptRef} className={cn(!field.visible && "border-t border-border/60 pt-3.5")}>
          <InlineDeleteConfirm
            ariaLabel={`Confirmar eliminación del dato demográfico ${index + 1}`}
            message="Se eliminará este dato demográfico. Esta acción no se puede deshacer."
            onCancel={() => setIsConfirmingRemove(false)}
            onConfirm={onRemove}
          />
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold text-text-secondary">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
