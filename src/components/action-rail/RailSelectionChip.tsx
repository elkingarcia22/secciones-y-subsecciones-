import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RailSelectionChipProps {
  count: number;
  /** Drops the tick marks without touching the rows. */
  onClear: () => void;
  /**
   * Grammatical gender of the thing being counted, so the label reads
   * "3 seleccionadas" for encuestas and "3 seleccionados" for colaboradores.
   */
  gender?: "f" | "m";
  className?: string;
}

/**
 * "N seleccionadas ✕" — the selection readout every floating rail shows while
 * a table has rows ticked.
 *
 * It exists as one component rather than three copies because it answers two
 * questions the icon-only rails otherwise leave implicit: how many rows the
 * next action will hit, and how to get back out of the selection without
 * hunting for the checkbox that started it.
 */
export function RailSelectionChip({
  count,
  onClear,
  gender = "f",
  className,
}: RailSelectionChipProps) {
  const noun = gender === "f" ? "seleccionada" : "seleccionado";

  return (
    <div className={cn("flex items-center gap-2 px-1", className)}>
      <span className="whitespace-nowrap text-[13px] font-semibold text-white">
        {count === 1 ? `1 ${noun}` : `${count} ${noun}s`}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpiar selección"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">Limpiar selección</TooltipContent>
      </Tooltip>
    </div>
  );
}
