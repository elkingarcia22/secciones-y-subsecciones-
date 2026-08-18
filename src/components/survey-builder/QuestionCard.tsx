import * as React from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineDeleteConfirm } from "./InlineDeleteConfirm";
import { MoveToPopover } from "./MoveToPopover";
import { questionTypeLabel, scaleTypeLabel } from "./questionCatalog";
import type { SectionTreeEntry } from "./sectionTree";
import type { SurveyQuestion } from "./surveyBuilderTypes";

interface QuestionCardProps {
  question: SurveyQuestion;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onOpen: () => void;
  onRemove: () => void;
  /** Everywhere this question could be moved to, for the row's "Mover a…". */
  moveDestinations: readonly SectionTreeEntry[];
  /** Runs with the destination's section id when a destination is picked. */
  onMove: (targetId: string) => void;
  handleProps: React.HTMLAttributes<HTMLElement> & { draggable: true };
  dropTargetProps: React.HTMLAttributes<HTMLElement>;
}

/**
 * A question at rest: one row of the section's list, deliberately flatter than
 * a subsection shell so content never gets mistaken for structure. Clicking it
 * swaps the row for the full editor.
 */
export function QuestionCard({
  question,
  index,
  isDragging,
  isDropTarget,
  onOpen,
  onRemove,
  moveDestinations,
  onMove,
  handleProps,
  dropTargetProps,
}: QuestionCardProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = React.useState(false);

  // A scale question is better identified by its scale than by the generic
  // "Escala de valoración" — that's the choice the author actually made.
  const typeLabel =
    question.type === "scale" && question.scale.kind
      ? scaleTypeLabel(question.scale.kind)
      : questionTypeLabel(question.type);

  // Dropping onto a row whose own delete banner is up would reorder a list the
  // author can't see the whole of, so drag targets are off then.
  const dragProps = isConfirmingRemove ? {} : dropTargetProps;

  if (isConfirmingRemove) {
    return (
      <li className="bg-surface px-2.5 py-2">
        <InlineDeleteConfirm
          ariaLabel={`Confirmar eliminación de la pregunta ${index + 1}`}
          message="Se eliminará esta pregunta. Esta acción no se puede deshacer."
          onCancel={() => setIsConfirmingRemove(false)}
          onConfirm={onRemove}
        />
      </li>
    );
  }

  return (
    <li
      {...dragProps}
      className={cn(
        "group relative flex items-center gap-2.5 bg-surface pl-2 pr-2.5 transition-all",
        "hover:bg-border/20 focus-within:bg-border/20",
        isDragging && "opacity-40",
        isDropTarget &&
          "before:absolute before:-top-px before:left-0 before:right-0 before:z-10 before:h-0.5 before:rounded-full before:bg-primary before:content-['']"
      )}
    >
      <span
        {...handleProps}
        aria-label={`Reordenar pregunta ${index + 1}`}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground/30 transition-colors cursor-grab hover:text-text-primary group-hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>

      {/* Number gutter: a question is an item in a list, not a nested block. */}
      <span
        aria-hidden
        className="w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground/60"
      >
        {index + 1}
      </span>

      <button
        type="button"
        onClick={onOpen}
        data-click-outside-ignore
        className="min-w-0 flex-1 py-3 text-left outline-none focus-visible:underline"
      >
        <span
          className={cn(
            "block truncate text-[13px] font-medium",
            question.statement ? "text-text-primary" : "text-muted-foreground/70"
          )}
        >
          {question.statement || "Sin enunciado"}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-muted-foreground/80">
          {typeLabel}
          {!question.required && <span className="text-muted-foreground/60">· Opcional</span>}
        </span>
      </button>

      {/* "Mover a…" alongside the delete: the popover lists every other
          section that can hold questions, across the whole tree. */}
      <MoveToPopover
        subjectLabel={`pregunta ${index + 1}`}
        destinations={moveDestinations}
        onMove={onMove}
        triggerClassName="opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
      />

      <button
        type="button"
        onClick={() => setIsConfirmingRemove(true)}
        aria-label={`Eliminar pregunta ${index + 1}`}
        className={cn(
          "shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all",
          "hover:bg-status-negative/10 hover:text-status-negative",
          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30",
          "group-hover:opacity-100"
        )}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2.2} />
      </button>
    </li>
  );
}
