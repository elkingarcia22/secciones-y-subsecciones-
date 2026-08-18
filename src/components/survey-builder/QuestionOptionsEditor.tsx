import { Info, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MAX_OPTIONS, MIN_OPTIONS, buildOption } from "./questionCatalog";
import type { QuestionOption } from "./surveyBuilderTypes";

interface QuestionOptionsEditorProps {
  options: readonly QuestionOption[];
  onChange: (options: readonly QuestionOption[]) => void;
}

/** The answer options of a single-choice, multi-choice or dropdown question. */
export function QuestionOptionsEditor({ options, onChange }: QuestionOptionsEditorProps) {
  const canRemove = options.length > MIN_OPTIONS;
  const canAdd = options.length < MAX_OPTIONS;

  const updateLabel = (id: string, label: string) =>
    onChange(options.map((option) => (option.id === id ? { ...option, label } : option)));

  const remove = (id: string) => onChange(options.filter((option) => option.id !== id));

  return (
    <div className="flex flex-col gap-2.5">
      <p className="flex items-center gap-2 rounded-md bg-primary/5 px-3.5 py-2.5 text-[11.5px] font-semibold text-primary">
        <Info className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        Debes tener entre {MIN_OPTIONS} y {MAX_OPTIONS} opciones de respuesta
      </p>

      <ul className="flex flex-col gap-2">
        {options.map((option, index) => (
          <li key={option.id} className="flex items-center gap-2.5">
            <span className="w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground/70">
              {index + 1}
            </span>
            <input
              value={option.label}
              onChange={(event) => updateLabel(option.id, event.target.value)}
              placeholder="Escribe una opción de respuesta"
              aria-label={`Opción de respuesta ${index + 1}`}
              className="h-10 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-[13px] text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => remove(option.id)}
                  disabled={!canRemove}
                  aria-label={`Eliminar opción ${index + 1}`}
                  className={cn(
                    "shrink-0 rounded-md border border-border/70 p-2 text-muted-foreground/70 transition-all",
                    "hover:border-status-negative/30 hover:bg-status-negative/5 hover:text-status-negative",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30",
                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border/70 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/70"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {canRemove ? "Eliminar opción" : `Se requieren al menos ${MIN_OPTIONS} opciones`}
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>

      {canAdd && (
        <button
          type="button"
          onClick={() => onChange([...options, buildOption()])}
          className="flex w-fit items-center gap-1.5 self-center rounded-md border border-border px-3 py-2 text-[11.5px] font-semibold text-text-primary transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Agregar opción
        </button>
      )}
    </div>
  );
}
