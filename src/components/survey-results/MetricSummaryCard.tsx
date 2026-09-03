import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  NEGATIVE_BG, NEGATIVE_BORDER, NEGATIVE_TEXT,
  POSITIVE_BG, POSITIVE_BORDER, POSITIVE_TEXT,
  YELLOW_BG, YELLOW_BORDER, YELLOW_TEXT,
  type MetricTone,
} from "./favorabilityScale";

const READING_TONE_STYLE: Readonly<Record<MetricTone, { background: string; border: string; foreground: string }>> = {
  positive: { background: POSITIVE_BG, border: POSITIVE_BORDER, foreground: POSITIVE_TEXT },
  warning: { background: YELLOW_BG, border: YELLOW_BORDER, foreground: YELLOW_TEXT },
  negative: { background: NEGATIVE_BG, border: NEGATIVE_BORDER, foreground: NEGATIVE_TEXT },
};

/**
 * The small pill beside a card's big number — the plain-language reading a
 * bare percentage or score doesn't say on its own (e.g. "Favorable", "Buena",
 * "Neutro"). Every tab's headline metric gets one, in the same three tones
 * (and the same colors) the card's own rings already use.
 */
export function MetricReadingBadge({ tone, label }: { tone: MetricTone; label: string }) {
  const style = READING_TONE_STYLE[tone];
  return (
    <span
      className="inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-bold leading-none"
      style={{ backgroundColor: style.background, borderColor: style.border, color: style.foreground }}
    >
      {label}
    </span>
  );
}

interface TopArea {
  id: string;
  label: string;
  value: number;
  displayValue: string;
}

interface RingItem {
  id: string;
  label: string;
  percentage: number;
  color: string;
  count: string;
  active: boolean;
  onToggle: () => void;
  /** False for a ring that only reports a number — no band to filter by, so
   * it renders as a plain chip instead of a clickable toggle. */
  interactive?: boolean;
}

interface MetricSummaryCardProps {
  accentColor?: string;
  title: string;
  hint?: React.ReactNode;
  bigValue: string;
  /** A small pill beside the big number — the reading it falls in (e.g.
   * "Neutral"), for a metric whose number alone doesn't say which band it's in. */
  bigValueBadge?: React.ReactNode;
  caption: string;
  rings: readonly RingItem[];
  ringsLabel: string;
  ringsTotal: string;
  topAreasTitle: string;
  topAreas: readonly TopArea[];
  chartTitle?: string;
  chart?: React.ReactNode;
}

export function MetricSummaryCard({
  accentColor = "bg-primary",
  title,
  hint,
  bigValue,
  bigValueBadge,
  caption,
  rings,
  ringsLabel,
  ringsTotal,
  topAreasTitle,
  topAreas,
  chartTitle,
  chart,
}: MetricSummaryCardProps) {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card shrink-0">
      <div className="grid gap-x-8 gap-y-6 px-6 pt-5 pb-4 lg:grid-cols-[minmax(250px,1fr)_minmax(0,1.2fr)_minmax(320px,1fr)]">
        {/* Left Column: Big Number */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden className={cn("h-3.5 w-[3px] shrink-0 rounded-full", accentColor)} />
              <h2 className="text-[12.5px] font-semibold text-text-primary">{title}</h2>
              {hint && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md">
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                      {hint}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-extrabold leading-none tracking-tight tabular-nums text-text-primary">
                {bigValue}
              </span>
              {bigValueBadge}
            </div>
            <span className="text-[11px] font-medium text-text-muted">{caption}</span>
          </div>
        </div>

        {/* Middle Column: Ring Gauges */}
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[11px] font-semibold text-text-muted">{ringsLabel}</span>
            <span className="text-[11px] font-medium tabular-nums text-text-muted">{ringsTotal}</span>
          </div>
          <div className="flex flex-1 items-center justify-between gap-2">
            {rings.map((ring) => {
              const chipContent = (
                <>
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ring.color }} />
                  {ring.label}
                  <span className="font-bold tabular-nums text-text-primary ml-0.5">{ring.count}</span>
                </>
              );

              return (
                <div key={ring.id} className="flex flex-col items-center gap-2.5">
                  <div className="relative" style={{ color: ring.color }}>
                    <svg width="72" height="72" viewBox="0 0 72 72" aria-label={ring.label}>
                      <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="6.5" strokeOpacity="0.15" />
                      <circle
                        cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="6.5"
                        strokeDasharray={`${(ring.percentage / 100) * 188.5} 188.5`}
                        strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 36 36)"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-text-primary">
                      {ring.percentage}%
                    </span>
                  </div>
                  {ring.interactive === false ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-surface-muted/60 px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
                      {chipContent}
                    </span>
                  ) : (
                    <button
                      type="button" onClick={ring.onToggle} aria-pressed={ring.active}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                        ring.active
                          ? "border-primary bg-primary/[0.08] text-primary"
                          : "border-border/70 bg-surface-muted/60 text-text-secondary hover:border-primary/40 hover:text-text-primary"
                      )}
                    >
                      {chipContent}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Top 3 Areas */}
        <div className="flex flex-col min-w-[320px] lg:border-l lg:border-border/40 lg:pl-6">
          <span className="text-[11px] font-semibold text-text-muted mb-4 whitespace-nowrap">{topAreasTitle}</span>
          <div className="flex flex-col gap-3">
            {topAreas.map((area) => (
              <div key={area.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end text-[11px] leading-none">
                  <span className="text-text-secondary truncate pr-2 font-medium">{area.label}</span>
                  <span className="text-text-primary font-bold tabular-nums">{area.displayValue}</span>
                </div>
                <Progress value={area.value} color="primary" className="h-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {chart && (
        <div className="relative mt-2 flex flex-col text-primary">
          <div className="flex items-baseline justify-between text-[10.5px] font-semibold tabular-nums text-text-muted px-6">
            <span>{chartTitle}</span>
          </div>
          <div className="mt-1">{chart}</div>
        </div>
      )}
    </section>
  );
}
