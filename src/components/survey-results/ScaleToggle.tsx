import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One checkbox row, wearing the color of the thing it selects.
 *
 * Every multi-choice control in the report picks between bands of a scale the
 * reader has been reading in color all along — the roster's "Promedio", the
 * heatmap's "Resaltar", eNPS's own bands. A plain checkbox list says none of
 * that: it makes the reader translate "Desfavorable" back into the red they can
 * already see in the rows. So the box fills with the band's own fill and the
 * selected row takes its pale background, and the control ends up looking like
 * the legend it is.
 *
 * `palette` is optional on purpose: "Niveles" (Secciones, Subsecciones,
 * Preguntas) is the same kind of control over things that carry no color, and it
 * should keep the same row geometry rather than being a second visual language
 * inside the same popover.
 */

export interface ScaleTogglePalette {
  /** Solid fill — the checkbox, and the dot in a legend. */
  color: string | null;
  /** Pale fill for the selected row. */
  background: string;
  border: string;
  /** Text that stays readable on `background`. */
  foreground: string;
}

export interface ScaleToggleOption {
  id: string;
  label: string;
  /** Range as the scale states it, e.g. "2 a 2.9". Right-aligned, optional. */
  range?: string | null;
  /** Absent for a toggle over something with no color of its own. */
  palette?: ScaleTogglePalette | null;
}

interface ScaleToggleProps {
  option: ScaleToggleOption;
  active: boolean;
  onToggle: () => void;
  /** One-of-many rather than many-of-many: the row becomes a radio, not a box. */
  singleChoice?: boolean;
  className?: string;
}

export function ScaleToggle({
  option,
  active,
  onToggle,
  singleChoice = false,
  className,
}: ScaleToggleProps) {
  const palette = option.palette ?? null;
  const fill = palette?.color ?? palette?.border ?? null;

  return (
    <button
      type="button"
      role={singleChoice ? "radio" : "checkbox"}
      aria-checked={active}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-[12px] transition-colors",
        active
          ? // Without a palette there is nothing to tint with, so the selected
            // row falls back to the product's own accent.
            palette
            ? "font-semibold"
            : "border-primary/40 bg-primary/[0.07] font-semibold text-primary"
          : "border-border/60 bg-surface font-medium text-text-primary hover:bg-border/30",
        className
      )}
      style={
        active && palette
          ? {
              backgroundColor: palette.background,
              borderColor: palette.border,
              color: palette.foreground,
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className={cn(
          "flex h-3.5 w-3.5 shrink-0 items-center justify-center border transition-colors",
          singleChoice ? "rounded-full" : "rounded-[4px]",
          !active && "border-border bg-surface",
          active && !palette && "border-primary bg-primary"
        )}
        style={active && fill ? { backgroundColor: fill, borderColor: fill } : undefined}
      >
        {active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.6} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {option.range && (
        <span className="shrink-0 text-[10.5px] tabular-nums opacity-65">{option.range}</span>
      )}
    </button>
  );
}
