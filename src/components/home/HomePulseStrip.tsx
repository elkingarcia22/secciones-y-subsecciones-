import * as React from "react";
import { CheckCircle2, ChevronRight, Gauge, Info, ThumbsUp, TriangleAlert, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DeltaPill } from "@/components/survey-analytics/DeltaPill";
import { DialGauge, RingGauge, Sparkline } from "@/components/survey-analytics/pulseCharts";
import { AnimatedNumber, MiniMetricCard, type MiniMetricTone } from "@/components/survey-results/MiniMetricCard";
import {
  FAVORABILITY_TARGET,
  NEGATIVE,
  POSITIVE,
  YELLOW,
  deltaTone,
  formatDelta,
  formatNpsScore,
  formatPercent,
  toneForFavorability,
  toneForNps,
  toneForParticipation,
  type MetricTone,
} from "@/components/survey-results/favorabilityScale";
import {
  NO_FILTERS,
  filtersEqual,
  matchesFilters,
  type SurveyFilterableRow,
  type SurveyListFilters,
} from "@/components/survey-list/surveyListFilters";
import type { SurveyListItem } from "@/mocks/types";
import { METRIC_PRESETS, PRESET_ICONS, formatCount, type MetricPreset } from "./homeMetrics";
import { buildHomePulse, formatNpsDelta, formatSurveyCount, type PulseMetric } from "./homePulse";

interface HomePulseStripProps {
  surveys: readonly SurveyListItem[];
  className?: string;
}

/**
 * The block between the templates shelf and the home tabs: three averaged
 * readings, each drawn as the chart its own scale calls for. The alerts that
 * used to live under them now sit inside the Encuestas tab, right above the
 * list they filter — see `AlertsRow` below.
 *
 * The cards are the same `MiniMetricCard` the results tabs use, so the home
 * and a survey's own results speak one visual language. Participation is a
 * share of a whole, so it gets a ring. Favorability is something you watch
 * move between measurements, so it gets a sparkline with the target drawn in.
 * eNPS lives on a -100..+100 dial with three zones, so it gets a gauge.
 */
/** The ring's stroke color, matching the rings a survey's own results tabs
 *  draw — not the home cards' generic status palette — so the same reading
 *  is the same green everywhere it appears as a ring. */
const RING_COLOR_BY_TONE: Readonly<Record<MetricTone, string>> = {
  positive: POSITIVE,
  warning: YELLOW,
  negative: NEGATIVE,
};

export function HomePulseStrip({ surveys, className }: HomePulseStripProps) {
  const pulse = React.useMemo(() => buildHomePulse(surveys), [surveys]);
  const participationTone =
    pulse.participation.value === null ? null : toneForParticipation(pulse.participation.value);

  return (
    <section aria-label="Pulso de encuestas" className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      <PulseCard
        icon={Users}
        label="Participación"
        hint="Promedio de la tasa de respuesta de todas las encuestas lanzadas, en curso o finalizadas."
        metric={pulse.participation}
        format={formatPercent}
        formatDelta={formatDelta}
        tone={participationTone === null ? "brand" : participationTone}
        color={participationTone === null ? undefined : RING_COLOR_BY_TONE[participationTone]}
        chart={
          pulse.participation.value !== null && (
            <RingGauge
              value={pulse.participation.value}
              ariaLabel={`${formatPercent(pulse.participation.value)} de participación promedio`}
            />
          )
        }
      />

      <PulseCard
        icon={ThumbsUp}
        label="Favorabilidad"
        hint={`Promedio de la favorabilidad de cada encuesta lanzada. La línea recorre las últimas mediciones por fecha de cierre; la guía punteada marca la meta de ${FAVORABILITY_TARGET}%.`}
        metric={pulse.favorability}
        format={formatPercent}
        formatDelta={formatDelta}
        tone={pulse.favorability.value === null ? "brand" : toneForFavorability(pulse.favorability.value)}
        chartPlacement="bottom"
        chart={
          <Sparkline
            points={pulse.favorability.series}
            target={FAVORABILITY_TARGET}
            format={formatPercent}
            ariaLabel={`Favorabilidad de las últimas ${pulse.favorability.series.length} mediciones`}
          />
        }
      />

      <PulseCard
        icon={Gauge}
        label="eNPS"
        hint="Promedio del eNPS de las encuestas que incluyeron una pregunta de recomendación. El dial va de -100 a +100: zona de riesgo bajo 0, neutra de 0 a 19 y favorable desde 20."
        metric={pulse.nps}
        format={formatNpsScore}
        formatDelta={formatNpsDelta}
        tone={pulse.nps.value === null ? "brand" : toneForNps(pulse.nps.value)}
        chart={
          pulse.nps.value !== null && (
            <DialGauge
              value={pulse.nps.value}
              ariaLabel={`eNPS ${formatNpsScore(pulse.nps.value)} en un dial de -100 a +100`}
            />
          )
        }
      />
    </section>
  );
}

// --- Metric cards ------------------------------------------------------------

/** One averaged reading on the shared card: number, delta against the previous
 *  measurements, how many surveys it is over, and its chart. */
function PulseCard({
  icon,
  label,
  hint,
  metric,
  format,
  formatDelta: formatDeltaValue,
  tone,
  color,
  chart,
  chartPlacement,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  metric: PulseMetric;
  format: (value: number) => string;
  formatDelta: (value: number) => string;
  tone: MiniMetricTone;
  /** Overrides the tone palette with the results tabs' own ring colors. */
  color?: string;
  chart: React.ReactNode;
  chartPlacement?: "side" | "bottom";
}) {
  const value = metric.value;
  const delta = value !== null && metric.previous !== null ? value - metric.previous : null;

  return (
    <MiniMetricCard
      icon={icon}
      label={`${label} promedio`}
      tone={value === null ? "neutral" : tone}
      color={value !== null ? color : undefined}
      value={value !== null ? <AnimatedNumber value={value} format={format} /> : <span className="text-text-muted">—</span>}
      valueAside={
        delta !== null && (
          <DeltaPill
            size="xs"
            value={delta}
            label={formatDeltaValue(delta)}
            tone={deltaTone(delta)}
            direction={delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat"}
            className="shrink-0"
          />
        )
      }
      caption={value !== null ? `${formatSurveyCount(metric.count)} · vs medición anterior` : "Sin encuestas lanzadas"}
      chart={value !== null ? chart : undefined}
      chartPlacement={chartPlacement}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={`Qué mide ${label} promedio`}
            className="shrink-0 rounded-md p-0.5 text-text-muted transition-colors hover:text-text-primary"
          >
            <Info className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">{hint}</TooltipContent>
      </Tooltip>
    </MiniMetricCard>
  );
}

// --- Alerts row --------------------------------------------------------------

type Tone = "brand" | "positive" | "warning" | "negative";

const TONE_TEXT_CLASSES: Readonly<Record<Tone, string>> = {
  brand: "text-primary",
  positive: "text-status-positive",
  warning: "text-status-warning",
  negative: "text-status-negative",
};

const PRESET_TONE: Readonly<Record<NonNullable<MetricPreset["tone"]> | "default", Tone>> = {
  default: "brand",
  brand: "brand",
  warning: "warning",
  negative: "negative",
};

/** Alerts first, plain state last: what needs a hand should be the first button. */
const ALERT_ORDER: readonly string[] = ["closing", "low", "open"];

/**
 * One notice row: it says how many surveys need a hand and offers a button
 * per reason. Same presets and the same `matchesFilters`/`filtersEqual` logic
 * the column menus run, so a button's count and the rows its click reveals
 * can never disagree. A reason with nothing behind it is not shown — an alert
 * for zero surveys is not an alert.
 *
 * Lives inside the Encuestas tab, right above the list it filters — its
 * buttons set the same column filters the table reads.
 */
export function AlertsRow({
  surveys,
  filters,
  onFiltersChange,
  className,
}: {
  surveys: readonly SurveyFilterableRow[];
  filters: SurveyListFilters;
  onFiltersChange: (filters: SurveyListFilters) => void;
  className?: string;
}) {
  // Resolved once per render so every button judges the date buckets against
  // the same instant the table does.
  const today = React.useMemo(() => new Date(), []);
  const countFor = (preset: MetricPreset) =>
    surveys.filter((survey) => matchesFilters(survey, preset.filters, today)).length;

  const presets = [...METRIC_PRESETS].sort((a, b) => ALERT_ORDER.indexOf(a.id) - ALERT_ORDER.indexOf(b.id));
  // "En curso" is a state, not a worry — only the other reasons count as
  // attention. Counted as distinct surveys: one that is both closing soon and
  // behind on participation is one survey to look at, not two.
  const worries = presets.filter((preset) => preset.id !== "open");
  const attention = surveys.filter((survey) =>
    worries.some((preset) => matchesFilters(survey, preset.filters, today))
  ).length;
  const calm = attention === 0;

  return (
    <div
      role="group"
      aria-label="Alertas de encuestas"
      // Same surface as the cards above, so the buttons sit on clean white;
      // the mood lives in the side accent and the badge, not in a wash.
      className={cn(
        "relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border/60 bg-surface py-2.5 pl-5 pr-3.5 shadow-card",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute bottom-3 left-2 top-3 w-[3px] rounded-full",
          calm ? "bg-status-positive" : "bg-status-warning"
        )}
      />
      <div className="mr-auto flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            calm ? "bg-status-positive/10 text-status-positive" : "bg-status-warning/15 text-status-warning"
          )}
        >
          {calm ? (
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          ) : (
            <TriangleAlert className="h-4 w-4" strokeWidth={2} />
          )}
        </span>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[12.5px] font-bold text-text-primary">
            {calm
              ? "Todo en orden"
              : `${formatCount(attention)} ${attention === 1 ? "encuesta requiere" : "encuestas requieren"} atención`}
          </span>
          <span className="truncate text-[11px] font-medium text-text-muted">
            {calm
              ? "Ninguna encuesta por cerrar ni con participación baja"
              : "Toca una alerta para ver solo esas encuestas en la lista"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => {
          const count = countFor(preset);
          const active = filtersEqual(filters, preset.filters);
          if (count === 0 && !active) return null;
          return (
            <AlertAction
              key={preset.id}
              icon={PRESET_ICONS[preset.id]}
              label={preset.label}
              hint={preset.hint}
              value={count}
              tone={PRESET_TONE[preset.tone ?? "default"]}
              active={active}
              onClick={() => onFiltersChange(active ? NO_FILTERS : preset.filters)}
            />
          );
        })}
      </div>
    </div>
  );
}

function AlertAction({
  icon: Icon,
  label,
  hint,
  value,
  tone,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  value: number;
  tone: Tone;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          className={cn(
            "group inline-flex h-8 items-center gap-2 rounded-lg border pl-2.5 pr-1.5 text-[12px] font-semibold transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/70 bg-surface-muted/60 text-text-primary hover:border-primary/40 hover:bg-primary/[0.06]"
          )}
        >
          <Icon
            className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary-foreground" : TONE_TEXT_CLASSES[tone])}
            strokeWidth={2}
          />
          <span>{label}</span>
          <span
            className={cn(
              "flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-[11px] font-bold tabular-nums",
              active ? "bg-white/20 text-primary-foreground" : "bg-surface text-text-primary shadow-sm"
            )}
          >
            {formatCount(value)}
          </span>
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5",
              active ? "text-primary-foreground/80" : "text-text-muted"
            )}
            strokeWidth={2}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px]">{hint}</TooltipContent>
    </Tooltip>
  );
}
