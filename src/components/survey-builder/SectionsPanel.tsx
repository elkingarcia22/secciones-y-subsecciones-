import * as React from "react";
import {
  Check,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDragReorder } from "@/hooks/useDragReorder";
import { SectionTreeItem } from "./SectionTreeItem";
import { expandedEntries, findSection } from "./sectionTree";
import type { BuilderSelection, SurveySection } from "./surveyBuilderTypes";
import {
  OPTIONAL_STEPS,
  REQUIRED_STEPS,
  STEPPER_ORDER,
  getStepState,
  isStepComplete,
  stepFromSelection,
  stepNumber,
  type StepState,
  type StepperStatusInput,
  type StepperStepId,
} from "./stepper";

interface SectionsPanelProps {
  sections: readonly SurveySection[];
  selection: BuilderSelection;
  /** Shared with the main panel: one open branch, the same one on both sides. */
  expandedIds: ReadonlySet<string>;
  renamingId: string | null;
  /** Collapsed panels become a narrow rail of step markers. */
  isCollapsed: boolean;
  /** A step in this set is incomplete — highlighted red, overriding its state's
   * usual color, after a failed finalize attempt. */
  errorSteps?: ReadonlySet<StepperStepId>;
  onToggleCollapsed: () => void;
  stepInput: StepperStatusInput;
  onSelectStep: (step: StepperStepId) => void;
  onSelect: (selection: BuilderSelection) => void;
  onReorderSections: (fromId: string, toId: string) => void;
  onToggleExpanded: (id: string) => void;
  onStartRename: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onCancelRename: () => void;
  onAddSubsection: (parentId: string) => void;
  onDeleteSection: (id: string) => void;
}

const STEP_LABELS: Readonly<Record<StepperStepId, string>> = {
  general: "Datos generales",
  demographics: "Datos demográficos",
  sections: "Secciones y preguntas",
  participants: "Participantes",
  pages: "Bienvenida y cierre",
};

/**
 * The circle that carries a step's state: its number while it is reachable, a
 * check once done, a padlock while it is not. Optional steps have no number,
 * so they show a dot — a hollow marker rather than a borrowed position.
 */
function StepMarker({ step, state, hasError }: { step: StepperStepId; state: StepState; hasError?: boolean }) {
  const number = stepNumber(step);

  return (
    <span
      aria-hidden
      className={cn(
        "z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-all",
        hasError && "bg-destructive/15 text-destructive ring-1 ring-destructive/30",
        !hasError && state === "active" && "bg-primary text-primary-foreground",
        !hasError && state === "complete" && "bg-status-positive/15 text-status-positive",
        !hasError && state === "available" && "bg-border/50 text-text-secondary",
        !hasError && state === "locked" && "bg-border/40 text-muted-foreground/60"
      )}
    >
      {state === "locked" ? (
        <Lock className="h-3.5 w-3.5" strokeWidth={2.3} />
      ) : state === "complete" ? (
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      ) : number !== null ? (
        number
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
    </span>
  );
}

interface StepperRowProps {
  step: StepperStepId;
  state: StepState;
  /** Draws the connector down to the next step in the group. */
  hasNext: boolean;
  hasError?: boolean;
  onSelect: () => void;
}

/** One stepper row: marker on a connector line, label after it. */
function StepperRow({ step, state, hasNext, hasError, onSelect }: StepperRowProps) {
  const isLocked = state === "locked";

  return (
    <li className="relative">
      {/* Connector sits behind the markers and stops before the next one, so
          the line reads as a path rather than a border on the row. */}
      {hasNext && (
        <span
          aria-hidden
          className="absolute left-[22px] top-8 h-[calc(100%-1rem)] w-px bg-border"
        />
      )}

      <button
        type="button"
        onClick={isLocked ? undefined : onSelect}
        disabled={isLocked}
        aria-current={state === "active" ? "step" : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          state === "active" && "bg-primary/10",
          !isLocked && state !== "active" && "hover:bg-surface-muted",
          isLocked && "cursor-not-allowed"
        )}
      >
        <StepMarker step={step} state={state} hasError={hasError} />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] tracking-tight transition-colors",
            state === "active" && "font-semibold text-primary",
            state === "complete" && "font-medium text-text-primary",
            hasError && "font-medium text-destructive",
            state === "available" && "font-medium text-text-primary",
            state === "locked" && "font-medium text-muted-foreground/70"
          )}
        >
          {STEP_LABELS[step]}
        </span>
      </button>
    </li>
  );
}

/** Collapsed rail: just the markers, still on their connector. */
function RailStep({
  step,
  state,
  hasNext,
  hasError,
  onSelect,
}: StepperRowProps) {
  const isLocked = state === "locked";

  return (
    <div className="relative flex justify-center">
      {hasNext && (
        <span aria-hidden className="absolute left-1/2 top-7 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-border" />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={isLocked ? undefined : onSelect}
            disabled={isLocked}
            aria-label={STEP_LABELS[step]}
            aria-current={state === "active" ? "step" : undefined}
            className="rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed enabled:active:scale-95"
          >
            <StepMarker step={step} state={state} hasError={hasError} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[220px]">
          {STEP_LABELS[step]}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

/**
 * Left menu as a stepper, split into what the survey requires and what it
 * merely allows.
 *
 * The numbered group is a path: each step unlocks when the previous one is
 * done. The optional group is not gated at all — the two pages there can be
 * visited, skipped, or switched off from their own editors.
 *
 * The sections tree unfolds under "Secciones y preguntas" while that step is
 * active, and steps out of the way otherwise.
 */
export function SectionsPanel({
  sections,
  selection,
  expandedIds,
  renamingId,
  isCollapsed,
  errorSteps,
  onToggleCollapsed,
  stepInput,
  onSelectStep,
  onSelect,
  onReorderSections,
  onToggleExpanded,
  onStartRename,
  onRename,
  onCancelRename,
  onAddSubsection,
  onDeleteSection,
}: SectionsPanelProps) {
  const { draggingId, overId, getHandleProps, getDropTargetProps } = useDragReorder(onReorderSections);

  const visibleEntries = React.useMemo(
    () => expandedEntries(sections, expandedIds),
    [sections, expandedIds]
  );

  // A drop is only valid between two rows that share the same parent — moving
  // a row into a different level would silently reparent it, which isn't
  // reordering. Root sections (parentId null) reorder the same way.
  const draggingParentId = draggingId ? findSection(sections, draggingId)?.parentId ?? null : null;

  /** Only one root section left means deleting it would empty the survey. */
  const canDeleteRoot = sections.length > 1;

  const activeStep = stepFromSelection(selection);
  const stateOf = (step: StepperStepId) => getStepState(step, stepInput, activeStep);
  // A step's error styling applies whenever it landed in errorSteps AND it is
  // still incomplete — once the author fixes it, the green complete state
  // takes over and the red fades naturally.
  const hasError = (step: StepperStepId) =>
    errorSteps?.has(step) === true && !isStepComplete(step, stepInput);

  if (isCollapsed) {
    return (
      <aside className="flex w-[52px] shrink-0 flex-col items-center gap-3 self-start overflow-y-auto rounded-2xl border border-border/50 bg-surface p-2 py-3 shadow-card max-h-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Expandir menú"
              className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/70 transition-all hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
            >
              <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={2.3} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Expandir menú</TooltipContent>
        </Tooltip>

        {/* Required and optional stay visually separate here too: the connector
            runs through the numbered path and stops before the divider. */}
        <div className="flex w-full flex-col gap-3">
          {REQUIRED_STEPS.map((step, index) => (
            <RailStep
              key={step}
              step={step}
              state={stateOf(step)}
              hasError={hasError(step)}
              hasNext={index < REQUIRED_STEPS.length - 1}
              onSelect={() => onSelectStep(step)}
            />
          ))}
        </div>

        <div className="mx-auto h-px w-6 shrink-0 bg-border/60" />

        <div className="flex w-full flex-col gap-3">
          {OPTIONAL_STEPS.map((step) => (
            <RailStep
              key={step}
              step={step}
              state={stateOf(step)}
              hasError={hasError(step)}
              hasNext={false}
              onSelect={() => onSelectStep(step)}
            />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-[288px] shrink-0 flex-col self-start overflow-y-auto rounded-2xl border border-border/50 bg-surface p-2 shadow-card max-h-full">
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label="Contraer menú"
        className="mb-0.5 flex h-8 w-8 items-center justify-center self-end rounded-xl text-muted-foreground/70 transition-all hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
      >
        <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={2.3} />
      </button>

      <ul className="flex flex-col gap-1">
        {STEPPER_ORDER.map((step, index) => (
          <React.Fragment key={step}>
            <StepperRow
              step={step}
              state={stateOf(step)}
              hasError={hasError(step)}
              hasNext={index < STEPPER_ORDER.length - 1 && !(step === "sections" && activeStep === "sections")}
              onSelect={() => onSelectStep(step)}
            />

            {step === "sections" && activeStep === "sections" && (
              <li className="ml-[22px] border-l border-border pl-3">
                <ul className="flex flex-col gap-0.5 py-1">
                  {visibleEntries.map((entry) => {
                    const { id } = entry.section;
                    const isValidTarget =
                      draggingId !== null && draggingId !== id && entry.parentId === draggingParentId;

                    return (
                      <SectionTreeItem
                        key={id}
                        entry={entry}
                        isActive={selection.kind === "section" && selection.id === id}
                        isCollapsed={!expandedIds.has(id)}
                        isDragging={draggingId === id}
                        isDropTarget={overId === id && isValidTarget}
                        isRenaming={renamingId === id}
                        canDelete={entry.depth > 1 || canDeleteRoot}
                        onSelect={() => onSelect({ kind: "section", id })}
                        onToggleCollapse={() => onToggleExpanded(id)}
                        onStartRename={() => onStartRename(id)}
                        onRename={(title) => onRename(id, title)}
                        onCancelRename={onCancelRename}
                        onAddSubsection={() => onAddSubsection(id)}
                        onDelete={() => onDeleteSection(id)}
                        handleProps={getHandleProps(id)}
                        dropTargetProps={getDropTargetProps(id)}
                      />
                    );
                  })}
                </ul>
              </li>
            )}
          </React.Fragment>
        ))}
      </ul>
    </aside>
  );
}
