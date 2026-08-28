import * as React from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({ value, format }: { value: number, format: (v: number) => React.ReactNode }) {
  // A subtle fade-in and slide-up animation is much cleaner than a number counter for dashboard metrics.
  return (
    <span className="inline-block animate-in fade-in slide-in-from-bottom-1.5 duration-700 ease-out">
      {format(value)}
    </span>
  );
}

/**
 * Pequeña tarjeta con icono, etiqueta y valor, sin barra de progreso.
 *
 * Passing `onClick` turns it into a button — same card, same type, plus an
 * active ring — so a KPI that filters something reads as the identical object
 * to one that only reports. Anything that changed the layout for the clickable
 * variant would make two dialects of the same card.
 */
/** Badge background + icon color for each tone, one step lighter than the
 *  value's own text color so the two read as the same family. */
const TONE_BADGE_CLASSES: Record<
  NonNullable<Parameters<typeof MiniMetricCard>[0]["tone"]> | "default",
  string
> = {
  default: "bg-primary/10 text-primary",
  brand: "bg-primary/10 text-primary",
  positive: "bg-status-positive/10 text-status-positive",
  warning: "bg-status-warning/10 text-status-warning",
  yellow: "bg-[#EAB308]/15 text-[#EAB308]",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-status-negative/10 text-status-negative",
};

export function MiniMetricCard({
  icon: Icon,
  label,
  value,
  tone,
  color,
  bgColor,
  borderColor,
  onClick,
  active = false,
  disabled = false,
  /** "compact" trims padding and the value size for rows with many cards
   *  stacked above other content (the home KPI row) — same anatomy, just
   *  shorter, rather than a second design. */
  size = "default",
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: React.ReactNode;
  tone?: "positive" | "warning" | "yellow" | "neutral" | "negative" | "brand";
  color?: string;
  bgColor?: string;
  borderColor?: string;
  /** Makes the card a button. Omit for a plain readout. */
  onClick?: () => void;
  /** Only meaningful with `onClick`: the narrowing this card applies is on. */
  active?: boolean;
  disabled?: boolean;
  size?: "default" | "compact";
  children?: React.ReactNode;
}) {
  const interactive = onClick !== undefined;
  const Root = (interactive ? "button" : "div") as "button";
  const compact = size === "compact";
  // A custom `color` (a raw CSS color string, not a Tailwind class) tints its
  // own badge instead of falling back to the tone palette — same rule the
  // value text already followed.
  const badgeClasses = color ? undefined : TONE_BADGE_CLASSES[tone ?? "default"];

  return (
    <Root
      type={interactive ? "button" : undefined}
      onClick={onClick}
      disabled={interactive ? disabled : undefined}
      aria-pressed={interactive ? active : undefined}
      className={cn(
        "flex flex-col rounded-2xl border group",
        compact ? "gap-2.5 p-3.5" : "gap-4 p-5",
        !bgColor && !active && "border-border/60 bg-surface",
        active && "border-primary bg-primary/[0.04] shadow-[0_0_0_1px_theme(colors.brand.DEFAULT)]",
        // The same lift the report's other interactive cards use, so a card
        // that reacts to the pointer reacts the way they already do.
        interactive && "text-left transition-transform duration-300",
        interactive && !disabled && "hover:scale-[1.01] hover:shadow-drawer active:scale-[0.99]",
        interactive && disabled && "cursor-default opacity-60"
      )}
      style={{
        backgroundColor: active ? undefined : bgColor,
        borderColor: active ? undefined : borderColor
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-text-primary">
          <span className="truncate">{label}</span>
          {children}
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full transition-colors",
            compact ? "h-7 w-7" : "h-9 w-9",
            badgeClasses
          )}
          style={
            color
              ? {
                  color,
                  backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
                }
              : undefined
          }
        >
          <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} strokeWidth={2} />
        </span>
      </div>
      <span
        className={cn(
          "font-extrabold tabular-nums leading-none",
          compact ? "text-[20px]" : "text-[24px]",
          !color && "text-text-primary",
          !color && tone === "positive" && "text-status-positive",
          !color && tone === "warning" && "text-status-warning",
          !color && tone === "yellow" && "text-[#EAB308]",
          !color && tone === "neutral" && "text-muted-foreground",
          !color && tone === "negative" && "text-status-negative",
          !color && tone === "brand" && "text-primary"
        )}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </Root>
  );
}
