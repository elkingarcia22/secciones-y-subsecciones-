import type { SurveyDraft } from "@/components/survey-builder";
import {
  participationBySegment,
  type SegmentFilter,
  type SurveyResults,
} from "@/mocks/surveyResults";
import type { ReportKind } from "./downloadTypes";

/**
 * What the population filter actually selected, and whether a report may be
 * built for it.
 *
 * The anonymity threshold already governs every breakdown the product shows —
 * a heatmap cell, a participation row and an eNPS column all read "Reservado"
 * below it. The download center used to be the one door that ignored it: a
 * reader could filter a whole report to an área of one person and get every
 * number that person gave. So the same rule is applied once, here, and every
 * report asks it the same question.
 *
 * The count comes from `participationBySegment`, not from the filtered
 * aggregate: the aggregate narrows by a modelled share rather than by the
 * group's real size, and the number that has to protect somebody must be the
 * one the participation table shows.
 */
export interface PopulationScope {
  /** Responses the selected population actually holds. */
  completed: number;
  /** Minimum responses a group needs before its results can be reported. */
  threshold: number;
  /** The survey promised anonymity, so small groups stay reserved. */
  anonymous: boolean;
  /** Under the threshold on an anonymous survey: nothing may be reported. */
  reserved: boolean;
  /** Nobody in the selection answered: there is no file to build. */
  empty: boolean;
  /** "Área: Comercial, Finanzas", or "Toda la empresa" with no filter. */
  label: string;
}

const EVERYONE = "Toda la empresa";

export function populationScope(
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): PopulationScope {
  const anonymous = draft.visibility === "anonymous";
  const threshold = results.threshold;

  if (filters.length === 0) {
    return {
      completed: results.participation.completed,
      threshold,
      anonymous,
      reserved: false,
      empty: results.participation.completed === 0,
      label: EVERYONE,
    };
  }

  // The drawer filters by one demographic at a time, so several options are a
  // union: "Marketing o Comercial" is both groups' people, not their overlap.
  const segment = results.segments.find((candidate) => candidate.key === filters[0].key);
  if (!segment) {
    return {
      completed: results.participation.completed,
      threshold,
      anonymous,
      reserved: false,
      empty: false,
      label: EVERYONE,
    };
  }

  const chosenIds = new Set(filters.map((filter) => filter.optionId));
  const rows = participationBySegment(results, segment, []).filter((row) => chosenIds.has(row.id));
  const completed = rows.reduce((sum, row) => sum + row.completed, 0);

  return {
    completed,
    threshold,
    anonymous,
    reserved: anonymous && completed < threshold,
    empty: completed === 0,
    label: rows.length > 0 ? `${segment.label}: ${rows.map((row) => row.label).join(", ")}` : EVERYONE,
  };
}

/** Why a report cannot be produced for this population, or null when it can. */
export function blockedReason(scope: PopulationScope): string | null {
  if (scope.reserved) {
    return scope.completed === 1
      ? `Esta selección tiene 1 respuesta y el mínimo por grupo es ${scope.threshold}. Sus resultados quedan reservados para proteger el anonimato de la encuesta.`
      : `Esta selección tiene ${scope.completed} respuestas y el mínimo por grupo es ${scope.threshold}. Sus resultados quedan reservados para proteger el anonimato de la encuesta.`;
  }
  if (scope.empty) return "Esta selección no tiene respuestas: no hay nada que reportar.";
  return null;
}

/**
 * Whether the population filter means anything for a report.
 *
 * An anonymous survey stores no demographic next to a comment or an individual
 * answer — that is the promise, not an omission — so the three record-level
 * reports cannot be narrowed by one. Offering the filter there would promise a
 * cut the file never makes, so those reports drop it instead.
 */
export function populationFilterApplies(kind: ReportKind, anonymous: boolean): boolean {
  if (!anonymous) return true;
  return kind === "pdf" || kind === "xlsx";
}
