import * as React from "react";
import {
  Check,
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
import { motion, AnimatePresence } from "framer-motion";

interface SectionsPanelProps {
  readOnly?: boolean;
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
    <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface">
      {/* Ripple effect when completing a step */}
      {state === "complete" && !hasError && (
        <motion.div
          className="absolute inset-0 rounded-full bg-status-positive/40"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      )}

      <span
        aria-hidden
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors duration-500",
          hasError && "bg-destructive/15 text-destructive ring-1 ring-destructive/30",
          !hasError && state === "active" && "bg-primary text-primary-foreground",
          !hasError && state === "complete" && "bg-status-positive/15 text-status-positive",
          !hasError && state === "available" && "bg-border/50 text-text-secondary",
          !hasError && state === "locked" && "bg-border/40 text-muted-foreground/60"
        )}
      >
        <AnimatePresence initial={false}>
          {state === "complete" ? (
            <motion.div
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M20 6L9 17L4 12"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                />
              </svg>
            </motion.div>
          ) : number !== null ? (
            <motion.span
              key="number"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {number}
            </motion.span>
          ) : (
            <motion.span
              key="dot"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
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
          "relative flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          !isLocked && state !== "active" && "hover:bg-surface-muted",
          isLocked && "cursor-not-allowed"
        )}
      >
        {state === "active" && (
          <motion.div
            layoutId="active-stepper-bg"
            className="absolute inset-0 rounded-xl bg-primary/10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <StepMarker step={step} state={state} hasError={hasError} />
        <span
          className={cn(
            "relative z-10 min-w-0 flex-1 truncate text-[13px] tracking-tight transition-colors duration-300",
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
  readOnly,
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

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col self-start overflow-y-auto overflow-x-hidden rounded-2xl border border-border/60 bg-surface shadow-card max-h-full",
        "transition-[width] duration-500 ease-in-out",
        isCollapsed ? "w-[54px] p-2 py-3 scrollbar-none" : "w-[288px] p-2"
      )}
    >
      {/* ── Header: title collapses its own width, button stays centered ── */}
      <div className="mb-2 flex h-9 shrink-0 items-center justify-between pr-1 pt-1.5">
        {/* h2 collapses to width:0 — no flex-1, so button stays centered */}
        <h2
          className="overflow-hidden whitespace-nowrap text-[13px] font-semibold text-text-secondary"
          style={{
            maxWidth: isCollapsed ? 0 : "200px",
            opacity: isCollapsed ? 0 : 1,
            transition: "max-width 0.5s ease-in-out, opacity 0.25s ease-in-out",
            pointerEvents: isCollapsed ? "none" : undefined,
          }}
        >
          Pasos de creación
        </h2>

        {/* Toggle button — always visible, centered when collapsed */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={isCollapsed ? "Expandir menú" : "Contraer menú"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground/70 transition-all hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95"
            >
              <motion.span
                animate={{ rotate: isCollapsed ? 0 : 180 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={2} />
              </motion.span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isCollapsed ? "Expandir menú" : "Contraer menú"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── Stepper rows — single DOM tree, always rendered ── */}
      <ul className="flex flex-col gap-1">
        {STEPPER_ORDER.map((step, index) => {
          const state = stateOf(step);
          const err = hasError(step);
          const isLocked = state === "locked";

          return (
            <React.Fragment key={step}>
              <li className="relative w-full">
                {/* Connector line */}
                {index < STEPPER_ORDER.length - 1 &&
                  !(step === "sections" && activeStep === "sections" && !isCollapsed) && (
                    <span
                      aria-hidden
                      className="absolute top-8 h-[calc(100%-1rem)] w-px bg-border"
                      style={{
                        // Marker center: collapsed has no button padding, so it's
                        // just the marker's own half-width (14px); expanded adds
                        // the button's 8px left padding on top of that (8+14=22px).
                        left: isCollapsed ? "14px" : "22px",
                        transition: "left 0.5s ease-in-out",
                      }}
                    />
                  )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={isLocked ? undefined : () => onSelectStep(step)}
                      disabled={isLocked}
                      aria-current={state === "active" ? "step" : undefined}
                      className={cn(
                        "group relative flex w-full items-center rounded-xl py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        // Collapsed: hover lands on the marker itself (below),
                        // not this whole row — a rounded-xl box behind a lone
                        // circle reads as a stray highlight, not a hover.
                        !isLocked && state !== "active" && !isCollapsed && "hover:bg-surface-muted",
                        isLocked && "cursor-not-allowed"
                      )}
                      style={{
                        paddingLeft: isCollapsed ? 0 : "8px",
                        paddingRight: isCollapsed ? 0 : "8px",
                        transition: "padding 0.5s ease-in-out",
                      }}
                    >
                      {state === "active" && !isCollapsed && (
                        <motion.div
                          layoutId="active-stepper-bg"
                          className="absolute inset-0 rounded-xl bg-primary/10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}

                      {/* Collapsed hover: a halo centered on the marker
                          (left: 14px = the marker's own center, same math as
                          the connector line) instead of the row background. */}
                      {isCollapsed && !isLocked && state !== "active" && (
                        <span
                          aria-hidden
                          className="absolute top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors group-hover:bg-surface-muted"
                          style={{ left: "14px" }}
                        />
                      )}

                      <StepMarker step={step} state={state} hasError={err} />

                      {/* Label — collapses max-width to 0 so marker stays at left:8px centered */}
                      <span
                        className={cn(
                          "relative z-10 overflow-hidden whitespace-nowrap text-[13px] tracking-tight",
                          state === "active" && "font-semibold text-primary",
                          state === "complete" && "font-medium text-text-primary",
                          err && "font-medium text-destructive",
                          state === "available" && "font-medium text-text-primary",
                          state === "locked" && "font-medium text-muted-foreground/70"
                        )}
                        style={{
                          maxWidth: isCollapsed ? 0 : "200px",
                          opacity: isCollapsed ? 0 : 1,
                          marginLeft: isCollapsed ? 0 : "12px",
                          transition:
                            "max-width 0.5s ease-in-out, opacity 0.2s ease-in-out, margin-left 0.5s ease-in-out",
                          pointerEvents: isCollapsed ? "none" : undefined,
                        }}
                      >
                        {STEP_LABELS[step]}
                      </span>
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="max-w-[220px]">
                      {STEP_LABELS[step]}
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>

              {/* Section tree — CSS height transition */}
              <AnimatePresence initial={false}>
                {!isCollapsed && step === "sections" && activeStep === "sections" && (
                  <motion.li
                    key="section-tree"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="ml-[22px] overflow-hidden border-l border-border pl-3"
                  >
                    <ul className="flex flex-col gap-0.5 py-1">
                      {visibleEntries.map((entry) => {
                        const { id } = entry.section;
                        const isValidTarget =
                          draggingId !== null &&
                          draggingId !== id &&
                          entry.parentId === draggingParentId;
                        return (
                          <SectionTreeItem
                            key={id}
                            entry={entry}
                            readOnly={readOnly}
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
                  </motion.li>
                )}
              </AnimatePresence>
            </React.Fragment>
          );
        })}
      </ul>
    </aside>
  );
}
