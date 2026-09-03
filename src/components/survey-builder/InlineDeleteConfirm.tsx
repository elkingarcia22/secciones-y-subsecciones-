import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface InlineDeleteConfirmProps {
  message: React.ReactNode;
  ariaLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** True when the confirmation replaces a list row that already supplies
   *  its own edges — the pink surface then fills that row edge-to-edge
   *  instead of floating as an inset card with its own rounding. */
  bleed?: boolean;
}

/**
 * The same in-place "are you sure" used everywhere something is about to be
 * removed — a section, a subsection, a question, in its list row or in its
 * open form. It takes over the spot the trigger sat in, the same way the
 * unsaved-changes prompt takes over a question's footer, instead of a modal
 * that dims the whole page for one decision.
 */
export function InlineDeleteConfirm({ message, ariaLabel, onCancel, onConfirm, bleed = false }: InlineDeleteConfirmProps) {
  return (
    <div
      role="alertdialog"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-status-negative/5 px-4 py-3 animate-in fade-in duration-200",
        bleed
          ? // No border of its own: the list around it already draws the
            // divider above/below and the outer frame, so a full border here
            // would double up on top of those lines instead of replacing them.
            undefined
          : "rounded-xl border border-status-negative/30"
      )}
    >
      <p className="min-w-0 text-[13px] leading-relaxed text-text-secondary">{message}</p>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" variant="outline" onClick={onCancel} className="px-4">
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onConfirm}
          className="border border-destructive/40 px-4 font-semibold"
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}
