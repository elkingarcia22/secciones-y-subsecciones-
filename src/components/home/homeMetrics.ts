import {
  CLOSING_SOON_DAYS,
  NO_FILTERS,
  type SurveyListFilters,
} from "@/components/survey-list/surveyListFilters";

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
  /** Shown in the same info tooltip the Favorabilidad row uses. */
  hint: string;
  tone: "brand" | "warning" | "negative" | undefined;
  filters: SurveyListFilters;
}

export const METRIC_PRESETS: readonly MetricPreset[] = [
  {
    id: "open",
    label: "En curso",
    hint: "Mediciones abiertas que siguen recibiendo respuestas. Filtra la columna Estado.",
    tone: "brand",
    filters: { ...NO_FILTERS, status: [OPEN_STATUS] },
  },
  {
    id: "closing",
    label: "Por cerrar",
    hint: `Mediciones abiertas cuyo cierre llega en ${CLOSING_SOON_DAYS} días o menos. Filtra Estado y Cierre.`,
    tone: "warning",
    filters: {
      ...NO_FILTERS,
      status: [OPEN_STATUS],
      close: ["Cierra en 7 días o menos"],
    },
  },
  {
    id: "low",
    label: "Participación baja",
    hint: "Mediciones abiertas por debajo del 50% de avance: todavía hay tiempo de recordarles. Filtra Estado y Avance.",
    tone: "negative",
    filters: {
      ...NO_FILTERS,
      status: [OPEN_STATUS],
      progress: ["Menos de 50%"],
    },
  },
];

export const formatCount = (value: number): string => value.toLocaleString("es-CO");
