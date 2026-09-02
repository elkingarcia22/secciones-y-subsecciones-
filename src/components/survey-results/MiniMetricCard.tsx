import * as React from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({ value, format }: { value: number; format: (v: number) => React.ReactNode }) {
  // A subtle fade-in and slide-up animation is much cleaner than a number counter for dashboard metrics.
  return (
    <span className="inline-block animate-in fade-in slide-in-from-bottom-1.5 duration-700 ease-out">
      {format(value)}
    </span>
  );
}

export type MiniMetricTone = "positive" | "warning" | "yellow" | "neutral" | "negative" | "brand";

/** Background classes for the title accent, one per tone. */
const TONE_ACCENT_CLASSES: Readonly<Record<MiniMetricTone, string>> = {
  brand: "bg-primary",
  positive: "bg-status-positive",
  warning: "bg-status-warning",
  yellow: "bg-[#EAB308]",
  neutral: "bg-text-muted",
  negative: "bg-status-negative",
};

/** Text classes for the icon and the chart (drawn in `currentColor`), one per tone. */
const TONE_TEXT_CLASSES: Readonly<Record<MiniMetricTone, string>> = {
  brand: "text-primary",
  positive: "text-status-positive",
  warning: "text-status-warning",
  yellow: "text-[#EAB308]",
  neutral: "text-text-muted",
  negative: "text-status-negative",
};

/**
 * The metric card every KPI row in the app is made of — the home pulse and the
 * results tabs alike.
 *
 * One anatomy: a thin accent of the card's tone beside the title, the icon
 * small at the row's end in that same tone, a big neutral number with room for
 * a delta pill beside it, a muted caption, and optionally a chart drawn in the
 * tone — beside the number, or run along the card's bottom edge. Color is spent
 * only where it carries meaning (accent, icon, chart, delta); the number itself
 * stays neutral, so a row of five cards reads calm instead of like a scoreboard.
 *
 * Passing `onClick` turns it into a button — same card, same type, plus an
 * active ring — so a KPI that filters something reads as the identical object
 * to one that only reports.
 */
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
   *  stacked above other content — same anatomy, just shorter. */
  size = "default",
  caption,
  valueAside,
  chart,
  chartPlacement = "side",
  children,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: React.ReactNode;
  tone?: MiniMetricTone;
  /** A raw CSS color for the accent, icon and chart, when the tone palette
   *  does not have the right one (e.g. the favorability scale's own colors). */
  color?: string;
  bgColor?: string;
  borderColor?: string;
  /** Makes the card a button. Omit for a plain readout. */
  onClick?: () => void;
  /** Only meaningful with `onClick`: the narrowing this card applies is on. */
  active?: boolean;
  disabled?: boolean;
  size?: "default" | "compact";
  /** One muted line under the number: what it is over, or what it compares to. */
  caption?: string;
  /** Sits right after the number — typically a delta pill. */
  valueAside?: React.ReactNode;
  /** A small chart in the card's tone. */
  chart?: React.ReactNode;
  /** "side" tucks the chart beside the number; "bottom" runs it along the
   *  card's lower edge, bleeding to the border like a trend card. */
  chartPlacement?: "side" | "bottom";
  /** Extra controls in the title row, e.g. an info tooltip. */
  children?: React.ReactNode;
}) {
  const interactive = onClick !== undefined;
  const Root = (interactive ? "button" : "div") as "button";
  const compact = size === "compact";
  const bottom = chartPlacement === "bottom" && chart;
  const toneKey: MiniMetricTone = tone ?? "brand";
  // A custom `color` tints accent, icon and chart itself instead of falling
  // back to the tone palette.
  const accentClass = color ? undefined : TONE_ACCENT_CLASSES[toneKey];
  const tintClass = color ? undefined : TONE_TEXT_CLASSES[toneKey];
  const tintStyle = color ? { color } : undefined;

  return (
    <Root
      type={interactive ? "button" : undefined}
      onClick={onClick}
      disabled={interactive ? disabled : undefined}
      aria-pressed={interactive ? active : undefined}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border group text-left",
        compact ? "gap-2 px-3.5 pt-3" : "gap-2.5 px-4 pt-3.5",
        bottom ? "pb-0" : compact ? "pb-3" : "pb-3.5",
        !bgColor && !active && "border-border/60 bg-surface shadow-card",
        active && "border-primary bg-primary/[0.04] shadow-[0_0_0_1px_theme(colors.brand.DEFAULT)]",
        // Same wash + 1px lift as the survey-builder mode cards, so a KPI
        // that reacts to the pointer reacts the way the rest of the app does.
        interactive && !disabled && "magic-card-sweep magic-card-lift",
        interactive && disabled && "cursor-default opacity-60"
      )}
      style={{
        backgroundColor: active ? undefined : bgColor,
        borderColor: active ? undefined : borderColor,
      }}
    >
      <div className="relative z-[1] flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className={cn("h-3.5 w-[3px] shrink-0 rounded-full", accentClass)}
          style={color ? { backgroundColor: color } : undefined}
        />
        <span className="truncate text-[12.5px] font-semibold text-text-primary">{label}</span>
        {children}
        {Icon && (
          <span className={cn("ml-auto flex shrink-0 items-center", tintClass)} style={tintStyle}>
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
      </div>

      <div className="relative z-[1] flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "font-extrabold leading-none tracking-tight tabular-nums text-text-primary",
                compact ? "text-[24px]" : "text-[26px]"
              )}
            >
              {value}
            </span>
            {valueAside}
          </div>
          {caption && <span className="truncate text-[11px] font-medium text-text-muted">{caption}</span>}
        </div>
        {chart && !bottom && (
          <span className={cn("flex shrink-0 items-end", tintClass)} style={tintStyle}>
            {chart}
          </span>
        )}
      </div>

      {bottom && (
        // Bleeds past the padding on three sides so the curve runs edge to
        // edge and sits on the card's bottom border.
        <div className={cn("relative z-[1] mt-auto", compact ? "-mx-3.5" : "-mx-4", tintClass)} style={tintStyle}>
          {chart}
        </div>
      )}
    </Root>
  );
}
