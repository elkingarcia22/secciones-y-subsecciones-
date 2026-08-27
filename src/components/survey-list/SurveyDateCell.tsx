import * as React from "react";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatSurveyDate, parseSurveyDate } from "./surveyListDates";

export type DateEditMode = "editStartDate" | "editEndDate" | "reopen" | "editDates";

/**
 * The date of one row, while it is being changed.
 */
export function SurveyDateCell({
  value,
  mode,
  minDate,
  onSave,
  onCancel,
}: {
  /** The row's current date, in the list's own format. */
  value: string;
  mode: DateEditMode;
  minDate: Date;
  onSave: (date: Date) => void;
  onCancel: () => void;
}) {
  const [staged, setStaged] = React.useState<Date | undefined>(() =>
    mode === "reopen" ? undefined : (parseSurveyDate(value) ?? undefined)
  );
  const [open, setOpen] = React.useState(true);
  const committed = React.useRef(false);

  const isBelowMin = staged != null && staged < minDate;
  const canSave = staged != null && !isBelowMin;

  const isStart = mode === "editStartDate";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) return;
        if (!committed.current) onCancel();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          aria-label={isStart ? "Elegir la nueva fecha de inicio" : "Elegir la nueva fecha de cierre"}
          className="flex h-8 w-full items-center gap-1.5 rounded-lg border border-primary bg-surface px-2 text-[12px] font-semibold tabular-nums text-text-primary ring-2 ring-primary/20 transition-colors hover:bg-primary/5 focus-visible:outline-none"
        >
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
          <span className={staged ? undefined : "text-muted-foreground font-medium"}>
            {staged ? formatSurveyDate(staged) : "Elegir"}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-auto p-0"
        onClick={(event) => event.stopPropagation()}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="border-b border-border/60 px-3 py-2.5">
          <p className="text-[13px] font-bold tracking-tight text-text-primary">
            {mode === "reopen"
              ? "Reabrir hasta"
              : isStart
                ? "Nueva fecha de inicio"
                : "Nueva fecha de cierre"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {mode === "reopen"
              ? "La encuesta vuelve a estar en curso y admite respuestas hasta ese día."
              : isStart
                ? "La encuesta comenzará a admitir respuestas ese día."
                : "La encuesta deja de admitir respuestas ese día."}
          </p>
        </div>

        <Calendar
          mode="single"
          locale={es}
          selected={staged}
          onSelect={(date: Date | undefined) => setStaged(date)}
          disabled={(date: Date) => date < minDate}
        />

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-3 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[13px]"
            onClick={() => {
              setOpen(false);
              onCancel();
            }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-8 text-[13px]"
            disabled={!canSave}
            onClick={() => {
              if (!staged) return;
              committed.current = true;
              setOpen(false);
              onSave(staged);
            }}
          >
            {mode === "reopen" ? "Reabrir" : "Guardar"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
