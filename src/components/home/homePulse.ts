import type { SurveyDraft } from "@/components/survey-builder/surveyBuilderTypes";
import { buildSurveyResults } from "@/mocks/surveyResults";
import { createPublishedSurveyDraft } from "@/mocks/surveyPreviewMocks";
import type { SurveyListItem } from "@/mocks/types";
import {
  npsBandForScore,
  verdictForFavorability,
  type FavorabilityVerdict,
} from "@/components/survey-results/favorabilityScale";
import { dateValue } from "@/components/survey-list/surveyListDates";
import { OPEN_STATUS } from "./homeMetrics";

/**
 * The home's three averaged readings — participation, favorability and eNPS —
 * over every measurement that has actually collected answers.
 *
 * Each survey is read through the very same `buildSurveyResults` the results
 * screen runs, so the average here and the number someone sees after clicking
 * a row come from one source. A draft or a scheduled survey has nothing to
 * average yet, so it is left out rather than dragging the mean to zero.
 */

/** Statuses of a survey that has been in the field — the only ones with results. */
const LAUNCHED_STATUSES: readonly string[] = [OPEN_STATUS, "Finalizado"];

export const isLaunched = (survey: Pick<SurveyListItem, "status">): boolean =>
  LAUNCHED_STATUSES.includes(survey.status);

export interface PulseMetric {
  /** Mean over the surveys counted; null when nothing could be averaged. */
  value: number | null;
  /** Mean of each survey's previous measurement — the delta's baseline. */
  previous: number | null;
  /** How many surveys the mean is over. */
  count: number;
}

/** How many of the counted surveys sit in each band of the metric's scale. */
export interface PulseBreakdown<K extends string> {
  counts: Readonly<Record<K, number>>;
}

export type NpsBandId = "promotores" | "neutros" | "detractores";

/** One point of the favorability sparkline: a launched survey, in close-date order. */
export interface PulsePoint {
  id: string;
  name: string;
  value: number;
}

export interface HomePulse {
  participation: PulseMetric;
  favorability: PulseMetric &
    PulseBreakdown<FavorabilityVerdict> & {
      /** Oldest first, so the line reads left to right like a timeline. */
      series: readonly PulsePoint[];
    };
  nps: PulseMetric & PulseBreakdown<NpsBandId>;
}

/** How many measurements the sparkline reaches back over. */
const SERIES_DEPTH = 10;

const mean = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;

type SurveyWithDraft = SurveyListItem & { draft?: SurveyDraft };

/** The draft a row's results are read from — its own when the builder made it. */
const draftOf = (survey: SurveyWithDraft): SurveyDraft =>
  survey.draft ?? createPublishedSurveyDraft(survey);

export function buildHomePulse(surveys: readonly SurveyListItem[]): HomePulse {
  const launched = surveys.filter(isLaunched);
  const results = launched.map((survey) =>
    buildSurveyResults({ draft: draftOf(survey), item: survey })
  );

  const series: PulsePoint[] = launched
    .map((survey, index) => ({
      id: survey.id,
      name: survey.name,
      value: results[index].favorability,
      when: dateValue(survey.endDate),
    }))
    .sort((a, b) => a.when - b.when)
    .slice(-SERIES_DEPTH)
    .map(({ id, name, value }) => ({ id, name, value }));

  const favorabilityCounts: Record<FavorabilityVerdict, number> = {
    healthy: 0,
    watch: 0,
    critical: 0,
  };
  for (const result of results) {
    favorabilityCounts[verdictForFavorability(result.favorability)] += 1;
  }

  const npsResults = results.flatMap((result) => (result.nps ? [result.nps] : []));
  const npsCounts: Record<NpsBandId, number> = { promotores: 0, neutros: 0, detractores: 0 };
  for (const nps of npsResults) {
    npsCounts[npsBandForScore(nps.score).id as NpsBandId] += 1;
  }

  return {
    participation: {
      value: mean(results.map((result) => result.participation.rate)),
      previous: mean(results.map((result) => result.participation.previousRate)),
      count: results.length,
    },
    favorability: {
      value: mean(results.map((result) => result.favorability)),
      previous: mean(results.map((result) => result.previousFavorability)),
      count: results.length,
      counts: favorabilityCounts,
      series,
    },
    nps: {
      value: mean(npsResults.map((nps) => nps.score)),
      previous: mean(npsResults.map((nps) => nps.previousScore)),
      count: npsResults.length,
      counts: npsCounts,
    },
  };
}

/** `+3 pts` / `-2 pts` — a difference between two eNPS scores. */
export const formatNpsDelta = (value: number): string => {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded} pts`;
};

/** "1 encuesta" / "21 encuestas" — the caption under each averaged value. */
export const formatSurveyCount = (count: number): string =>
  `${count.toLocaleString("es-CO")} ${count === 1 ? "encuesta" : "encuestas"}`;
