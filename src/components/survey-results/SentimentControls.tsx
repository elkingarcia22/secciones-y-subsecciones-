import { Sparkles, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Sentiment } from "@/mocks/questionResponses";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "./sentimentScale";

interface SentimentSegmentedControlProps {
  /** What the label says right now — the correction if there is one. */
  value: Sentiment;
  /** What the model originally read, so a correction can be shown and undone. */
  aiValue: Sentiment;
  corrected: boolean;
  onChange: (next: Sentiment) => void;
  onReset: () => void;
}

/**
 * The sentiment label as a three-way switch, set by hand.
 *
 * The model's reading is a *suggestion*, and a suggestion should be one click
 * from being overruled — a menu hid the three options behind a chevron and made
 * correcting a mislabelled comment a two-step decision. So all three stay
 * spelled out, icon and word: on a list where most rows carry the same value,
 * an icon-only switch made the reader decode a thumb to know what it said.
 *
 * Deliberately quiet. It repeats on every row of a long list, so the value in
 * force is a soft tint and the two alternatives are plain grey text — the row's
 * job is to be read, not to host three coloured buttons.
 */
export function SentimentSegmentedControl({
  value,
  aiValue,
  corrected,
  onChange,
  onReset,
}: SentimentSegmentedControlProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <div
        role="radiogroup"
        aria-label="Sentimiento del comentario"
        className="inline-flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/20 p-[3px]"
      >
        {SENTIMENT_ORDER.map((id) => {
          const style = SENTIMENT_STYLES[id];
          const selected = value === id;

          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(id)}
                  style={
                    selected
                      ? { backgroundColor: style.background, color: style.foreground }
                      : undefined
                  }
                  className={cn(
                    "inline-flex h-[22px] items-center gap-1 rounded-md px-2 text-[10.5px] transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    selected
                      ? "font-semibold"
                      : "font-medium text-muted-foreground/70 hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <style.icon className="h-3 w-3 shrink-0" strokeWidth={2.1} />
                  <span className="whitespace-nowrap">{style.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="z-[100] px-2.5 py-1 text-[11px] font-medium">
                {id === aiValue ? `${style.label} · lo que leyó la IA` : `Marcar como ${style.label}`}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {corrected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onReset}
              aria-label="Volver a la lectura de la IA"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Undo2 className="h-3 w-3" strokeWidth={2.2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="z-[100] px-2.5 py-1 text-[11px] font-medium">
            Volver a “{SENTIMENT_STYLES[aiValue].label}”, la lectura de la IA
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

/** How sure the model is, as a bar. Below the floor it asks to be checked. */
export function ConfidenceMeter({ value, low }: { value: number; low: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-semibold tabular-nums",
        low ? "text-status-warning" : "text-muted-foreground"
      )}
      title={
        low
          ? "La IA no está segura de esta lectura: vale la pena revisarla."
          : "Confianza de la IA en esta lectura"
      }
    >
      <Sparkles className="h-2.5 w-2.5" strokeWidth={2.6} />
      {value}%
      <span className="h-1 w-10 overflow-hidden rounded-full bg-muted">
        <span
          className={cn("block h-full rounded-full", low ? "bg-status-warning" : "bg-primary/60")}
          style={{ width: `${value}%` }}
        />
      </span>
    </span>
  );
}
