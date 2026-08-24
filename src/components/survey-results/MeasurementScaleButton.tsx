import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { ScaleLegendItem } from "./favorabilityScale";

interface MeasurementScaleButtonProps {
  items: readonly ScaleLegendItem[];
  /** Heading over the bands. Defaults to the generic "Escala de medición". */
  title?: string;
  /** One line above the bands, for a scale that needs saying what it measures. */
  description?: React.ReactNode;
  className?: string;
}

/**
 * "Escala de medición" as a plain button — icon on the left, label, nothing
 * else — that reveals the band legend on hover instead of expanding a row of
 * pills inline. The scale is reference material, not something that needs to
 * occupy the toolbar's own space once a reader has seen it.
 *
 * `title` and `description` exist because the same chrome explains more than one
 * scale: the sentiment bands in Comentarios, and the 1–5 average each person
 * ends up with in Por persona. A shared button with a swapped legend keeps those
 * reading as one control rather than two.
 */
export function MeasurementScaleButton({
  items,
  title = "Escala de medición",
  description,
  className,
}: MeasurementScaleButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/30 hover:text-text-primary",
              className
            )}
            aria-label={title}
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="end"
          className="max-w-[280px] min-w-[160px] w-auto p-4 bg-slate-900 text-slate-100 shadow-xl border-none z-[100]"
        >
          <div className="flex flex-col gap-3 items-stretch leading-relaxed">
            <div className="text-[11px] font-bold text-slate-100/70 border-b border-slate-700 pb-2 uppercase tracking-wide">
              {title}
            </div>
            {description && (
              <p className="text-[11.5px] font-normal leading-relaxed text-slate-100/75">
                {description}
              </p>
            )}
            <div className="flex flex-col gap-2 w-full">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-6 w-full">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full border"
                      style={{
                        backgroundColor: item.background,
                        borderColor: item.border,
                      }}
                    />
                    <span className="text-[11.5px] font-medium text-slate-100/90">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-normal text-slate-100/60">{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
