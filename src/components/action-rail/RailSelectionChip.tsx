import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRailIsVertical, useRailPopoutSide } from "./railOrientation";

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
 *
 * Standing upright there is no room for the sentence, so the count becomes a
 * badge and the wording moves into its tooltip — the number is the part
 * someone is actually reading off the bar.
 */
export function RailSelectionChip({
  count,
  onClear,
  gender = "f",
  className,
}: RailSelectionChipProps) {
  const noun = gender === "f" ? "seleccionada" : "seleccionado";
  const isVertical = useRailIsVertical();
  const side = useRailPopoutSide();
  const readout = count === 1 ? `1 ${noun}` : `${count} ${noun}s`;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isVertical ? "flex-col px-0 py-1" : "px-1",
        className
      )}
    >
      {isVertical ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-white/10 px-1.5 text-[13px] font-bold tabular-nums text-white">
              {count}
            </span>
          </TooltipTrigger>
          <TooltipContent side={side}>{readout}</TooltipContent>
        </Tooltip>
      ) : (
        <span className="whitespace-nowrap text-[13px] font-semibold text-white">{readout}</span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpiar selección"
            className="dock-item relative flex h-8 w-8 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side}>Limpiar selección</TooltipContent>
      </Tooltip>
    </div>
  );
}
