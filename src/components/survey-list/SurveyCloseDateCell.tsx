import * as React from "react";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatSurveyDate, parseSurveyDate } from "./surveyListDates";

export type CloseDateEditMode = "editDates" | "reopen";

/**
 * The closing date of one row, while it is being changed.
 *
 * Changing when a survey closes happens in the cell that already shows it,
 * rather than in a dialog: the date only means anything next to the row's start
 * date and its progress, and a modal would cover exactly the numbers the
 * decision rests on. The calendar opens on arrival because entering this state
 * is already a deliberate act — asking for one more click to see the thing you
 * came to change is a step that carries no information. It stays open until
 * Cancelar or a save closes it on purpose — a stray click outside cannot.
 */
export function SurveyCloseDateCell({
  value,
  mode,
  minDate,
  onSave,
  onCancel,
}: {
  /** The row's current closing date, in the list's own format. */
  value: string;
  mode: CloseDateEditMode;
  minDate: Date;
  onSave: (date: Date) => void;
  onCancel: () => void;
}) {
  // Reopening starts blank on purpose: the old date is in the past and picking
  // it again would be meaningless, so there is nothing honest to pre-fill.
  const [staged, setStaged] = React.useState<Date | undefined>(() =>
    mode === "reopen" ? undefined : (parseSurveyDate(value) ?? undefined)
  );
  // Open from the very first render — the click that started the edit is
  // still travelling up the tree, which would normally read as an immediate
  // outside click and close the calendar on arrival, but onInteractOutside
  // below already refuses every such dismissal, so there is nothing left to
  // stagger a frame for.
  const [open, setOpen] = React.useState(true);

  // Set the moment a save starts, so the close that follows is not mistaken
  // for a dismissal and does not undo the edit on its way out.
  const committed = React.useRef(false);

  const isBelowMin = staged != null && staged < minDate;
  const canSave = staged != null && !isBelowMin;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) return;
        // Outside clicks and Escape are blocked below, so this only fires
        // from Cancelar or a save — but if a close ever does arrive some
        // other way, it must still leave the edit rather than strand the row
        // in a state with no visible way out.
        if (!committed.current) onCancel();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          aria-label="Elegir la nueva fecha de cierre"
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
        // The calendar is a decision, not a peek: a stray click outside or an
        // Escape must not be able to end the edit by accident. Cancelar and
        // Guardar/Reabrir are the only doors out.
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="border-b border-border/60 px-3 py-2.5">
          <p className="text-[13px] font-bold tracking-tight text-text-primary">
            {mode === "reopen" ? "Reabrir hasta" : "Nueva fecha de cierre"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {mode === "reopen"
              ? "La encuesta vuelve a estar en curso y admite respuestas hasta ese día."
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
