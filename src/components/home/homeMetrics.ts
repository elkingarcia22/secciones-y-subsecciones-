import { AlertTriangle, CalendarClock, type LucideIcon } from "lucide-react";
import { CLOSING_SOON_DAYS, NO_FILTERS, type SurveyListFilters } from "@/components/survey-list/surveyListFilters";

/**
 * What each home card counts, expressed as the column filters it applies.
 *
 * A card is nothing but a shortcut to the table's own filters, so its number is
 * the row count under `filters` and its click sets exactly those — the card and
 * the column menus can never tell different stories.
 */

/** The status a launched-but-unfinished measurement carries in the list. */
export const OPEN_STATUS = "En curso";

export interface MetricPreset {
  id: string;
  label: string;
  /** One sentence on what the count means, for the button's tooltip. */
  hint: string;
  tone: "brand" | "warning" | "negative" | undefined;
  filters: SurveyListFilters;
}

export const METRIC_PRESETS: readonly MetricPreset[] = [
  {
    id: "closing",
    label: "Por cerrar",
    hint: `Encuestas en curso que cierran en ${CLOSING_SOON_DAYS} días o menos.`,
    tone: "brand",
    filters: {
      ...NO_FILTERS,
      status: [OPEN_STATUS],
      close: ["Cierra en 7 días o menos"],
    },
  },
  {
    id: "low",
    label: "Participación baja",
    hint: "Encuestas en curso con menos del 50% de participación hoy.",
    tone: "negative",
    filters: {
      ...NO_FILTERS,
      status: [OPEN_STATUS],
      progress: ["Menos de 50%"],
    },
  },
];

export const formatCount = (value: number): string => value.toLocaleString("es-CO");

/** One icon per preset id, shared by every surface that renders these presets. */
export const PRESET_ICONS: Readonly<Record<string, LucideIcon>> = {
  closing: CalendarClock,
  low: AlertTriangle,
};
