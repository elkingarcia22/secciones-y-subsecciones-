import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScaleToggle } from "./ScaleToggle";
import { CONFIDENCE_ORDER, CONFIDENCE_STYLES, type InsightConfidence } from "./insightConfidence";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/** Which confidence bands the reader is keeping, as one piece of state. */
export interface ConfidenceFilterState {
  levels: ReadonlySet<InsightConfidence>;
  toggle: (level: InsightConfidence) => void;
  reset: () => void;
  /** Whether anything at all is being left out. */
  isNarrowed: boolean;
}

export function useConfidenceFilter(): ConfidenceFilterState {
  const [levels, setLevels] = React.useState<ReadonlySet<InsightConfidence>>(
    () => new Set(CONFIDENCE_ORDER)
  );

  const toggle = React.useCallback((level: InsightConfidence) => {
    setLevels((current) => {
      const next = new Set(current);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      // Nothing selected shows nothing, which is never what the click meant:
      // unchecking the last band reads as "quiero verlo todo otra vez".
      return next.size === 0 ? new Set(CONFIDENCE_ORDER) : next;
    });
  }, []);

  const reset = React.useCallback(() => setLevels(new Set(CONFIDENCE_ORDER)), []);

  return {
    levels,
    toggle,
    reset,
    isNarrowed: levels.size < CONFIDENCE_ORDER.length,
  };
}

/**
 * "Confiabilidad" — the one filter this tab needs.
 *
 * The three kinds of claim already have their own accordion, so a switch over
 * them was a second way of doing what the outline does. What the outline
 * *cannot* do is separate the claims resting on a figure from the ones resting
 * on an inference, and that is the only question a reader asks of an AI reading:
 * *show me what is solid*. Same trigger, same popover and same colored
 * checkboxes the comment filters use, over the bands the legend explains.
 */
export function InsightConfidenceFilter({
  filter,
  counts,
}: {
  filter: ConfidenceFilterState;
  counts: Readonly<Record<InsightConfidence, number>>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 justify-start gap-2 rounded-lg border-border bg-surface px-3 text-[12.5px] text-text-primary transition-colors hover:bg-border/30"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
          Confiabilidad
          {filter.isNarrowed && (
            <Badge variant="neutral" className="h-4.5 min-w-[18px] justify-center px-1 text-[10.5px]">
              {filter.levels.size}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[290px] p-0">
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-0.5">
            <PopoverTitle className="text-[13px]">Filtrar por confiabilidad</PopoverTitle>
            <PopoverDescription className="text-[12px] leading-relaxed">
              Deja solo las lecturas que se apoyan en el tipo de evidencia que quieres leer.
            </PopoverDescription>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border/30 pt-3">
            {CONFIDENCE_ORDER.map((id) => {
              const style = CONFIDENCE_STYLES[id];
              return (
                <ScaleToggle
                  key={id}
                  option={{
                    id,
                    label: style.label,
                    range: formatCount(counts[id]),
                    palette: {
                      color: style.color,
                      background: style.background,
                      border: style.border,
                      foreground: style.foreground,
                    },
                  }}
                  active={filter.levels.has(id)}
                  onToggle={() => filter.toggle(id)}
                />
              );
            })}
          </div>

          {filter.isNarrowed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={filter.reset}
              className="justify-start rounded-none border-t border-border/30 px-0 pb-1 pt-3 text-[12px] text-primary hover:bg-transparent hover:underline"
            >
              Ver todas las lecturas
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
