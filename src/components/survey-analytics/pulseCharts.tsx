import * as React from "react";
import { cn } from "@/lib/utils";
import { useMeasuredWidth } from "./useMeasuredWidth";

/**
 * The three small charts a metric card can carry, all drawn in `currentColor`
 * so the card's tone tints them. One implementation for the home pulse and
 * the results tabs — the same ring, line and dial wherever a number shows up.
 */

// --- Ring --------------------------------------------------------------------

const RING_SIZE = 56;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/** A share of a whole (0–100), drawn as how much of the circle it fills. */
export function RingGauge({ value, ariaLabel, size = 56, strokeWidth = 6 }: { value: number; ariaLabel: string; size?: number; strokeWidth?: number }) {
  const share = Math.max(0, Math.min(100, value)) / 100;
  const radius = (size - strokeWidth) / 2;
  const length = 2 * Math.PI * radius;

  // Starts closed and eases open after mount — a transition on the offset,
  // since a keyframe cannot know where each ring should stop.
  const [drawn, setDrawn] = React.useState(false);
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted dark:stroke-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={drawn ? length * (1 - share) : length}
        className="pulse-ring-draw"
      />
    </svg>
  );
}

// --- Sparkline ---------------------------------------------------------------

export interface SparkPoint {
  id: string;
  /** Shown in the point's tooltip alongside the value. */
  name: string;
  value: number;
}

const SPARK_H = 44;
const SPARK_PAD_Y = 5;

/** Straight segments become one smooth curve — control points sit a third of
 *  the way along each segment, so the line never overshoots a point. */
function smoothPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
  rest.forEach((point, index) => {
    const previous = points[index];
    const dx = (point.x - previous.x) / 3;
    d += ` C ${(previous.x + dx).toFixed(1)} ${previous.y.toFixed(1)}, ${(point.x - dx).toFixed(1)} ${point.y.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
  });
  return d;
}

/**
 * A series run edge to edge along a card's bottom, with an optional target
 * drawn as a dashed guide. Drawn at the measured pixel width, so strokes and
 * the end dot stay crisp instead of being stretched.
 */
export function Sparkline({
  points,
  target,
  format,
  ariaLabel,
  height = SPARK_H,
  /** Draws every point as a small dot, not only the last one — for a chart
   *  big enough that each measurement is worth pointing at. */
  showPoints = false,
  /** Whether the vertical range stretches to keep the target in view. Off, a
   *  series far from its target keeps its own shape instead of flattening
   *  into a line at the bottom; the guide is then drawn only when it falls
   *  inside the range. */
  fitTarget = true,
}: {
  points: readonly SparkPoint[];
  target?: number;
  /** How a point's value reads in its tooltip. */
  format: (value: number) => string;
  ariaLabel: string;
  height?: number;
  showPoints?: boolean;
  fitTarget?: boolean;
}) {
  const gradientId = React.useId();
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();

  const values = points.map((point) => point.value);
  const bounds = target !== undefined && fitTarget ? [...values, target] : values;
  const spread = Math.max(...bounds) - Math.min(...bounds);
  // Pad by at least a few points, and by more when the series barely moves,
  // so a steady line still sits mid-chart rather than hugging an edge.
  const pad = Math.max(4, spread * 0.5);
  const low = Math.min(...bounds) - pad;
  const high = Math.max(...bounds) + pad;
  const targetVisible = target !== undefined && target >= low && target <= high;
  const x = (index: number) => (points.length > 1 ? (index / (points.length - 1)) * width : 0);
  const y = (value: number) => SPARK_PAD_Y + (1 - (value - low) / (high - low)) * (height - SPARK_PAD_Y * 2);

  const coords = points.map((point, index) => ({ x: x(index), y: y(point.value) }));
  const line = smoothPath(coords);
  const area =
    coords.length > 0
      ? `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${height} L ${coords[0].x.toFixed(1)} ${height} Z`
      : "";
  const lastCoord = coords[coords.length - 1];

  return (
    <div ref={ref} className="w-full" style={{ height }} aria-hidden={points.length < 2 || undefined}>
      {width > 0 && points.length >= 2 && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={ariaLabel}
          className="block overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.26} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          {targetVisible && (
            <line
              x1={0}
              x2={width}
              y1={y(target as number)}
              y2={y(target as number)}
              strokeDasharray="2 3"
              strokeWidth={1}
              className="stroke-text-muted/50"
            />
          )}
          <path d={area} fill={`url(#${gradientId})`} className="pulse-fade-in" />
          {/* A wide, faint copy of the line underneath gives it a soft glow
              without a filter. */}
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.16}
            strokeWidth={6}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="pulse-line-draw"
          />
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="pulse-line-draw"
          />
          {points.map((point, index) => (
            <circle
              key={point.id}
              cx={coords[index].x}
              cy={coords[index].y}
              r={showPoints ? 2.5 : 6}
              fill={showPoints ? "currentColor" : "transparent"}
              strokeWidth={showPoints ? 1.5 : 0}
              className={cn(showPoints && "stroke-surface pulse-fade-in", "hover:r-[6]")}
            >
              <title>{`${point.name} · ${format(point.value)}`}</title>
            </circle>
          ))}
          <circle
            cx={lastCoord.x}
            cy={lastCoord.y}
            r={3}
            fill="currentColor"
            className="stroke-surface pulse-fade-in"
            strokeWidth={1.5}
          />
        </svg>
      )}
    </div>
  );
}

// --- Dial --------------------------------------------------------------------

const DIAL_W = 104;
const DIAL_H = 64;
const DIAL_RADIUS = 42;
const DIAL_STROKE = 7;
const DIAL_CX = DIAL_W / 2;
const DIAL_CY = DIAL_H - 14;

/** Where a -100..+100 score lands on the half circle: -100 left, +100 right. */
function dialPoint(score: number, radius = DIAL_RADIUS) {
  const angle = Math.PI * (1 - (score + 100) / 200);
  return { x: DIAL_CX + radius * Math.cos(angle), y: DIAL_CY - radius * Math.sin(angle) };
}

function dialArc(from: number, to: number): string {
  const start = dialPoint(from);
  const end = dialPoint(to);
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${DIAL_RADIUS} ${DIAL_RADIUS} 0 0 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

/** The three eNPS zones the results tab uses, as slices of the dial. */
const DIAL_ZONES: readonly { from: number; to: number; className: string }[] = [
  { from: -100, to: 0, className: "stroke-status-negative" },
  { from: 0, to: 20, className: "stroke-status-warning" },
  { from: 20, to: 100, className: "stroke-status-positive" },
];

/** An eNPS score as a needle on a three-zone dial; the zone it lands in lights up. */
export function DialGauge({
  value,
  ariaLabel,
  className,
}: {
  value: number;
  ariaLabel: string;
  /** Width classes; the dial scales with them. */
  className?: string;
}) {
  const clamped = Math.max(-100, Math.min(100, value));
  const needle = dialPoint(clamped);
  const activeZone =
    DIAL_ZONES.find((zone) => clamped >= zone.from && clamped < zone.to) ??
    DIAL_ZONES[DIAL_ZONES.length - 1];

  return (
    <svg
      viewBox={`0 0 ${DIAL_W} ${DIAL_H}`}
      role="img"
      aria-label={ariaLabel}
      className={cn("h-auto overflow-visible", className ?? "w-[92px] xl:w-[104px]")}
    >
      {DIAL_ZONES.map((zone) => (
        <path
          key={zone.from}
          d={dialArc(zone.from, zone.to)}
          fill="none"
          strokeWidth={DIAL_STROKE}
          strokeLinecap="butt"
          className={cn(
            zone.className,
            "transition-opacity duration-500",
            zone === activeZone ? "opacity-100" : "opacity-[0.22]"
          )}
        />
      ))}
      <circle
        cx={needle.x}
        cy={needle.y}
        r={5}
        fill="currentColor"
        strokeWidth={2}
        className="stroke-surface pulse-fade-in"
      />
      {/* A hairline from the hub to the marker makes it read as a needle. */}
      <line
        x1={DIAL_CX}
        y1={DIAL_CY}
        x2={needle.x}
        y2={needle.y}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        className="pulse-fade-in opacity-60"
      />
      <circle cx={DIAL_CX} cy={DIAL_CY} r={2.5} className="fill-text-secondary/70" />
      <text
        x={dialPoint(-100).x - DIAL_STROKE / 2}
        y={DIAL_H - 1}
        textAnchor="start"
        className="fill-text-muted text-[8.5px] font-semibold tabular-nums"
      >
        -100
      </text>
      <text
        x={dialPoint(100).x + DIAL_STROKE / 2}
        y={DIAL_H - 1}
        textAnchor="end"
        className="fill-text-muted text-[8.5px] font-semibold tabular-nums"
      >
        +100
      </text>
    </svg>
  );
}

// --- Spectrum ----------------------------------------------------------------

export interface SpectrumZone {
  id: string;
  label: string;
  from: number;
  to: number;
  color: string;
}

/**
 * A reading placed on a banded scale: the zones as one wide strip, the one
 * the value falls in lit, a marker on the value, zone names underneath. For
 * scores that live on a fixed range with named bands (sentiment 0–100).
 */
export function SpectrumScale({
  value,
  min,
  max,
  zones,
  format,
  ariaLabel,
}: {
  value: number | null;
  min: number;
  max: number;
  zones: readonly SpectrumZone[];
  format: (value: number) => string;
  ariaLabel: string;
}) {
  const span = max - min;
  const position = value === null ? null : Math.max(0, Math.min(100, ((value - min) / span) * 100));
  const active = value === null ? null : zones.find((zone) => value >= zone.from && value < zone.to) ?? zones[zones.length - 1];

  return (
    <div role="img" aria-label={ariaLabel} className="relative w-full pt-3 pb-5">
      <div className="flex h-3 w-full gap-px overflow-hidden rounded-full">
        {zones.map((zone) => (
          <span
            key={zone.id}
            className={cn(
              "h-full transition-opacity duration-500",
              active && zone.id !== active.id && "opacity-30"
            )}
            style={{ flexGrow: zone.to - zone.from, backgroundColor: zone.color }}
          />
        ))}
      </div>
      {zones.map((zone) => (
        <span
          key={`${zone.id}-label`}
          className={cn(
            "absolute top-[26px] -translate-x-1/2 whitespace-nowrap text-[10.5px] font-semibold",
            active && zone.id === active.id ? "text-text-primary" : "text-text-muted"
          )}
          style={{ left: `${(((zone.from + zone.to) / 2 - min) / span) * 100}%` }}
        >
          {zone.label}
        </span>
      ))}
      {position !== null && value !== null && (
        <span
          className="absolute top-[7px] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center pulse-fade-in"
          style={{ left: `${position}%` }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow-md ring-1 ring-border/60">
            <span className="h-3 w-3 rounded-full bg-current" />
          </span>
          <span className="absolute -top-5 whitespace-nowrap text-[11px] font-extrabold tabular-nums text-text-primary">
            {format(value)}
          </span>
        </span>
      )}
    </div>
  );
}

// --- Bar strip ---------------------------------------------------------------

export interface StripBar {
  id: string;
  label: string;
  value: number;
  color: string;
}

const STRIP_PAD_TOP = 16;
const STRIP_PAD_BOTTOM = 16;

/**
 * One bar per item across the full width, rising or falling from a baseline —
 * for scores that can be negative (eNPS by section). The range fits the data
 * symmetrically around the baseline unless given, so a handful of scores near
 * zero still reads as bars, not as hairlines on a -100..+100 axis. Each bar
 * carries its value at its tip and its name underneath.
 */
export function BarStrip({
  bars,
  min,
  max,
  baseline = 0,
  format,
  ariaLabel,
  height = 72,
}: {
  bars: readonly StripBar[];
  min?: number;
  max?: number;
  baseline?: number;
  format: (value: number) => string;
  ariaLabel: string;
  height?: number;
}) {
  const [ref, width] = useMeasuredWidth<HTMLDivElement>();
  const extent = Math.max(10, ...bars.map((bar) => Math.abs(bar.value - baseline))) * 1.25;
  const low = min ?? baseline - extent;
  const high = max ?? baseline + extent;
  const y = (value: number) =>
    STRIP_PAD_TOP + (1 - (value - low) / (high - low)) * (height - STRIP_PAD_TOP - STRIP_PAD_BOTTOM);
  const slot = bars.length > 0 ? width / bars.length : 0;
  const barWidth = Math.max(8, Math.min(36, slot * 0.45));

  return (
    <div ref={ref} className="w-full" style={{ height }}>
      {width > 0 && bars.length > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel} className="block">
          <line x1={0} x2={width} y1={y(baseline)} y2={y(baseline)} strokeWidth={1} className="stroke-border" />
          {bars.map((bar, index) => {
            const center = slot * index + slot / 2;
            const x = center - barWidth / 2;
            const up = bar.value >= baseline;
            const top = Math.min(y(bar.value), y(baseline));
            const barHeight = Math.max(2, Math.abs(y(bar.value) - y(baseline)));
            return (
              <g key={bar.id} className="pulse-fade-in">
                <rect x={x} y={top} width={barWidth} height={barHeight} rx={3} fill={bar.color} opacity={0.9}>
                  <title>{`${bar.label} · ${format(bar.value)}`}</title>
                </rect>
                <text
                  x={center}
                  y={up ? top - 4 : top + barHeight + 11}
                  textAnchor="middle"
                  className="fill-text-primary text-[10.5px] font-bold tabular-nums"
                >
                  {format(bar.value)}
                </text>
                <text
                  x={center}
                  y={height - 3}
                  textAnchor="middle"
                  className="fill-text-muted text-[10px] font-semibold"
                >
                  {bar.label.length > Math.max(6, slot / 7) ? `${bar.label.slice(0, Math.max(5, Math.floor(slot / 7)))}…` : bar.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

// --- Meter row ---------------------------------------------------------------

export interface MeterItem {
  id: string;
  label: string;
  value: number;
  color: string;
  /** Small text under the label, e.g. what the level means. */
  detail?: string;
}

/** A few labelled meters side by side, each filled to its share of `total`. */
export function MeterRow({
  items,
  total,
  format = (n) => n.toLocaleString("es-CO"),
}: {
  items: readonly MeterItem[];
  total: number;
  format?: (value: number) => string;
}) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((item) => {
        const share = total === 0 ? 0 : Math.round((item.value / total) * 100);
        return (
          <div key={item.id} className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-text-primary">
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-text-primary">
                {share}% <span className="font-medium text-text-muted">· {format(item.value)}</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/10">
              <span
                className="block h-full rounded-full pulse-bar-grow origin-left"
                style={{ width: `${share}%`, backgroundColor: item.color }}
              />
            </div>
            {item.detail && <span className="truncate text-[10.5px] text-text-muted">{item.detail}</span>}
          </div>
        );
      })}
    </div>
  );
}

// --- Activity rings -----------------------------------------------------------

export interface ActivityRing {
  id: string;
  label: string;
  value: number;
  color: string;
}

const RINGS_SIZE = 156;
const RINGS_STROKE = 13;
const RINGS_GAP = 4;

/**
 * Several shares of one whole, nested as concentric rings around a shared
 * center — one graphic object instead of a bar plus a list. Outer ring first,
 * so the reading order (outer → inner) matches the order the caller passes.
 */
export function ActivityRings({
  rings,
  total,
  centerValue,
  centerLabel,
  ariaLabel,
}: {
  rings: readonly ActivityRing[];
  total: number;
  /** Shown at the shared center — a total the rings themselves don't repeat. */
  centerValue?: string;
  centerLabel?: string;
  ariaLabel: string;
}) {
  // Starts closed and eases open after mount, same as the single ring gauge.
  const [drawn, setDrawn] = React.useState(false);
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const center = RINGS_SIZE / 2;

  return (
    <svg width={RINGS_SIZE} height={RINGS_SIZE} viewBox={`0 0 ${RINGS_SIZE} ${RINGS_SIZE}`} role="img" aria-label={ariaLabel}>
      {/* Only the tracks rotate to a 12-o'clock start; the center text stays upright. */}
      <g transform={`rotate(-90 ${center} ${center})`}>
        {rings.map((ring, index) => {
          const radius = center - RINGS_STROKE / 2 - index * (RINGS_STROKE + RINGS_GAP);
          const length = 2 * Math.PI * radius;
          const share = total <= 0 ? 0 : Math.max(0, Math.min(1, ring.value / total));
          return (
            <React.Fragment key={ring.id}>
              <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={RINGS_STROKE} className="stroke-muted dark:stroke-white/10" />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={ring.color}
                strokeWidth={RINGS_STROKE}
                strokeLinecap="round"
                strokeDasharray={length}
                strokeDashoffset={drawn ? length * (1 - share) : length}
                className="pulse-ring-draw"
              >
                <title>{`${ring.label} · ${Math.round(share * 100)}%`}</title>
              </circle>
            </React.Fragment>
          );
        })}
      </g>
      {(centerValue || centerLabel) && (
        <g className="pulse-fade-in">
          {centerValue && (
            <text x={center} y={centerLabel ? center - 4 : center} textAnchor="middle" dominantBaseline="middle" className="fill-text-primary text-[22px] font-extrabold tabular-nums">
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x={center} y={center + 16} textAnchor="middle" className="fill-text-muted text-[10px] font-semibold">
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
