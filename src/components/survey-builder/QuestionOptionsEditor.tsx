import { Info, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_OPTIONS, MIN_OPTIONS, buildOption } from "./questionCatalog";
import type { QuestionOption } from "./surveyBuilderTypes";

interface QuestionOptionsEditorProps {
  options: readonly QuestionOption[];
  /** True once the author has tried to leave the sections step with a blank
   * option still in this list. */
  showValidation?: boolean;
  onChange: (options: readonly QuestionOption[]) => void;
}

/** The answer options of a single-choice, multi-choice or dropdown question. */
export function QuestionOptionsEditor({
  options,
  showValidation = false,
  onChange,
}: QuestionOptionsEditorProps) {
  const canRemove = options.length > MIN_OPTIONS;
  const canAdd = options.length < MAX_OPTIONS;

  const updateLabel = (id: string, label: string) =>
    onChange(options.map((option) => (option.id === id ? { ...option, label } : option)));

  const remove = (id: string) => onChange(options.filter((option) => option.id !== id));

  return (
    <div className="flex flex-col gap-2.5">
      <p className="flex items-center gap-2 rounded-md bg-primary/5 px-3.5 py-2.5 text-[12px] font-semibold text-primary">
        <Info className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        Debes tener entre {MIN_OPTIONS} y {MAX_OPTIONS} opciones de respuesta
      </p>

      <ul className="flex flex-col gap-2">
        {options.map((option, index) => {
          const isEmpty = option.label.trim() === "";
          const showError = showValidation && isEmpty;
          return (
          <li key={option.id} className="flex items-center gap-2.5">
            <span className="w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground/70">
              {index + 1}
            </span>
            <input
              value={option.label}
              onChange={(event) => updateLabel(option.id, event.target.value)}
              placeholder="Escribe una opción de respuesta"
              aria-label={`Opción de respuesta ${index + 1}`}
              className={cn(
                "h-10 min-w-0 flex-1 rounded-md border bg-surface px-3 text-[13px] text-text-primary outline-none transition-all focus:ring-2 placeholder:text-muted-foreground/70",
                showError
                  ? "border-destructive focus:border-destructive focus:ring-destructive/25"
                  : "border-border focus:border-primary focus:ring-primary/25"
              )}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => remove(option.id)}
                  disabled={!canRemove}
                  aria-label={`Eliminar opción ${index + 1}`}
                  className={cn(
                    "shrink-0 rounded-md border border-status-negative/30 bg-status-negative/5 p-2 text-status-negative transition-all",
                    "hover:border-status-negative/40 hover:bg-status-negative/10",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30",
                    "disabled:cursor-not-allowed disabled:border-border/70 disabled:bg-transparent disabled:text-muted-foreground/70 disabled:opacity-40"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {canRemove ? "Eliminar opción" : `Se requieren al menos ${MIN_OPTIONS} opciones`}
              </TooltipContent>
            </Tooltip>
          </li>
          );
        })}
      </ul>

      {canAdd && (
        <button
          type="button"
          onClick={() => onChange([...options, buildOption()])}
          className="flex w-fit items-center gap-1.5 self-center rounded-md border border-border px-3 py-2 text-[12px] font-semibold text-text-primary transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Agregar opción
        </button>
      )}
    </div>
  );
}
