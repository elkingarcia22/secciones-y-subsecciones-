import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { SURVEY_STATUS_LABELS, type SurveyStatus } from "./surveyBuilderTypes";
import type { AutosaveState } from "@/hooks/useAutosave";

interface BuilderTopBarProps {
  name: string;
  status: SurveyStatus;
  autosave: AutosaveState;
  onNameChange: (name: string) => void;
  onExit: () => void;
}

/** Tone per lifecycle state. Draft is deliberately the quietest. */
const STATUS_TONE: Readonly<Record<SurveyStatus, string>> = {
  draft: "bg-border/40 text-text-secondary",
  scheduled: "bg-status-info/10 text-status-info",
  live: "bg-status-positive/10 text-status-positive",
  closed: "bg-border/40 text-muted-foreground",
};

/**
 * Top identity bar: what you are editing on the left, what you can do with it
 * on the right.
 *
 * The title is the survey's own name, editable in place — the builder is not a
 * separate "create" screen with a generic heading, it is this survey.
 */
export function BuilderTopBar({
  name,
  status,
  autosave,
  onNameChange,
  onExit,
}: BuilderTopBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Grow the field to fit its text so the status chip and autosave line sit
  // right after the name instead of after a fixed-width box.
  const [width, setWidth] = React.useState(0);
  const measureRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    if (measureRef.current) setWidth(measureRef.current.offsetWidth);
  }, [name]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-3 pt-2 pb-1 relative z-10">
      <div className="flex min-w-0 items-center gap-3">
        {/* Off-screen twin that measures the text the input has to fit. */}
        <span
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute whitespace-pre text-base font-bold tracking-tight"
        >
          {name || "Encuesta sin título"}
        </span>

        <input
          ref={inputRef}
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && inputRef.current?.blur()}
          placeholder="Encuesta sin título"
          aria-label="Nombre de la encuesta"
          style={{ width: `${Math.min(width + 20, 520)}px` }}
          className="min-w-[120px] max-w-full truncate cursor-text rounded-md bg-transparent px-2 py-0.5 text-base font-bold tracking-tight text-text-primary outline-none transition-colors hover:bg-surface hover:shadow-sm focus:bg-surface focus:shadow-sm placeholder:text-muted-foreground/70"
        />

        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-[11.5px] font-bold shadow-sm",
            STATUS_TONE[status]
          )}
        >
          {SURVEY_STATUS_LABELS[status]}
        </span>

        <AutosaveIndicator {...autosave} />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="h-9 gap-2 rounded-full px-4 text-[13px] font-bold text-text-secondary bg-surface shadow-sm hover:bg-status-negative/5 hover:text-status-negative border border-transparent transition-all"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
          Salir
        </Button>
      </div>
    </header>
  );
}
