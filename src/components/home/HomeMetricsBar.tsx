import * as React from "react";
import { AlertTriangle, CalendarClock, Info, Layers3, PlayCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatedNumber, MiniMetricCard } from "@/components/survey-results/MiniMetricCard";
import {
  NO_FILTERS,
  filtersEqual,
  matchesFilters,
  type SurveyListFilters,
} from "@/components/survey-list/surveyListFilters";
import type { SurveyListItem } from "@/mocks/types";
import { buildDemographicRows } from "@/components/demographics";
import { useDemographicsLibrary } from "@/components/survey-builder/demographicsLibrary";
import { METRIC_PRESETS, formatCount, type MetricPreset } from "./homeMetrics";

interface HomeMetricsBarProps {
  surveys: readonly SurveyListItem[];
  /** The table's current column filters, so a card can tell it is the one in force. */
  filters: SurveyListFilters;
  onFiltersChange: (filters: SurveyListFilters) => void;
  /** Where the demographics card sends the reader. */
  onOpenDemographics: () => void;
  className?: string;
}

const PRESET_ICONS: Readonly<Record<string, LucideIcon>> = {
  open: PlayCircle,
  closing: CalendarClock,
  low: AlertTriangle,
};

/**
 * The four headline numbers above the home tabs.
 *
 * Built on the same `MiniMetricCard` the results tabs use, so the home KPIs and
 * the Favorabilidad ones are the same card rather than two designs that drift.
 *
 * Clicking one sets the table's column filters — the narrowing then shows up in
 * the Estado, Cierre and Avance menus, where someone looking for "why am I
 * seeing two rows?" would actually look. No separate chip invents a filter the
 * columns don't know about.
 */
export function HomeMetricsBar({
  surveys,
  filters,
  onFiltersChange,
  onOpenDemographics,
  className,
}: HomeMetricsBarProps) {
  // Resolved once per render so every card judges the date buckets against the
  // same instant the table does.
  const today = React.useMemo(() => new Date(), []);

  const countFor = (preset: MetricPreset) =>
    surveys.filter((survey) => matchesFilters(survey, preset.filters, today)).length;

  // Read through the same builder the demographics table renders, so this card
  // and that list always report the same number — and so creating one there
  // moves the number here immediately.
  const library = useDemographicsLibrary();
  const demographicCount = React.useMemo(
    () => buildDemographicRows(library).length,
    [library]
  );

  return (
    <section
      aria-label="Indicadores de encuestas y demográficos"
      className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}
    >
      {METRIC_PRESETS.map((preset) => {
        const count = countFor(preset);
        const active = filtersEqual(filters, preset.filters);
        return (
          <MetricCard
            key={preset.id}
            icon={PRESET_ICONS[preset.id]}
            label={preset.label}
            hint={preset.hint}
            value={count}
            tone={count === 0 ? undefined : preset.tone}
            active={active}
            // A card at zero has nothing to reveal, so it stops being a button
            // rather than filtering the table down to an empty state.
            disabled={count === 0}
            onClick={() => onFiltersChange(active ? NO_FILTERS : preset.filters)}
          />
        );
      })}

      <MetricCard
        icon={Layers3}
        label="Datos demográficos"
        hint="Demográficos disponibles para segmentar resultados, entre los del sistema y los creados por el usuario."
        value={demographicCount}
        tone={undefined}
        active={false}
        disabled={false}
        onClick={onOpenDemographics}
      />
    </section>
  );
}

function MetricCard({
  icon,
  label,
  hint,
  value,
  tone,
  active,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint: string;
  value: number;
  tone: "brand" | "warning" | "negative" | undefined;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <MiniMetricCard
      icon={icon}
      label={label}
      value={<AnimatedNumber value={value} format={formatCount} />}
      tone={tone}
      onClick={onClick}
      active={active}
      disabled={disabled}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A span, not a button: this sits inside the card's own button. */}
          <span
            role="img"
            aria-label={`Qué cuenta ${label}`}
            className="rounded-md bg-muted/30 p-1 text-muted-foreground transition-colors hover:text-text-primary"
          >
            <Info className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px]">{hint}</TooltipContent>
      </Tooltip>
    </MiniMetricCard>
  );
}
