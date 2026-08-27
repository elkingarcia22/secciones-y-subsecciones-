import * as React from "react";
import { BadgeCheck, BookPlus, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { demographicTypeLabel } from "./demographics";
import { RowVisibilityToggle } from "./demographicVisibility";
import { InlineDeleteConfirm } from "./InlineDeleteConfirm";
import type { DemographicField } from "./surveyBuilderTypes";

interface DemographicCardProps {
  field: DemographicField;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onOpen: () => void;
  onRemove: () => void;
  /** Whether the field's wording already lives in the module library. */
  savedInLibrary: boolean;
  onSaveToModule: () => void;

  handleProps: React.HTMLAttributes<HTMLElement> & { draggable: true };
  dropTargetProps: React.HTMLAttributes<HTMLElement>;
}

/**
 * A demographic at rest: one row of the list, built to read the same as a
 * question row so the two lists feel like one product.
 *
 * Only ever renders custom or ask-only fields — anything preloadable lives in
 * its own toggle section instead, so there is nothing here to decide about
 * beyond opening it, reordering it, saving it to the module, or removing it.
 */
export function DemographicCard({
  field,
  index,
  isDragging,
  isDropTarget,
  onOpen,
  onRemove,
  savedInLibrary,
  onSaveToModule,

  handleProps,
  dropTargetProps,
}: DemographicCardProps) {
  const [isConfirmingRemove, setIsConfirmingRemove] = React.useState(false);

  if (isConfirmingRemove) {
    return (
      <li className="bg-surface px-2.5 py-2">
        <InlineDeleteConfirm
          ariaLabel={`Confirmar eliminación del dato demográfico ${index + 1}`}
          message="Se eliminará este dato demográfico. Esta acción no se puede deshacer."
          onCancel={() => setIsConfirmingRemove(false)}
          onConfirm={onRemove}
        />
      </li>
    );
  }

  return (
    <li
      {...dropTargetProps}
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
        aria-label={`Reordenar dato demográfico ${index + 1}`}
        className="shrink-0 rounded-md p-0.5 text-muted-foreground/30 transition-colors cursor-grab hover:text-text-primary group-hover:text-muted-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>

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
            field.label ? "text-text-primary" : "text-muted-foreground/70"
          )}
        >
          {field.label || "Sin enunciado"}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80">
          {demographicTypeLabel(field.type)} · {field.options.length} opciones
          {!field.required && <span className="text-muted-foreground/60">· Opcional</span>}
        </span>
      </button>

      <SaveToModuleButton
        saved={savedInLibrary}
        disabled={field.label.trim() === ""}
        onSave={onSaveToModule}
      />



      <button
        type="button"
        onClick={() => setIsConfirmingRemove(true)}
        aria-label={`Eliminar dato demográfico ${index + 1}`}
        className={cn(
          "shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all",
          "hover:bg-status-negative/10 hover:text-status-negative",
          "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30",
          "group-hover:opacity-100"
        )}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </li>
  );
}

/**
 * The per-row "guardar en el módulo" action, shared by the custom list rows
 * and the active imported-column rows. It flips to a persistent check once the
 * wording is in the module library, and reveals itself on row hover otherwise.
 */
export function SaveToModuleButton({
  saved,
  disabled = false,
  onSave,
}: {
  saved: boolean;
  disabled?: boolean;
  onSave: () => void;
}) {
  const label = saved
    ? "Ya está guardado para reutilizar"
    : disabled
      ? "Escribe el enunciado para poder guardarlo"
      : "Guardar para reutilizar";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled || saved}
          onClick={onSave}
          aria-label={label}
          className={cn(
            "shrink-0 rounded-lg p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            saved
              ? "cursor-default text-status-positive opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              : [
                  "text-muted-foreground opacity-0",
                  "hover:bg-primary/10 hover:text-primary",
                  "focus-visible:opacity-100 group-hover:opacity-100",
                  disabled && "group-hover:opacity-45 cursor-default hover:bg-transparent hover:text-muted-foreground"
                ]
          )}
        >
          {saved ? (
            <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <BookPlus className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
