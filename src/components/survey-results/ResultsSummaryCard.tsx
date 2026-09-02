import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MiniMetricTone } from "./MiniMetricCard";

const TONE_ACCENT_CLASSES: Readonly<Record<MiniMetricTone, string>> = {
  brand: "bg-primary",
  positive: "bg-status-positive",
  warning: "bg-status-warning",
  yellow: "bg-[#EAB308]",
  neutral: "bg-text-muted",
  negative: "bg-status-negative",
};

const TONE_TEXT_CLASSES: Readonly<Record<MiniMetricTone, string>> = {
  brand: "text-primary",
  positive: "text-status-positive",
  warning: "text-status-warning",
  yellow: "text-[#EAB308]",
  neutral: "text-text-muted",
  negative: "text-status-negative",
};

export interface SummarySegment {
  id: string;
  label: string;
  value: number;
  /** Raw CSS color: the same the scale's legend and bars use elsewhere. */
  color: string;
  /** Present when the segment doubles as a filter on the table below. */
  active?: boolean;
  onToggle?: () => void;
}

/** A plain figure for the right block, when the reading has no single total to split. */
export interface SummaryStat {
  id: string;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}

interface ResultsSummaryCardProps {
  /** Headline: what the big number is. */
  label: string;
  /** Tooltip content beside the label — a definition, a formula. */
  hint?: React.ReactNode;
  value: React.ReactNode;
  tone: MiniMetricTone;
  caption?: string;
  /** Sits right after the number — typically a delta pill or a verdict badge. */
  valueAside?: React.ReactNode;
  /** The wide chart along the card's base, drawn in the card's tone. */
  chart?: React.ReactNode;
  /** Kept for callers that still say where `chart` goes; "beside" is the
   *  same as passing it through `heroChart`. */
  chartPlacement?: "floor" | "beside";
  /** Whether the floor chart keeps the card's padding (labels inside) or
   *  bleeds edge to edge (a bare curve). */
  chartInset?: boolean;
  /** A chart next to the number — a ring or a dial. */
  heroChart?: React.ReactNode;
  /** First and last tick under a floor chart, e.g. the oldest and newest measurement. */
  chartAxis?: readonly [string, string];
  chartTitle?: string;
  /** The breakdown on the right: a stacked bar plus one row per segment. */
  segments?: readonly SummarySegment[];
  segmentsTitle?: string;
  formatSegmentValue?: (value: number) => string;
  /** Instead of a breakdown: a few standalone figures on the right. */
  stats?: readonly SummaryStat[];
  /** Replaces the whole right block with a custom composition — a set of
   *  rings, say — when neither a bar-and-list breakdown nor plain stats fit
   *  the reading. Still sits in the same column, same padding rhythm. */
  rightContent?: React.ReactNode;
  className?: string;
}

/**
 * One wide card in place of a row of five: the headline number and its
 * caption on the left, the trend across the middle, the breakdown of answers
 * on the right. Same accent, same neutral number and same tone rules as
 * `MiniMetricCard` — this is that card stretched to hold a whole reading,
 * not a second design. Segment rows are buttons when they filter something.
 */
export function ResultsSummaryCard({
  label,
  hint,
  value,
  tone,
  caption,
  valueAside,
  chart,
  chartPlacement = "floor",
  chartInset = false,
  heroChart,
  chartAxis,
  chartTitle,
  segments = [],
  segmentsTitle,
  formatSegmentValue = (n) => n.toLocaleString("es-CO"),
  stats,
  rightContent,
  className,
}: ResultsSummaryCardProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const share = (segment: SummarySegment) => (total === 0 ? 0 : (segment.value / total) * 100);
  const anyActive = segments.some((segment) => segment.active);
  const floorChart = chart && chartPlacement === "floor" ? chart : null;
  const besideChart = heroChart ?? (chart && chartPlacement === "beside" ? chart : null);
  const hasSegments = segments.length > 0;
  const hasStats = Boolean(stats && stats.length > 0);
  const hasCustomRight = rightContent !== undefined;

  return (
    <section
      aria-label={label}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card",
        className
      )}
    >
      {/* Top row: the number on the left, the breakdown on the right. The
          trend is not a third column — it runs under both, edge to edge, so
          the card reads as one surface rather than three panels. */}
      <div
        className={cn(
          "grid gap-x-10 gap-y-4 px-5 pt-4",
          hasStats && hasSegments && !hasCustomRight
            ? "lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,0.8fr)_minmax(0,1.2fr)]"
            : "lg:grid-cols-[minmax(200px,0.7fr)_minmax(0,1.3fr)]"
        )}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span aria-hidden className={cn("h-3.5 w-[3px] shrink-0 rounded-full", TONE_ACCENT_CLASSES[tone])} />
            <span className="truncate text-[12.5px] font-semibold text-text-primary">{label}</span>
            {hint && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Qué mide ${label}`}
                    className="shrink-0 rounded-md p-0.5 text-text-muted transition-colors hover:text-text-primary"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                  {hint}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[34px] font-extrabold leading-none tracking-tight tabular-nums text-text-primary">
                  {value}
                </span>
                {valueAside}
              </div>
              {caption && <span className="text-[11px] font-medium text-text-muted">{caption}</span>}
            </div>
            {besideChart && (
              <div className={cn("flex shrink-0 items-end", TONE_TEXT_CLASSES[tone])}>{besideChart}</div>
            )}
          </div>
        </div>

        {hasCustomRight && <div className="flex min-w-0 flex-col gap-2.5">{rightContent}</div>}

        {!hasCustomRight && hasStats && stats && (
          <div
            className={cn(
              "grid gap-x-6 gap-y-3 self-center",
              hasSegments ? "grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 lg:gap-y-2.5" : "sm:grid-cols-3"
            )}
          >
            {stats.map((stat) => (
              <div key={stat.id} className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted">
                  <span className="truncate">{stat.label}</span>
                  {stat.hint && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Qué mide ${stat.label}`}
                          className="shrink-0 rounded-md p-0.5 text-text-muted transition-colors hover:text-text-primary"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                        {stat.hint}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <span
                  className={cn(
                    "font-extrabold leading-none tracking-tight tabular-nums text-text-primary",
                    hasSegments ? "text-[18px]" : "text-[22px]"
                  )}
                >
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {!hasCustomRight && hasSegments && (
        <div className="flex min-w-0 flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-semibold text-text-muted">{segmentsTitle}</span>
            <span className="text-[11px] font-medium tabular-nums text-text-muted">
              {formatSegmentValue(total)} en total
            </span>
          </div>
          <div
            role="img"
            aria-label={segments.map((segment) => `${segment.label} ${Math.round(share(segment))}%`).join(", ")}
            className="flex h-2.5 w-full gap-px overflow-hidden rounded-full bg-muted dark:bg-white/10"
          >
            {segments
              .filter((segment) => segment.value > 0)
              .map((segment) => (
                <span
                  key={segment.id}
                  className={cn(
                    "h-full min-w-[3px] transition-opacity duration-300 pulse-bar-grow origin-left",
                    anyActive && !segment.active && "opacity-30"
                  )}
                  style={{ flexGrow: segment.value, backgroundColor: segment.color }}
                />
              ))}
          </div>
          <ul className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {segments.map((segment) => {
              const interactive = segment.onToggle !== undefined;
              const Row = (interactive ? "button" : "div") as "button";
              return (
                <li key={segment.id} className="min-w-0">
                  <Row
                    type={interactive ? "button" : undefined}
                    onClick={segment.onToggle}
                    aria-pressed={interactive ? segment.active : undefined}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] transition-colors duration-200",
                      interactive &&
                        "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      segment.active && "bg-primary/[0.06] ring-1 ring-primary/30",
                      anyActive && !segment.active && "opacity-60"
                    )}
                  >
                    <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="min-w-0 flex-1 truncate font-medium text-text-secondary">{segment.label}</span>
                    <span className="shrink-0 font-bold tabular-nums text-text-primary">
                      {formatSegmentValue(segment.value)}
                    </span>
                    <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-text-muted">
                      {Math.round(share(segment))}%
                    </span>
                  </Row>
                </li>
              );
            })}
          </ul>
        </div>
        )}
      </div>

      {/* The trend: the card's floor. Title and axis sit in the padding, the
          curve itself bleeds to both borders and rests on the bottom one.
          Without one, the top row simply closes with its own padding. */}
      {!floorChart && <div className="pb-4" />}
      {floorChart && (
      <div className={cn("relative mt-3 flex flex-col", chartInset && "px-5 pb-4", TONE_TEXT_CLASSES[tone])}>
        {(chartTitle || chartAxis) && (
          <div className={cn("flex items-baseline justify-between text-[10.5px] font-semibold tabular-nums text-text-muted", !chartInset && "px-5")}>
            <span>{chartTitle}</span>
            {chartAxis && (
              <span>
                {chartAxis[0]} → {chartAxis[1]}
              </span>
            )}
          </div>
        )}
        <div className="mt-1">{floorChart}</div>
      </div>
      )}
    </section>
  );
}
