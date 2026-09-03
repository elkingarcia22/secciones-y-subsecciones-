/**
 * The survey list's column filters, and the rules that apply them.
 *
 * Shared rather than private to the table because the home metric cards are
 * shortcuts *to these filters*: a card's number is `rows.filter(matchesFilters)`
 * over the very same predicate the table runs, so the count on the card and the
 * rows the click reveals cannot disagree.
 */

export interface SurveyFilterableRow {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
}

/** Buckets offered by the "Cierre" column, in menu order. */
export const CLOSE_BUCKETS = [
  "Cierra en 7 días o menos",
  "Cierra en más de 7 días",
  "Ya cerró",
] as const;

/** Buckets offered by the "Avance" column, in menu order. */
export const PROGRESS_BUCKETS = ["Menos de 50%", "50% a 79%", "80% o más"] as const;

/**
 * The participation a running survey is expected to reach. Same line the
 * "Avance" column draws between "50% a 79%" and "80% o más".
 */
export const PARTICIPATION_TARGET = 80;

/** The one bucket of the "Tendencia" dimension: on its current pace, the
 *  survey will close short of `PARTICIPATION_TARGET`. */
export const RISK_BUCKETS = ["Tendencia por debajo de la meta"] as const;

export type CloseBucket = (typeof CLOSE_BUCKETS)[number];
export type ProgressBucket = (typeof PROGRESS_BUCKETS)[number];
export type RiskBucket = (typeof RISK_BUCKETS)[number];

/** How near the close counts as "7 días o menos". */
export const CLOSING_SOON_DAYS = 7;

export interface SurveyListFilters {
  type: readonly string[];
  status: readonly string[];
  close: readonly string[];
  progress: readonly string[];
  /**
   * Not offered by any column menu: a projection over start, close and
   * progress rather than a value of one column. The home alert that sets it
   * is the only surface that does, and the table's "limpiar filtros" clears it
   * along with the rest.
   */
  risk: readonly string[];
  /**
   * Not offered by any column menu either, and unlike every other column this
   * one names rows directly instead of a bucket they fall into: the home's
   * negative-results alert flags specific surveys by what their own results
   * say, which the table has no column for at all.
   */
  ids: readonly string[];
}

export const NO_FILTERS: SurveyListFilters = {
  type: [],
  status: [],
  close: [],
  progress: [],
  risk: [],
  ids: [],
};

const MONTHS: Readonly<Record<string, number>> = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
};

/** Days from `today` to a Spanish short date ("28 ago 2026"); null if unparsed. */
export function daysUntil(raw: string, today: Date): number | null {
  const match = /^(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (month === undefined) return null;
  const due = new Date(Number(match[3]), month, Number(match[1]));
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((due.getTime() - midnight.getTime()) / 86_400_000);
}

/** A row with no readable close date belongs to no bucket, so it never matches. */
export function closeBucketOf(row: SurveyFilterableRow, today: Date): CloseBucket | null {
  const days = daysUntil(row.endDate, today);
  if (days === null) return null;
  if (days < 0) return "Ya cerró";
  return days <= CLOSING_SOON_DAYS ? "Cierra en 7 días o menos" : "Cierra en más de 7 días";
}

export function progressBucketOf(row: SurveyFilterableRow): ProgressBucket {
  if (row.progress < 50) return "Menos de 50%";
  return row.progress < PARTICIPATION_TARGET ? "50% a 79%" : "80% o más";
}

/**
 * Where participation will land on close day if it keeps today's pace:
 * progress so far plus (progress per elapsed day × days left), capped at 100.
 * Null for a survey that has not started or has already closed, or whose
 * dates cannot be read — there is no pace to extend.
 */
export function projectedProgress(row: SurveyFilterableRow, today: Date): number | null {
  const untilStart = daysUntil(row.startDate, today);
  const untilEnd = daysUntil(row.endDate, today);
  if (untilStart === null || untilEnd === null) return null;
  const elapsed = -untilStart;
  if (elapsed <= 0 || untilEnd < 0) return null;
  const pace = row.progress / elapsed;
  return Math.min(100, row.progress + pace * untilEnd);
}

/** A running survey whose projection falls short of the target; null otherwise. */
export function riskBucketOf(row: SurveyFilterableRow, today: Date): RiskBucket | null {
  const projected = projectedProgress(row, today);
  if (projected === null || projected >= PARTICIPATION_TARGET) return null;
  return "Tendencia por debajo de la meta";
}

/** An empty set for a column means "no narrowing on that column". */
export function matchesFilters(
  row: SurveyFilterableRow,
  filters: SurveyListFilters,
  today: Date
): boolean {
  if (filters.type.length > 0 && !filters.type.includes(row.type)) return false;
  if (filters.status.length > 0 && !filters.status.includes(row.status)) return false;
  if (filters.close.length > 0) {
    const bucket = closeBucketOf(row, today);
    if (bucket === null || !filters.close.includes(bucket)) return false;
  }
  if (filters.progress.length > 0 && !filters.progress.includes(progressBucketOf(row))) {
    return false;
  }
  if (filters.risk.length > 0) {
    const bucket = riskBucketOf(row, today);
    if (bucket === null || !filters.risk.includes(bucket)) return false;
  }
  if (filters.ids.length > 0 && !filters.ids.includes(row.id)) return false;
  return true;
}

export const hasAnyFilter = (filters: SurveyListFilters): boolean =>
  filters.type.length > 0 ||
  filters.status.length > 0 ||
  filters.close.length > 0 ||
  filters.progress.length > 0 ||
  filters.risk.length > 0 ||
  filters.ids.length > 0;

const sameValues = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && [...a].sort().every((value, index) => value === [...b].sort()[index]);

/** Used by the metric cards to tell whether they are the narrowing in force. */
export const filtersEqual = (a: SurveyListFilters, b: SurveyListFilters): boolean =>
  sameValues(a.type, b.type) &&
  sameValues(a.status, b.status) &&
  sameValues(a.close, b.close) &&
  sameValues(a.progress, b.progress) &&
  sameValues(a.risk, b.risk) &&
  sameValues(a.ids, b.ids);

/** Adds or removes one value from one column, leaving the others alone. */
export function toggleFilterValue(
  filters: SurveyListFilters,
  column: keyof SurveyListFilters,
  value: string
): SurveyListFilters {
  const current = filters[column];
  return {
    ...filters,
    [column]: current.includes(value)
      ? current.filter((candidate) => candidate !== value)
      : [...current, value],
  };
}
