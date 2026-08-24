import * as React from "react";
import { cn } from "@/lib/utils";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { SURVEY_STATUS_LABELS, type SurveyStatus } from "./surveyBuilderTypes";
import type { AutosaveState } from "@/hooks/useAutosave";

interface BuilderIdentityProps {
  name: string;
  status: SurveyStatus;
  autosave: AutosaveState;
  onNameChange: (name: string) => void;
}

/** Tone per lifecycle state. Draft is deliberately the quietest. */
const STATUS_TONE: Readonly<Record<SurveyStatus, string>> = {
  draft: "bg-surface-muted text-text-secondary",
  scheduled: "bg-status-info/10 text-status-info",
  live: "bg-status-positive/10 text-status-positive",
  closed: "bg-border/40 text-muted-foreground",
};

/**
 * What you are editing, rendered into the app shell's breadcrumb.
 *
 * The survey's name *is* the current crumb — the builder is not a separate
 * "create" screen with a generic heading, it is this survey — so it is editable
 * in place at the crumb's own scale, with the lifecycle chip and autosave
 * status trailing it as attributes of that title.
 */
export function BuilderIdentity({ name, status, autosave, onNameChange }: BuilderIdentityProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Grow the field to fit its text so the status chip sits right after the name
  // instead of after a fixed-width box.
  const [width, setWidth] = React.useState(0);
  const measureRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    if (measureRef.current) setWidth(measureRef.current.offsetWidth);
  }, [name]);

  return (
    <>
      {/* Off-screen twin that measures the text the input has to fit. */}
      <span
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute whitespace-pre text-sm font-semibold"
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
        style={{ width: `${Math.min(width + 18, 420)}px` }}
        className="min-w-[110px] max-w-full cursor-text truncate rounded-md bg-transparent px-1.5 py-1 text-sm font-semibold text-text-primary outline-none transition-colors hover:bg-surface-muted focus:bg-surface-muted placeholder:text-text-muted"
      />

      <span
        className={cn(
          "inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-[11px] font-bold leading-none",
          STATUS_TONE[status]
        )}
      >
        {SURVEY_STATUS_LABELS[status]}
      </span>

      <AutosaveIndicator {...autosave} />
    </>
  );
}
