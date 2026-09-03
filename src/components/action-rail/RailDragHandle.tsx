import * as React from "react";
import { GripHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRailIsVertical, useRailPopoutSide } from "./railOrientation";

interface RailDragHandleProps {
  isDragging: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onDoubleClick: () => void;
}

/**
 * Grip that shows up whenever the rail is expanded, whether that's because
 * it's pinned open or because auto-hide has it open on hover. Double-click
 * sends the rail back to its bottom-centre dock.
 */
export function RailDragHandle({
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDoubleClick,
}: RailDragHandleProps) {
  const isVertical = useRailIsVertical();
  const side = useRailPopoutSide();
  // The grip's own bars run across the rail, not along it — the same way a
  // handle you would actually grab sits crosswise to the thing it moves.
  const GripIcon = isVertical ? GripHorizontal : GripVertical;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Mover barra de acciones"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onDoubleClick={onDoubleClick}
          style={{ touchAction: "none" }}
          className={cn(
            "dock-item flex h-10 w-10 shrink-0 cursor-grab select-none items-center justify-center rounded-xl text-white/40 transition-colors hover:bg-white/10 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:cursor-grabbing",
            isDragging && "cursor-grabbing bg-white/10 text-white/70"
          )}
        >
          <GripIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>Arrastra para mover · doble clic para volver a su sitio</TooltipContent>
    </Tooltip>
  );
}
