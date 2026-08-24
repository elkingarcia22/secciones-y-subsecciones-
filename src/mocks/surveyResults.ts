import { flattenSections, type SurveyDraft, type SurveyQuestion } from "@/components/survey-builder";
import type { SurveyListItem } from "./types";

/**
 * Survey results — the aggregate a finished measurement produces.
 *
 * Derived from the survey's own `SurveyDraft`, not invented alongside it: the
 * sections, questions and demographics that the preview shows are the same ones
 * the results report on, so the two views can never drift. The numbers are mock
 * but *deterministic* — hashed from each id — so a cell keeps its value across
 * re-renders, tab switches and reloads. A dashboard whose figures move when you
 * look away is unreadable.
 *
 * Everything here is pure. No `Math.random`, no `Date.now`.
 */

/** Five-point favorability scale: index 0 = muy desfavorable … 4 = muy favorable. */
export type Distribution = readonly [number, number, number, number, number];

export interface QuestionResult {
  id: string;
  statement: string;
  /** Scales aggregate into a score; open and choice questions do not. */
  scored: boolean;
  /** Responses received. Lower than the total when the question is optional. */
  n: number;
  /** Responses that chose "No sabe / no responde" on a Likert scale. */
  nsnr: number;
  /** Average on the 1–5 scale, or null when the question isn't scored. */
  score: number | null;
  /** Share of responses in the top two boxes, or null when not scored. */
  favorability: number | null;
  distribution: Distribution | null;
}

export interface SectionResult {
  id: string;
  title: string;
  numbering: string;
  depth: number;
  score: number;
  favorability: number;
  n: number;
  nsnr: number;
  questions: readonly QuestionResult[];
  /** Direct subsections, so the tree survives into the report. */
  children: readonly SectionResult[];
}

export interface SegmentOption {
  id: string;
  label: string;
}

/** A demographic the survey collected, usable as a breakdown. */
export interface SegmentDefinition {
  key: string;
  label: string;
  /** True when the value was preloaded rather than asked. */
  preloaded: boolean;
  /** True when each option is a person: one row per respondent, never a grid
   * column. The participation view handles it; the heatmap refuses it. */
  perPerson: boolean;
  options: readonly SegmentOption[];
}

/**
 * One value of a demographic used to narrow the population before breaking it
 * down — e.g. "break down by Área but only count people in Colombia".
 */
export interface SegmentFilter {
  key: string;
  optionId: string;
}

export interface ParticipationRow {
  id: string;
  label: string;
  completed: number;
  inProgress: number;
  invited: number;
  rate: number;
  /** Fewer responses than the anonymity threshold: counts show, results don't. */
  belowThreshold: boolean;
  /** A handful of real respondents rather than none: the heatmap can show its
   * real numbers almost everywhere, with the odd cell still unanswered. */
  sparse?: boolean;
}

export interface HeatmapCell {
  score: number | null;
  n: number;
  /** Invited people in the group — the participation view's "invited". */
  participants: number;
  /** Null score because the group is too small to report on. */
  masked: boolean;
  /** True when the parent row has no 1–5 scale at all — an open, choice or NPS
   * question, or a section that carries only those. There is no score to
   * protect and none to fake, so every cell says so. */
  unscored?: boolean;
}

export interface HeatmapRow {
  id: string;
  label: string;
  numbering: string;
  depth: number;
  /** Score across every segment, the row's own total. Null when the row has
   * nothing on the 1–5 scale (unscored questions, unscored-only sections). */
  total: number | null;
  cells: readonly HeatmapCell[];
  /** Sections nest questions and subsections; questions are the leaves. */
  kind: "section" | "question";
  /** Rows directly under a section: its questions first, then its subsections. */
  children: readonly HeatmapRow[];
}

export interface HeatmapData {
  columns: readonly SegmentOption[];
  rows: readonly HeatmapRow[];
  /** Per-column score across all sections, shown as the footer row. */
  columnTotals: readonly (number | null)[];
  maskedColumns: number;
}

export type NpsBand = "detractor" | "passive" | "promoter";

export interface NpsResult {
  score: number;
  previousScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  n: number;
}

export interface Verbatim {
  id: string;
  band: NpsBand;
  question: string;
  text: string;
  segment: string;
}

export interface TrendPoint {
  label: string;
  favorability: number;
  participation: number;
}

export interface SurveyResults {
  favorability: number;
  previousFavorability: number;
  participation: { completed: number; inProgress: number; invited: number; rate: number; previousRate: number };
  /** Null when the survey asked no NPS question. */
  nps: NpsResult | null;
  threshold: number;
  sections: readonly SectionResult[];
  segments: readonly SegmentDefinition[];
  trend: readonly TrendPoint[];
  verbatims: readonly Verbatim[];
  /** Flat list of every scored question, worst first — the actionable order. */
  rankedQuestions: readonly (QuestionResult & { sectionTitle: string })[];
}

// --- Deterministic pseudo-randomness -----------------------------------------

/** FNV-1a, then an xorshift finisher: same id in, same number out. */
export function unitFromSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

/** A value in [center - spread, center + spread], stable for `seed`. */
export const jitter = (seed: string, center: number, spread: number): number =>
  center + (unitFromSeed(seed) * 2 - 1) * spread;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round1 = (value: number): number => Math.round(value * 10) / 10;

// --- Scores ------------------------------------------------------------------

/**
 * Base score per root section.
 *
 * Deliberate rather than random: a climate result is only readable if it tells a
 * story — strategy and collaboration hold up, recognition, growth and wellbeing
 * are where the organization is losing people. Random noise across seven blocks
 * produces a dashboard nobody can draw a conclusion from.
 */
const ROOT_BASE_SCORES: readonly number[] = [3.9, 3.4, 4.0, 3.2, 2.9, 2.7, 3.6];

const DEFAULT_BASE_SCORE = 3.4;

const rootBaseScore = (rootIndex: number): number =>
  ROOT_BASE_SCORES[rootIndex] ?? DEFAULT_BASE_SCORE;

/** Weights over the five boxes for a given average, then normalized. */
function distributionFor(score: number, n: number, seed: string): Distribution {
  const spread = jitter(`${seed}:spread`, 1.05, 0.25);
  const weights = [1, 2, 3, 4, 5].map((box, index) => {
    const distance = Math.abs(box - score) / spread;
    return Math.exp(-distance * distance) * jitter(`${seed}:w${index}`, 1, 0.18);
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const counts = weights.map((weight) => Math.round((weight / totalWeight) * n));

  // Rounding rarely lands on `n`; the difference goes to the modal box, which is
  // the one place a ±2 correction cannot change how the bar reads.
  const modal = counts.indexOf(Math.max(...counts));
  counts[modal] += n - counts.reduce((sum, count) => sum + count, 0);

  return [counts[0], counts[1], counts[2], counts[3], counts[4]];
}

const favorabilityOf = (distribution: Distribution, n: number): number =>
  n === 0 ? 0 : Math.round(((distribution[3] + distribution[4]) / n) * 1000) / 10;

const isScored = (question: SurveyQuestion): boolean =>
  question.type === "scale" && question.scale.kind !== "nps";

function buildQuestionResult(
  question: SurveyQuestion,
  baseScore: number,
  responses: number
): QuestionResult {
  // Optional questions lose some responses; open text loses many more.
  const dropRate = question.required ? 0.03 : question.type === "open" ? 0.55 : 0.14;
  const n = Math.round(responses * (1 - dropRate * unitFromSeed(`${question.id}:drop`)));
  // Only Likert offers the opt-out step; a small share of people takes it.
  const nsnr =
    isScored(question) && question.scale.allowDontKnow
      ? Math.round(responses * clamp(jitter(`${question.id}:nsnr`, 0.05, 0.025), 0.01, 0.17))
      : 0;

  if (!isScored(question)) {
    return { id: question.id, statement: question.statement, scored: false, n, nsnr, score: null, favorability: null, distribution: null };
  }

  const score = clamp(jitter(`${question.id}:score`, baseScore, 0.32), 1.2, 4.9);
  const distribution = distributionFor(score, n, question.id);

  return {
    id: question.id,
    statement: question.statement,
    scored: true,
    n,
    nsnr,
    score: round1(score),
    favorability: favorabilityOf(distribution, n),
    distribution,
  };
}

/** Weighted average of the scored children, or 0 when nothing is scored. */
function aggregate(
  parts: readonly { score: number | null; favorability: number | null; n: number; nsnr: number }[]
): { score: number; favorability: number; n: number; nsnr: number } {
  const scored = parts.filter((part) => part.score !== null && part.n > 0);
  const weight = scored.reduce((sum, part) => sum + part.n, 0);
  if (weight === 0)
    return {
      score: 0,
      favorability: 0,
      n: 0,
      nsnr: parts.reduce((sum, part) => sum + part.nsnr, 0),
    };

  const score = scored.reduce((sum, part) => sum + (part.score ?? 0) * part.n, 0) / weight;
  const favorability =
    scored.reduce((sum, part) => sum + (part.favorability ?? 0) * part.n, 0) / weight;

  return {
    score: round1(score),
    favorability: Math.round(favorability * 10) / 10,
    n: weight,
    nsnr: parts.reduce((sum, part) => sum + part.nsnr, 0),
  };
}

function buildSectionResults(
  draft: SurveyDraft,
  completed: number
): readonly SectionResult[] {
  const build = (
    section: SurveyDraft["sections"][number],
    numbering: string,
    depth: number,
    rootIndex: number
  ): SectionResult => {
    const base = clamp(
      jitter(`${section.id}:base`, rootBaseScore(rootIndex), depth === 1 ? 0 : 0.3),
      1.4,
      4.7
    );

    const questions = section.questions.map((question) =>
      buildQuestionResult(question, base, completed)
    );
    const children = section.children.map((child, index) =>
      build(child, `${numbering}.${index + 1}`, depth + 1, rootIndex)
    );

    const totals = aggregate([...questions, ...children]);

    return {
      id: section.id,
      title: section.title,
      numbering,
      depth,
      ...totals,
      questions,
      children,
    };
  };

  return draft.sections.map((section, index) => build(section, `${index + 1}`, 1, index));
}

// --- Segments ----------------------------------------------------------------

/**
 * Group sizes with a long tail.
 *
 * A real organization is not evenly divided: the first area holds a fifth of the
 * company and the last holds four people. The decay matters because those small
 * groups are exactly the ones the anonymity threshold has to protect — an even
 * split would hide the case the product most needs to handle.
 */
function groupSizes(total: number, options: readonly SegmentOption[], seed: string): number[] {
  const weights = options.map(
    (option, index) => (1 / (1 + index * index * 0.55)) * jitter(`${seed}:${option.id}`, 1, 0.22)
  );
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const sizes = weights.map((weight) => Math.max(1, Math.round((weight / totalWeight) * total)));

  const drift = total - sizes.reduce((sum, size) => sum + size, 0);
  sizes[0] = Math.max(1, sizes[0] + drift);
  return sizes;
}

function buildSegments(draft: SurveyDraft): readonly SegmentDefinition[] {
  return draft.demographics.enabled
    ? draft.demographics.fields
        .filter((field) => field.options.length > 0)
        .map((field) => ({
          key: field.catalogKey ?? field.id,
          label: field.label,
          preloaded: field.preloadable && !field.visible,
          perPerson: field.perPerson ?? false,
          options: field.options.map((option) => ({ id: option.id, label: option.label })),
        }))
    : [];
}

/**
 * How much a filter narrows the population, deterministically.
 *
 * The block is mock, so the intersection cannot be computed from real rows; a
 * stable hash gives each group its own realistic-looking share of the people
 * who match the filter instead. Filters multiply: País × Género narrows further
 * than País alone, and every group keeps a distinct seed so a small one visibly
 * drops below the anonymity threshold.
 */
function coverageFor(filter: SegmentFilter, segment: SegmentDefinition, groupId: string): number {
  return clamp(
    jitter(`${filter.key}:${filter.optionId}:${segment.key}:${groupId}`, 0.45, 0.16),
    0.08,
    0.94
  );
}

/**
 * The filters of one demographic, grouped together.
 *
 * Several options of the same demographic are a *union* — "Área: Producto o
 * Tecnología" is more people than either alone — while different demographics
 * *intersect*: "País: Colombia" and "Género: Mujer" is fewer than either. Two
 * filters on one key multiplied would have made a wider selection read as a
 * narrower population, which is the one thing a filter must never do.
 */
function groupFiltersByKey(
  filters: readonly SegmentFilter[]
): readonly (readonly SegmentFilter[])[] {
  const byKey = new Map<string, SegmentFilter[]>();
  for (const filter of filters) {
    const group = byKey.get(filter.key);
    if (group) group.push(filter);
    else byKey.set(filter.key, [filter]);
  }
  return [...byKey.values()];
}

/** How many options each demographic has, so a union knows what "all" means. */
function optionCountsByKey(
  segments: readonly SegmentDefinition[]
): ReadonlyMap<string, number> {
  return new Map(segments.map((segment) => [segment.key, segment.options.length]));
}

/**
 * The share of a group the whole filter set keeps: union inside a demographic,
 * product across them.
 *
 * The union interpolates from one option's own calibrated coverage up to the
 * whole population as the reader picks more, reaching exactly 1 when every
 * option is selected — picking all the areas has to mean the same thing as not
 * filtering by área at all. Summing the coverages instead would have made two
 * of ten areas read as 90% of the company; a probabilistic OR saturates almost
 * as fast. One option per key stays bit-for-bit what it was, so no existing
 * view moves.
 */
function combinedCoverage(
  filters: readonly SegmentFilter[],
  optionCounts: ReadonlyMap<string, number>,
  coverage: (filter: SegmentFilter) => number
): number {
  return groupFiltersByKey(filters).reduce((total, group) => {
    const picked = group.length;
    const available = optionCounts.get(group[0].key) ?? picked;
    const mean = group.reduce((sum, filter) => sum + coverage(filter), 0) / picked;

    // Nothing left to widen towards: a one-option demographic, or every option
    // picked, is the demographic saying nothing about who is included.
    if (available <= 1) return total * clamp(mean, 0, 1);
    const towardsEveryone = (picked - 1) / (available - 1);
    return total * clamp(mean + (1 - mean) * towardsEveryone, 0, 1);
  }, 1);
}

/** A segment with fewer options than this cannot spare a group to be stalled. */
const MIN_GROUPS_FOR_A_STALLED_ONE = 3;

/** At most this many groups per segment are shown as barely started. */
const MAX_STALLED_GROUPS = 2;

/** Share of a sparse group's heatmap cells that read as unanswered — the rest
 * show its (few) real responses instead of masking the whole column. */
const SPARSE_GAP_RATE = 0.04;

/**
 * Participation per option of one segment, invited, in progress and completed.
 *
 * Filters narrow each group's invited count before the rate applies, so a
 * group that was fine unfiltered can fall below the threshold and read as
 * "reservado".
 */
export function participationBySegment(
  results: SurveyResults,
  segment: SegmentDefinition,
  filters: readonly SegmentFilter[] = []
): readonly ParticipationRow[] {
  const invited = groupSizes(results.participation.invited, segment.options, `${segment.key}:inv`);
  const counts = optionCountsByKey(results.segments);
  const coverage = (groupId: string) =>
    combinedCoverage(filters, counts, (filter) => coverageFor(filter, segment, groupId));

  // A per-person segment lists the invited roster itself: each option is one
  // respondent, not a group, so every count is a matter of one. The anonymity
  // threshold then covers every row — a single response is never reported, and
  // the participation view is exactly the view meant to see the dots.
  if (segment.perPerson) {
    // The three states split along the survey's own headline mix, not along an
    // arbitrary threshold: draw one stable number per person and cut it at the
    // participation rate, then at the share still in progress. Everyone past
    // that second cut has not opened the survey — which is the row this view
    // exists to find, so it has to actually appear.
    const doneShare = clamp(results.participation.rate / 100, 0, 1);
    const progressShare = clamp(
      results.participation.inProgress / Math.max(1, results.participation.invited),
      0,
      1 - doneShare
    );
    return segment.options.map((option) => {
      const unit = unitFromSeed(`${segment.key}:${option.id}:state`);
      const done = unit < doneShare;
      const partial = !done && unit < doneShare + progressShare;
      const completed = done ? 1 : 0;
      return {
        id: option.id,
        label: option.label,
        completed,
        inProgress: partial ? 1 : 0,
        invited: 1,
        rate: completed === 0 ? 0 : 100,
        belowThreshold: completed < results.threshold,
      };
    });
  }

  const groupInvited = segment.options.map((option, index) =>
    Math.max(1, Math.round(invited[index] * coverage(option.id)))
  );

  // Groups the survey mostly missed. The jitter around the overall rate never
  // lands one near empty, so every breakdown reads as if the whole company
  // engaged evenly — and the one row this table exists to surface, the group
  // that has to be chased, is the row it can never show. A few real responses
  // still get through, though: almost nobody answering is what "chase this
  // group" looks like, not literally nobody, and a wholly silent group would
  // leave the heatmap with nothing to show for every one of its cells instead
  // of the odd unanswered one.
  //
  // Which group stalls is not free: everyone in it counts against the survey's
  // own "faltan" number, so only the smallest groups are eligible, and only
  // while they fit inside that budget. A segment whose smallest group is bigger
  // than the people still missing keeps every group active rather than
  // contradicting the headline.
  const stalled = new Set<string>();
  if (segment.options.length >= MIN_GROUPS_FOR_A_STALLED_ONE) {
    const missingBudget = Math.max(
      0,
      results.participation.invited -
        results.participation.completed -
        results.participation.inProgress
    );
    let spent = 0;
    const bySize = segment.options
      .map((option, index) => ({ id: option.id, size: groupInvited[index] }))
      .sort((a, b) => a.size - b.size || a.id.localeCompare(b.id));
    for (const group of bySize) {
      if (stalled.size >= MAX_STALLED_GROUPS) break;
      if (spent + group.size > missingBudget) break;
      stalled.add(group.id);
      spent += group.size;
    }
  }

  return segment.options.map((option, index) => {
    if (stalled.has(option.id)) {
      const size = groupInvited[index];
      const sparseRate = clamp(jitter(`${segment.key}:${option.id}:sparse`, 8, 4), 3, 15);
      const completed = Math.max(1, Math.round((size * sparseRate) / 100));
      return {
        id: option.id,
        label: option.label,
        completed,
        inProgress: 0,
        invited: size,
        rate: size === 0 ? 0 : Math.round((completed / size) * 1000) / 10,
        belowThreshold: completed < results.threshold,
        sparse: true,
      };
    }
    const size = groupInvited[index];
    const rate = clamp(jitter(`${segment.key}:${option.id}:rate`, results.participation.rate, 22), 0, 100);
    const completed = Math.min(size, Math.round((size * rate) / 100));
    // A share of what is left after those who already answered.
    const progressRate = clamp(jitter(`${segment.key}:${option.id}:progress`, results.participation.inProgress / Math.max(1, size) * 100, 4), 0, 100);
    const inProgress = Math.min(size - completed, Math.round((size * progressRate) / 100));

    return {
      id: option.id,
      label: option.label,
      completed,
      inProgress,
      invited: size,
      rate: size === 0 ? 0 : Math.round((completed / size) * 1000) / 10,
      belowThreshold: completed < results.threshold,
    };
  });
}

/**
 * The section × segment grid, small groups masked, questions in the tree.
 *
 * Rows build the survey's own tree: every section carries its questions and
 * subsections as children, so the heatmap can walk it the same way the survey
 * was written. A section with nothing on the 1–5 scale — only an NPS, only open
 * text — has no score to protect nor to fake; it and its questions render as
 * "Sin escala" instead of putting a fabricated low number in the grid, which is
 * the exact mistake that makes a heatmap point at the wrong problem.
 */
export function heatmapBySegment(
  results: SurveyResults,
  segment: SegmentDefinition,
  filters: readonly SegmentFilter[] = []
): HeatmapData {
  const participation = participationBySegment(results, segment, filters);

  const sectionCell = (seed: string, center: number, group: ParticipationRow): HeatmapCell => {
    if (group.belowThreshold)
      return { score: null, n: group.completed, participants: group.invited, masked: true };
    // A sparse group's handful of respondents did not reach every question —
    // the odd cell reads as unanswered rather than every one of them, which is
    // what actually happens when a group barely engaged instead of what a
    // uniform "no data at all" would suggest.
    if (group.sparse && unitFromSeed(`gap:${seed}`) < SPARSE_GAP_RATE) {
      return { score: null, n: 0, participants: group.invited, masked: true };
    }
    // A wide spread on purpose: the section average clusters a grid in the
    // middle two bands, so the panorama the heatmap exists for — every shade
    // of the scale at a glance — never shows. Spread the cell toward both
    // ends around the section's own truth, and the grid reads as a gradient.
    const score = clamp(jitter(seed, center, 2.2), 1.1, 5);
    return {
      score: round1(score),
      n: group.completed,
      participants: group.invited,
      masked: false,
    };
  };

  const buildSectionRow = (section: SectionResult): HeatmapRow => {
    const unscored = section.n === 0;
    const questionRows: HeatmapRow[] = section.questions.map((question) => {
      const cells: HeatmapCell[] = participation.map((group) => {
        if (question.score === null) {
          return {
            score: null,
            n: group.completed,
            participants: group.invited,
            masked: false,
            unscored: true,
          };
        }
        return sectionCell(`${question.id}:${group.id}`, question.score, group);
      });
      return {
        id: question.id,
        label: question.statement || "Pregunta sin enunciado",
        numbering: "",
        depth: section.depth + 1,
        total: question.score,
        kind: "question" as const,
        cells,
        children: [],
      };
    });

    return {
      id: section.id,
      label: section.title,
      numbering: section.numbering,
      depth: section.depth,
      total: unscored ? null : section.score,
      kind: "section" as const,
      cells: participation.map((group) =>
        unscored
          ? { score: null, n: group.completed, participants: group.invited, masked: false, unscored: true }
          : sectionCell(`${section.id}:${group.id}`, section.score, group)
      ),
      children: [...questionRows, ...section.children.map(buildSectionRow)],
    };
  };

  const rows = results.sections.map(buildSectionRow);

  // Every section row of the tree, questions excluded: the column total is the
  // average of the structural units, and anyone wanting a question's number
  // can read its row.
  const sectionRows: HeatmapRow[] = [];
  const collectSections = (row: HeatmapRow): void => {
    sectionRows.push(row);
    row.children.forEach(collectSections);
  };
  rows.forEach(collectSections);

  const columnTotals = participation.map((group, index) => {
    if (group.belowThreshold) return null;
    const visible = sectionRows
      .map((row) => row.cells[index].score)
      .filter((score): score is number => score !== null);
    return round1(visible.reduce((sum, score) => sum + score, 0) / (visible.length || 1));
  });

  return {
    columns: participation.map((group) => ({ id: group.id, label: group.label })),
    rows,
    columnTotals,
    maskedColumns: participation.filter((group) => group.belowThreshold).length,
  };
}

/**
 * How much a filter narrows one question's population, and how that subgroup
 * differs from the whole — deterministic, so the same filter combination
 * always reads the same on every question, the same way `coverageFor` keeps
 * the heatmap's columns stable.
 */
function questionCoverage(
  filters: readonly SegmentFilter[],
  optionCounts: ReadonlyMap<string, number>,
  questionId: string
): number {
  return combinedCoverage(filters, optionCounts, (filter) =>
    clamp(jitter(`${filter.key}:${filter.optionId}:${questionId}`, 0.55, 0.18), 0.1, 0.95)
  );
}

function narrowQuestion(
  question: QuestionResult,
  filterSeed: string,
  coverage: number
): QuestionResult {
  if (!question.scored || question.score === null) return question;

  const n = Math.max(0, Math.round(question.n * coverage));
  const nsnr = Math.round(question.nsnr * coverage);
  if (n === 0) return { ...question, n, nsnr, score: null, favorability: null, distribution: null };

  const score = clamp(jitter(`${question.id}:${filterSeed}:score`, question.score, 0.4), 1.2, 4.9);
  const distribution = distributionFor(score, n, `${question.id}:${filterSeed}`);

  return { ...question, n, nsnr, score: round1(score), favorability: favorabilityOf(distribution, n), distribution };
}

/**
 * The section tree narrowed to a set of deep filters — the same population a
 * "Filtrar a fondo" choice narrows in the heatmap, applied to the questions
 * view instead of a grid of segment columns. Identity when there are no
 * filters, so the unfiltered view stays exactly today's numbers rather than a
 * rounding-noise twin of them.
 */
export function sectionResultsForFilters(
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): readonly SectionResult[] {
  if (filters.length === 0) return results.sections;

  const filterSeed = filters.map((filter) => `${filter.key}:${filter.optionId}`).join("|");
  const counts = optionCountsByKey(results.segments);

  const narrow = (section: SectionResult): SectionResult => {
    const questions = section.questions.map((question) =>
      narrowQuestion(question, filterSeed, questionCoverage(filters, counts, question.id))
    );
    const children = section.children.map(narrow);
    const totals = aggregate([...questions, ...children]);
    return { ...section, ...totals, questions, children };
  };

  return results.sections.map(narrow);
}

/** Every scored answer of the survey, pooled into one five-box distribution. */
export function overallDistribution(
  results: SurveyResults
): { distribution: Distribution; n: number; nsnr: number } {
  const totals: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let nsnr = 0;

  for (const question of results.rankedQuestions) {
    if (!question.distribution) continue;
    nsnr += question.nsnr;
    question.distribution.forEach((count, index) => {
      totals[index] += count;
    });
  }

  return { distribution: totals, n: totals.reduce((sum, count) => sum + count, 0), nsnr };
}

/** Every section of the tree in visual order, roots included. */
export function flattenResultSections(
  sections: readonly SectionResult[]
): readonly SectionResult[] {
  return sections.flatMap((section) => [section, ...flattenResultSections(section.children)]);
}

// --- NPS ---------------------------------------------------------------------

function buildNps(draft: SurveyDraft, completed: number): NpsResult | null {
  const npsQuestion = flattenSections(draft.sections)
    .flatMap((entry) => entry.section.questions)
    .find((question) => question.type === "scale" && question.scale.kind === "nps");

  if (!npsQuestion) return null;

  const n = Math.round(completed * 0.97);
  const promoterShare = clamp(jitter(`${npsQuestion.id}:promoters`, 0.40, 0.25), 0.1, 0.8);
  const detractorShare = clamp(jitter(`${npsQuestion.id}:detractors`, 0.30, 0.20), 0.1, 0.6);

  const promoters = Math.round(n * promoterShare);
  const detractors = Math.round(n * detractorShare);
  const passives = n - promoters - detractors;
  const score = Math.round(((promoters - detractors) / n) * 100);

  return { score, previousScore: score - Math.round(jitter(`${npsQuestion.id}:prev`, 6, 4)), promoters, passives, detractors, n };
}

const VERBATIM_SEEDS: readonly { band: NpsBand; text: string; segment: string }[] = [
  { band: "detractor", text: "La carga de trabajo creció mucho más rápido que el equipo. Llevo tres trimestres cubriendo dos roles.", segment: "Operaciones · 1 a 3 años" },
  { band: "detractor", text: "Falta claridad sobre cómo se decide un ascenso. He visto promociones sin criterio visible.", segment: "Comercial · 3 a 5 años" },
  { band: "detractor", text: "El salario se quedó atrás frente al mercado y eso pesa más que cualquier beneficio.", segment: "Tecnología · Más de 10 años" },
  { band: "passive", text: "El equipo es excelente, pero no veo un camino claro de crecimiento para los próximos dos años.", segment: "Producto · 1 a 3 años" },
  { band: "passive", text: "Se comunican los cambios, aunque casi siempre cuando ya están decididos.", segment: "Marketing · 5 a 10 años" },
  { band: "promoter", text: "La flexibilidad real y la confianza de mi líder son lo que me mantiene aquí.", segment: "Tecnología · 3 a 5 años" },
  { band: "promoter", text: "Aprendo más en un trimestre aquí que en dos años en mi trabajo anterior.", segment: "Producto · Menos de 1 año" },
  { band: "promoter", text: "Se puede decir lo que se piensa sin que te pase nada. Eso no es común.", segment: "Gente y Cultura · 5 a 10 años" },
];

function buildVerbatims(draft: SurveyDraft): readonly Verbatim[] {
  const npsQuestion = flattenSections(draft.sections)
    .flatMap((entry) => entry.section.questions)
    .find((question) => question.type === "scale" && question.scale.kind === "nps");

  if (!npsQuestion?.scale.followUpEnabled) return [];

  const wording: Readonly<Record<NpsBand, string>> = {
    detractor: npsQuestion.scale.followUps.detractors,
    passive: npsQuestion.scale.followUps.neutrals,
    promoter: npsQuestion.scale.followUps.promoters,
  };

  return VERBATIM_SEEDS.map((seed, index) => ({
    id: `${npsQuestion.id}-v${index + 1}`,
    band: seed.band,
    question: wording[seed.band],
    text: seed.text,
    segment: seed.segment,
  }));
}

// --- Trend -------------------------------------------------------------------

/** Previous measurements of the same kind, oldest first, plus this one. */
function buildTrend(
  history: readonly SurveyListItem[],
  current: { label: string; favorability: number; participation: number }
): readonly TrendPoint[] {
  const points = history.map((item) => ({
    label: quarterLabel(item.name),
    favorability: round1(clamp(jitter(`${item.id}:fav`, current.favorability - 2.5, 4), 20, 80)),
    participation: round1(clamp(jitter(`${item.id}:part`, current.participation - 3, 6), 40, 99)),
  }));

  return [...points.reverse(), current];
}

/** "Clima Organizacional - Q1 2026" → "Q1 26", the axis label. */
function quarterLabel(name: string): string {
  const match = name.match(/Q([1-4])\s*(\d{4})/);
  return match ? `Q${match[1]} ${match[2].slice(2)}` : name;
}

// --- Entry point -------------------------------------------------------------

/** Share of invited people who finished, as a fraction. */
const COMPLETION_RATE = 0.869;

export interface BuildResultsInput {
  draft: SurveyDraft;
  item: SurveyListItem;
  /** Earlier measurements of the same type, newest first. Drives the trend. */
  history?: readonly SurveyListItem[];
}

export function buildSurveyResults({ draft, item, history = [] }: BuildResultsInput): SurveyResults {
  const invited = Number.parseInt(String(item.participants), 10) || 0;
  const completed = Math.round(invited * COMPLETION_RATE);
  const inProgress = Math.min(invited - completed, Math.round(invited * 0.06));
  const rate = invited === 0 ? 0 : Math.round((completed / invited) * 1000) / 10;

  const sections = buildSectionResults(draft, completed);
  const overall = aggregate(sections);

  const rankedQuestions = flattenResultSections(sections)
    .flatMap((section) =>
      section.questions
        .filter((question) => question.scored)
        .map((question) => ({ ...question, sectionTitle: section.title }))
    )
    .sort((a, b) => (a.favorability ?? 0) - (b.favorability ?? 0));

  return {
    favorability: overall.favorability,
    previousFavorability: round1(
      clamp(jitter(`${item.id}:prevfav`, overall.favorability - 2.8, 1.6), 10, 90)
    ),
    participation: {
      completed,
      inProgress,
      invited,
      rate,
      previousRate: round1(clamp(jitter(`${item.id}:prevpart`, rate - 3.4, 1.5), 30, 99)),
    },
    nps: buildNps(draft, completed),
    // The minimum group size only exists to protect an anonymous survey. A
    // public one has nothing to protect, so the only groups still held back
    // are the ones with no responses at all — there is no score to show.
    threshold: draft.visibility === "anonymous" ? draft.anonymityThreshold : 1,
    sections,
    segments: buildSegments(draft),
    trend: buildTrend(history, {
      label: quarterLabel(item.name),
      favorability: overall.favorability,
      participation: rate,
    }),
    verbatims: buildVerbatims(draft),
    rankedQuestions,
  };
}

// --- NPS Detail --------------------------------------------------------------

export interface NpsQuestionDetail {
  id: string;
  text: string;
  /** eNPS = %promoters - %detractors (–100 to +100) */
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  n: number;
}

export interface NpsSectionDetail {
  id: string;
  title: string;
  numbering: string;
  depth: number;
  /** Average eNPS of all questions in this section */
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  n: number;
  questions: readonly NpsQuestionDetail[];
  children: readonly NpsSectionDetail[];
}

/** The five eNPS dimensions with their two questions each. */
const NPS_SECTIONS_SEED = [
  {
    id: "nps-sec1",
    title: "Recomendabilidad General",
    questions: [],
    children: [
      {
        id: "nps-s1",
        title: "Satisfacción laboral",
        questions: [
          { id: "nps-s1q1", text: "Me siento orgulloso/a de formar parte de esta empresa." },
        ],
        children: [
          {
            id: "nps-s1-sub1",
            title: "Recomendabilidad directa",
            questions: [
              { id: "nps-s1q2", text: "Recomendaría a esta empresa a un amigo o colega como un buen lugar para trabajar." },
            ],
            children: []
          }
        ]
      },
      {
        id: "nps-s2",
        title: "Confianza en la organización",
        questions: [
          { id: "nps-s2q1", text: "Confío en la estrategia a largo plazo de esta empresa." },
          { id: "nps-s2q2", text: "Recomendaría esta organización a quienes buscan una empresa con una visión clara del futuro." },
        ],
        children: []
      }
    ]
  },
  {
    id: "nps-sec2",
    title: "Compromiso y Lealtad",
    questions: [],
    children: [
      {
        id: "nps-s3",
        title: "Compromiso organizacional",
        questions: [
          { id: "nps-s3q1", text: "Esta empresa fomenta el sentido de pertenencia entre sus empleados." },
          { id: "nps-s3q2", text: "Recomendaría trabajar aquí por el compromiso que la empresa fomenta en sus empleados." },
        ],
        children: []
      },
      {
        id: "nps-s4",
        title: "Lealtad del empleado",
        questions: [
          { id: "nps-s4q1", text: "Tengo la intención de seguir formando parte de esta empresa en el futuro a largo plazo." },
          { id: "nps-s4q2", text: "Recomendaría esta organización debido a mi satisfacción con el ambiente de trabajo y las oportunidades que ofrece." },
        ],
        children: []
      },
      {
        id: "nps-s5",
        title: "Valor percibido del empleado",
        questions: [
          { id: "nps-s5q1", text: "Esta empresa fomenta mi desarrollo profesional." },
          { id: "nps-s5q2", text: "Recomendaría esta empresa a quienes buscan oportunidades de crecimiento profesional." },
        ],
        children: []
      }
    ]
  }
] as const;

function buildNpsQuestion(
  questionId: string,
  baseN: number,
  filterSeed: string
): NpsQuestionDetail {
  const coverage = filterSeed
    ? clamp(jitter(`${questionId}:${filterSeed}:coverage`, 0.7, 0.15), 0.2, 1)
    : 1;
  const n = Math.max(5, Math.round(baseN * coverage));
  const promoterShare = clamp(jitter(`${questionId}:promoters`, 0.40, 0.35), 0.05, 0.90);
  const detractorShare = clamp(jitter(`${questionId}:detractors`, 0.30, 0.25), 0.05, 0.70);
  const promoters = Math.round(n * promoterShare);
  const detractors = Math.round(n * detractorShare);
  const passives = n - promoters - detractors;
  const score = Math.round(((promoters * 9.5 + passives * 7.5 + detractors * 3) / n) * 10) / 10;
  return { id: questionId, text: "", promoters, passives, detractors, n, score };
}

function mergeNpsQuestions(
  questions: readonly { n: number; promoters: number; detractors: number }[]
): {
  score: number; promoters: number; passives: number; detractors: number; n: number;
} {
  const n = questions.reduce((sum, q) => sum + q.n, 0);
  const promoters = questions.reduce((sum, q) => sum + q.promoters, 0);
  const detractors = questions.reduce((sum, q) => sum + q.detractors, 0);
  const passives = n - promoters - detractors;
  const score = n === 0 ? 0 : Math.round(((promoters - detractors) / n) * 100);
  return { score, promoters, passives, detractors, n };
}

/**
 * Builds eNPS data for each of the 5 sections and their questions.
 * Optionally filtered by a segment+filters combination — same approach as
 * `heatmapBySegment` so the "Ver por" + "Filtros" controls work identically.
 */
export function npsBySection(
  results: SurveyResults,
  filters: readonly SegmentFilter[] = []
): readonly NpsSectionDetail[] {
  const baseN = results.nps?.n ?? results.participation.completed;
  const filterSeed = filters.map((f) => `${f.key}:${f.optionId}`).join("|");

  function mapSection(section: any, index: number, parentPrefix: string, depth: number): NpsSectionDetail {
    const numbering = parentPrefix ? `${parentPrefix}.${index + 1}` : `${index + 1}`;
    
    const questions: NpsQuestionDetail[] = section.questions.map((q: any) => ({
      ...buildNpsQuestion(q.id, baseN, filterSeed),
      id: q.id,
      text: q.text,
    }));
    const children: NpsSectionDetail[] = section.children.map((child: any, i: number) => 
      mapSection(child, i, numbering, depth + 1)
    );
    
    // Total for this section combines its questions AND its children's totals
    const allNps = [...questions, ...children];
    const totals = mergeNpsQuestions(allNps);
    
    return { id: section.id, title: section.title, numbering, depth, ...totals, questions, children };
  }

  return NPS_SECTIONS_SEED.map((sec, i) => mapSection(sec, i, "", 0));
}

// --- NPS by segment (grid view) ----------------------------------------------

export interface NpsSegmentCell {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  n: number;
  /** Below anonymity threshold — hide data */
  belowThreshold: boolean;
}

export interface NpsSegmentRow {
  id: string;
  title: string;
  kind: "total" | "section" | "question";
  /** Overall (all groups combined) */
  total: NpsSegmentCell;
  /** One cell per column (segment option), null = below threshold */
  cells: readonly (NpsSegmentCell | null)[];
  children?: readonly NpsSegmentRow[];
  questions?: readonly NpsSegmentRow[];
}

export interface NpsSegmentData {
  columns: readonly SegmentOption[];
  totalRow: NpsSegmentRow;
  sectionRows: readonly NpsSegmentRow[];
}

function buildNpsCell(seed: string, baseN: number, groupCoverage: number, threshold: number): NpsSegmentCell {
  const n = Math.max(1, Math.round(baseN * groupCoverage));
  if (n < threshold) return { score: 0, promoters: 0, passives: 0, detractors: 0, n, belowThreshold: true };
  const promoterShare = clamp(jitter(`${seed}:p`, 0.40, 0.35), 0.05, 0.90);
  const detractorShare = clamp(jitter(`${seed}:d`, 0.30, 0.25), 0.05, 0.70);
  const promoters = Math.round(n * promoterShare);
  const detractors = Math.round(n * detractorShare);
  const passives = n - promoters - detractors;
  const score = Math.round(((promoters - detractors) / n) * 100);
  return { score, promoters, passives, detractors, n, belowThreshold: false };
}

function mergeNpsCells(cells: readonly (NpsSegmentCell | null)[]): NpsSegmentCell {
  const valid = cells.filter((c): c is NpsSegmentCell => c !== null && !c.belowThreshold);
  if (valid.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, n: 0, belowThreshold: false };
  const n = valid.reduce((s, c) => s + c.n, 0);
  const promoters = valid.reduce((s, c) => s + c.promoters, 0);
  const detractors = valid.reduce((s, c) => s + c.detractors, 0);
  const passives = n - promoters - detractors;
  const score = n === 0 ? 0 : Math.round(((promoters - detractors) / n) * 100);
  return { score, promoters, passives, detractors, n, belowThreshold: false };
}

/**
 * Builds NPS data as a column grid — one column per group in `segment`,
 * one row per NPS section (with expandable questions). Deep filters narrow
 * the population the same way heatmapBySegment does.
 */
export function npsBySegmentData(
  results: SurveyResults,
  segment: SegmentDefinition,
  filters: readonly SegmentFilter[] = []
): NpsSegmentData {
  const baseN = results.nps?.n ?? results.participation.completed;
  const threshold = results.threshold;

  // Group sizes follow the same logic as heatmapBySegment: invited count
  // proportional to segment options, then narrowed by filters.
  const sizes = groupSizes(baseN, segment.options, `${segment.key}:nps`);
  const counts = optionCountsByKey(results.segments);
  const filterCoverage = (groupId: string): number =>
    combinedCoverage(filters, counts, (f) => coverageFor(f, segment, groupId));

  const groupN = segment.options.map((opt, i) =>
    Math.max(1, Math.round(sizes[i] * filterCoverage(opt.id)))
  );

  const buildSectionRow = (section: any): NpsSegmentRow => {
    const questionRows: NpsSegmentRow[] = section.questions.map((q: any) => {
      const cells = segment.options.map((opt: any, i: number) =>
        buildNpsCell(`${q.id}:${opt.id}`, groupN[i], 1, threshold)
      );
      const total = mergeNpsCells(cells);
      return { id: q.id, title: q.text, kind: "question" as const, total, cells };
    });
    
    const childRows: NpsSegmentRow[] = section.children.map(buildSectionRow);

    const sectionCells = segment.options.map((_, i) => mergeNpsCells([...questionRows.map((qr) => qr.cells[i]), ...childRows.map((cr) => cr.cells[i])]));
    const total = mergeNpsCells(sectionCells);
    return { id: section.id, title: section.title, kind: "section" as const, total, cells: sectionCells, questions: questionRows, children: childRows };
  };

  const sectionRows = NPS_SECTIONS_SEED.map(buildSectionRow);
  const totalCells = segment.options.map((_, i) => mergeNpsCells(sectionRows.map((sr) => sr.cells[i])));
  const totalRow: NpsSegmentRow = {
    id: "nps-total",
    title: "Total general",
    kind: "total",
    total: mergeNpsCells(totalCells),
    cells: totalCells,
  };

  return { columns: segment.options, totalRow, sectionRows };
}
