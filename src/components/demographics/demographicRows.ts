import {
  SYSTEM_DEMOGRAPHICS,
  demographicTypeLabel,
  type LibraryDemographic,
} from "@/components/survey-builder/demographics";
import type { DemographicType } from "@/components/survey-builder/surveyBuilderTypes";

/**
 * The demographics list, as rows.
 *
 * Two catalogs feed it and the difference is the point of the "Tipo" column:
 * the platform's own variables, whose option lists are fixed because a value
 * only works as a filter if it lands on something the platform stores, and the
 * ones people wrote, which are theirs to shape and therefore carry a date.
 */

export type DemographicOrigin = "system" | "user";

export const ORIGIN_LABELS: Readonly<Record<DemographicOrigin, string>> = {
  system: "Del sistema",
  user: "Creado por el usuario",
};

/** Both origin labels, for the column's filter menu. */
export const ORIGIN_OPTIONS = [ORIGIN_LABELS.system, ORIGIN_LABELS.user] as const;

/**
 * Por qué editar o eliminar no está disponible en un demográfico del sistema.
 *
 * Vive aquí y no en cada superficie porque la barra de acciones y el drawer de
 * detalle dicen lo mismo sobre la misma regla: dos redacciones distintas para
 * el mismo bloqueo se leen como dos reglas distintas.
 */
export const SYSTEM_BLOCK_REASON = "Los demográficos del sistema no se pueden modificar";

export interface DemographicRow {
  /** Catalog key — unique across both catalogs. */
  id: string;
  name: string;
  origin: DemographicOrigin;
  originLabel: string;
  type: DemographicType;
  typeLabel: string;
  /** ISO day, or null for the system ones. */
  createdAt: string | null;
  optionCount: number;
  /** The wording of every option, for the row's detail popover. */
  optionLabels: readonly string[];
  /** The user who created this demographic, or null for system demographics. */
  createdBy: string | null;
}

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

/** "2025-06-23" → "23 jun 2025". Matches the survey list's date wording. */
export function formatIsoDay(iso: string | null): string {
  if (iso === null) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "—";
  const [, year, month, day] = match;
  return `${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`;
}

/** Sortable value for a date that may be absent. Missing dates sort last. */
export const createdAtValue = (row: DemographicRow): number =>
  row.createdAt === null ? Number.NEGATIVE_INFINITY : Date.parse(row.createdAt);

export function buildDemographicRows(
  library: readonly LibraryDemographic[]
): readonly DemographicRow[] {
  const systemRows: DemographicRow[] = SYSTEM_DEMOGRAPHICS.map((entry) => ({
    id: entry.key,
    name: entry.label,
    origin: "system",
    originLabel: ORIGIN_LABELS.system,
    type: entry.type,
    typeLabel: demographicTypeLabel(entry.type),
    createdAt: null,
    optionCount: entry.optionLabels.length,
    optionLabels: entry.optionLabels,
    createdBy: null,
  }));

  const userRows: DemographicRow[] = library.map((entry) => ({
    id: entry.key,
    name: entry.label,
    origin: "user",
    originLabel: ORIGIN_LABELS.user,
    type: entry.type,
    typeLabel: demographicTypeLabel(entry.type),
    createdAt: entry.createdAt ?? null,
    optionCount: entry.optionLabels.length,
    optionLabels: entry.optionLabels,
    createdBy: entry.createdBy ?? null,
  }));

  return [...systemRows, ...userRows];
}
