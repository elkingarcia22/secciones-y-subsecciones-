/**
 * The list's date format, in both directions.
 *
 * Rows carry dates as the short Spanish strings they are displayed with
 * ("18 ago 2026"), so anything that sorts, compares or edits one has to go
 * through the same parse and the same format — otherwise a date edited in the
 * table comes back in a shape the sort no longer understands.
 */

/** Month abbreviations as the rows spell them, in calendar order. */
export const MONTH_ABBR = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

const MONTH_INDEX: Readonly<Record<string, number>> = Object.fromEntries(
  MONTH_ABBR.map((name, index) => [name, index])
);

/** Lowercase and accent-free, so "Ago" and "ágo" both reach "ago". */
function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** A row's date as a Date, or null for "-" and anything unparsed. */
export function parseSurveyDate(raw: string): Date | null {
  const match = /^(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const monthIndex = MONTH_INDEX[fold(month)];
  if (monthIndex === undefined) return null;
  return new Date(Number(year), monthIndex, Number(day));
}

/** A Date back in the rows' own format: "03 ago 2026". */
export function formatSurveyDate(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${day} ${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`;
}

/** Sortable value for a row's date. Unparsed dates sort last. */
export function dateValue(raw: string): number {
  const parsed = parseSurveyDate(raw);
  return parsed ? parsed.getTime() : Number.NEGATIVE_INFINITY;
}

/** Midnight today, so day comparisons ignore the current time. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
