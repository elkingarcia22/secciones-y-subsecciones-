import * as React from "react";
import { Move } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { depthLabel } from "./surveyBuilderTypes";
import type { SectionTreeEntry } from "./sectionTree";

interface MoveToPopoverProps {
  /** What is being moved, for the trigger tooltip and popover title. */
  subjectLabel: string;
  /** Valid destinations, in tree order. Shown exactly as passed. */
  destinations: readonly SectionTreeEntry[];
  /** Runs with the destination's section id when one is picked. */
  onMove: (targetId: string) => void;
  /** Extra classes for the trigger, e.g. a hover-reveal like the row's own
   * delete button. */
  triggerClassName?: string;
}

/**
 * The floating "Mover a…" picker that sits beside a row's delete button. It
 * lists every section or subsection the item can be moved into (pre-validated
 * by the caller) and hands the chosen destination back up. Disabled — with an
 * explanatory tooltip — when there is nowhere to move it to.
 */
export function MoveToPopover({
  subjectLabel,
  destinations,
  onMove,
  triggerClassName,
}: MoveToPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const hasDestinations = destinations.length > 0;

  const trigger = (
    <button
      type="button"
      disabled={!hasDestinations}
      aria-label={`Mover ${subjectLabel}`}
      onClick={(event) => {
        // The row's header select (and the question's own open handler) sit on
        // a parent that would otherwise swallow this click before the popover.
        event.stopPropagation();
        setOpen(true);
      }}
      className={cn(
        "shrink-0 rounded-lg p-1.5 text-muted-foreground/60 transition-all",
        "hover:bg-primary/10 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground/60",
        triggerClassName
      )}
    >
      <Move className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {hasDestinations ? (
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="bottom">
            No hay otra sección o subsección donde moverla
          </TooltipContent>
        </Tooltip>
      )}

      <PopoverContent side="bottom" align="end" sideOffset={6} className="w-72 rounded-xl p-3">
        <PopoverTitle className="text-[13px] font-semibold text-text-primary">
          Mover {subjectLabel.toLowerCase()}
        </PopoverTitle>

        <div className="my-3 h-px bg-border/60" />

        <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto pr-0.5">
          {destinations.map((destination) => (
            <li key={destination.section.id}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onMove(destination.section.id);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {/* Indent mirrors the tree so depth reads without a label. */}
                <span
                  className="shrink-0 rounded-md bg-border/40 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-text-secondary"
                  style={{ marginLeft: `${(destination.depth - 1) * 14}px` }}
                >
                  {destination.numbering}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-text-primary">
                  {destination.section.title || `${depthLabel(destination.depth)} ${destination.numbering}`}
                </span>
                <span className="shrink-0 text-[10px] font-semibold text-muted-foreground/70">
                  {depthLabel(destination.depth)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
