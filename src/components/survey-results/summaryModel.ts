import {
  effectiveSentiment,
  type OpenComment,
  type Sentiment,
} from "@/mocks/questionResponses";
import {
  flattenResultSections,
  heatmapBySegment,
  participationBySegment,
  unitFromSeed,
  type Distribution,
  type HeatmapData,
  type HeatmapRow,
  type QuestionResult,
  type SectionResult,
  type SegmentDefinition,
  type SegmentFilter,
  type SurveyResults,
} from "@/mocks/surveyResults";
import {
  countSectionAnswers,
  countSectionQuestions,
  pooledDistribution,
  sectionHasContent,
} from "./sectionTotals";
import { FAVORABILITY_FLOOR, FAVORABILITY_TARGET } from "./favorabilityScale";
import { SENTIMENT_ORDER, SENTIMENT_WEIGHT } from "./sentimentScale";

/**
 * Everything the Resumen tab reads, derived from the same aggregate the other
 * tabs render.
 *
 * The rule the rest of the report already follows applies here twice over: a
 * summary that states a number the detail tabs contradict is worse than no
 * summary, because it is the *first* screen a reader sees and it sets what they
 * go looking for. So nothing is invented here — every figure is read off
 * `SurveyResults` or off the comments, and every alert quotes the figure it
 * rests on so the reader can go check it one tab away.
 *
 * The whole model is scoped: pick "2.1 Liderazgo" and every metric, finding and
 * alert on the page is recomputed over that branch alone. That is the only way
 * a summary stays useful past the first read — the second question is always
 * "and inside the block that is failing, where exactly?".
 */

export const SCOPE_ALL = "__all__";

/**
 * "Ver por" standing on the whole measurement rather than on one demographic.
 *
 * The Resumen answers "¿cómo nos fue?" before it answers "¿a quién?", so the
 * page opens on the survey entire and the reader chooses the cut — exactly the
 * "Ver por" of the heatmap, plus the general reading that grid cannot express
 * because a heatmap without columns is not a heatmap.
 */
export const VIEW_GENERAL = "__general__";

/** A branch of the survey a reader can narrow the whole page down to. */
export interface ScopeOption {
  id: string;
  title: string;
  numbering: string;
  /** 1 = sección, 2 = subsección, 3 = sub-subsección. */
  depth: number;
}

/** Sections, subsections and sub-subsections that actually carry questions. */
export function scopeOptions(sections: readonly SectionResult[]): readonly ScopeOption[] {
  return flattenResultSections(sections)
    .filter((section) => section.depth <= 3 && sectionHasContent(section))
    .map(({ id, title, numbering, depth }) => ({ id, title, numbering, depth }));
}

/** The branch under `id`, and the chain of ancestors that leads to it. */
export function findScopePath(
  sections: readonly SectionResult[],
  id: string
): readonly SectionResult[] | null {
  for (const section of sections) {
    if (section.id === id) return [section];
    const deeper = findScopePath(section.children, id);
    if (deeper) return [section, ...deeper];
  }
  return null;
}

export interface SummaryScope {
  id: string;
  /** How the scope reads as a chip: "Toda la encuesta" / "2.1 Liderazgo". */
  label: string;
  /** How it reads inside a sentence, where the numbering would be noise. */
  phrase: string;
  /** Ancestors first, the scope itself last. Empty for the whole survey. */
  path: readonly SectionResult[];
  /** The roots every figure on the page aggregates over. */
  roots: readonly SectionResult[];
  section: SectionResult | null;
}

export function resolveScope(results: SurveyResults, id: string): SummaryScope {
  const path = id === SCOPE_ALL ? null : findScopePath(results.sections, id);
  const section = path?.[path.length - 1] ?? null;

  return {
    id: section ? id : SCOPE_ALL,
    label: section ? `${section.numbering} ${section.title}` : "Toda la encuesta",
    phrase: section ? `"${section.title}"` : "toda la encuesta",
    path: path ?? [],
    roots: section ? [section] : results.sections,
    section,
  };
}

/* ------------------------------------------------------------------ métricas */

export interface ScopedMetrics {
  favorability: number;
  distribution: Distribution;
  nsnr: number;
  /** Scale answers plus opt-outs — what the distribution is over. */
  scaleAnswers: number;
  /** Every answer the branch collected, open and choice questions included. */
  answers: number;
  questions: number;
  scoredQuestions: number;
}

export function scopedMetrics(scope: SummaryScope): ScopedMetrics {
  const distributionTotals: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  let nsnr = 0;
  let questions = 0;
  let scoredQuestions = 0;
  let answers = 0;

  for (const root of scope.roots) {
    pooledDistribution(root).forEach((count, index) => {
      distributionTotals[index] += count;
    });
    questions += countSectionQuestions(root);
    answers += countSectionAnswers(root);
    for (const section of flattenResultSections([root])) {
      for (const question of section.questions) {
        if (question.scored) scoredQuestions += 1;
        nsnr += question.nsnr;
      }
    }
  }

  // Aggregated from the roots rather than read off `results`, because a
  // demographic filter rebuilds the sections and the headline has to move with
  // them. With no filter this is the same arithmetic `buildSurveyResults` runs,
  // so the unfiltered figure is identical to the one every other tab shows.
  const scoredRoots = scope.roots.filter((root) => root.n > 0);
  const weight = scoredRoots.reduce((sum, root) => sum + root.n, 0);
  const favorability =
    weight === 0
      ? 0
      : Math.round(
          (scoredRoots.reduce((sum, root) => sum + root.favorability * root.n, 0) / weight) * 10
        ) / 10;
  return {
    favorability,
    distribution: distributionTotals,
    nsnr,
    scaleAnswers: distributionTotals.reduce((sum, count) => sum + count, 0) + nsnr,
    answers,
    questions,
    scoredQuestions,
  };
}

/* ------------------------------------------------------------------ hallazgos */

/** The granularity the findings lists read at. */
export type FindingLevel = "section" | "subsection2" | "subsection3" | "question";

export const FINDING_LEVELS: readonly { id: FindingLevel; label: string }[] = [
  { id: "section", label: "Secciones" },
  { id: "subsection2", label: "Subsecciones" },
  { id: "subsection3", label: "Sub-subsecciones" },
  { id: "question", label: "Preguntas" },
];

export interface Finding {
  id: string;
  numbering: string;
  title: string;
  /** Where it hangs from, so a question row still says which block it is in. */
  parent: string;
  favorability: number;
  n: number;
}

const toFinding = (
  id: string,
  numbering: string,
  title: string,
  parent: string,
  favorability: number,
  n: number
): Finding => ({ id, numbering, title, parent, favorability, n });

/**
 * Every row of the scope at one level of the tree, scored.
 *
 * Levels are absolute, not relative to the scope: standing inside "2 Liderazgo"
 * and asking for "Subsecciones" means 2.1, 2.2 — the same rows the heatmap and
 * the questions view call subsections. A relative reading would rename the
 * reader's own rows every time they narrowed down.
 */
export function findingsAtLevel(
  scope: SummaryScope,
  level: FindingLevel
): readonly Finding[] {
  const rows: Finding[] = [];
  const depth = level === "section" ? 1 : level === "subsection2" ? 2 : 3;

  const walk = (section: SectionResult, ancestor: string | null) => {
    const here = `${section.numbering} ${section.title}`;

    if (level === "question") {
      for (const question of section.questions) {
        if (!question.scored || question.favorability === null || question.n === 0) continue;
        rows.push(
          toFinding(
            question.id,
            section.numbering,
            question.statement || "Pregunta sin enunciado",
            here,
            question.favorability,
            question.n
          )
        );
      }
    } else if (section.depth === depth && sectionHasContent(section) && section.n > 0) {
      // A root block has nothing above it to place it under, so it states its
      // own size instead; a subsection states the block it belongs to, which is
      // the fact a reader needs to know who to call about it.
      rows.push(
        toFinding(
          section.id,
          section.numbering,
          section.title,
          ancestor ??
            `${countSectionQuestions(section)} preguntas · ${section.n.toLocaleString("es-CO")} respuestas`,
          section.favorability,
          section.n
        )
      );
    }

    for (const child of section.children) walk(child, here);
  };

  for (const root of scope.roots) walk(root, null);

  return rows.sort((a, b) => a.favorability - b.favorability);
}

/**
 * The level the page opens at: the broadest one that still ranks something.
 *
 * Standing on the whole survey that is "Secciones" — a top-to-bottom read of
 * the blocks. Standing inside "3.2", sections and subsections hold one row or
 * none, so the default falls through to the level where a ranking exists. A
 * list of one is not a ranking.
 */
export function defaultFindingLevel(scope: SummaryScope): FindingLevel {
  for (const level of ["section", "subsection2", "subsection3"] as const) {
    if (findingsAtLevel(scope, level).length >= 2) return level;
  }
  return "question";
}

/* ---------------------------------------------------------------- sentimiento */

export interface SentimentRollup {
  counts: Readonly<Record<Sentiment, number>>;
  total: number;
  /** 0–100, positive = 100 and negative = 0. Null with nothing to average. */
  index: number | null;
  /** Themes the model tagged, worst balance first. */
  topics: readonly SentimentTopic[];
  /** The clearest example of the worst-read theme, and of the best. */
  worstQuote: OpenComment | null;
  bestQuote: OpenComment | null;
}

export interface SentimentTopic {
  topic: string;
  total: number;
  negative: number;
  neutral: number;
  positive: number;
  /** Share of the theme's comments read as negative. */
  negativeShare: number;
}

/** Ids of every question inside the scope — how comments get narrowed down. */
export function scopedQuestionIds(scope: SummaryScope): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const root of scope.roots) {
    for (const section of flattenResultSections([root])) {
      for (const question of section.questions) ids.add(question.id);
    }
  }
  return ids;
}

/** How many mentions a theme needs before it earns a line of the summary. */
const MIN_TOPIC_MENTIONS = 4;

export function sentimentRollup(
  comments: readonly OpenComment[],
  overrides: ReadonlyMap<string, Sentiment>
): SentimentRollup {
  const counts: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  const byTopic = new Map<string, { positive: number; neutral: number; negative: number }>();

  for (const comment of comments) {
    const sentiment = effectiveSentiment(comment, overrides);
    counts[sentiment] += 1;
    const entry = byTopic.get(comment.topic) ?? { positive: 0, neutral: 0, negative: 0 };
    entry[sentiment] += 1;
    byTopic.set(comment.topic, entry);
  }

  const total = comments.length;
  const index =
    total === 0
      ? null
      : SENTIMENT_ORDER.reduce((sum, id) => sum + counts[id] * SENTIMENT_WEIGHT[id], 0) / total;

  const topics: SentimentTopic[] = [...byTopic.entries()]
    .map(([topic, entry]) => {
      const topicTotal = entry.positive + entry.neutral + entry.negative;
      return {
        topic,
        total: topicTotal,
        ...entry,
        negativeShare: topicTotal === 0 ? 0 : (entry.negative / topicTotal) * 100,
      };
    })
    .filter((topic) => topic.total >= MIN_TOPIC_MENTIONS)
    // By how many negative comments the theme carries, not by its share: a
    // theme read 100% negative by five people is noise beside one read 70%
    // negative by two hundred, and the summary exists to point at the second.
    .sort((a, b) => b.negative - a.negative || b.negativeShare - a.negativeShare);

  const worstTopic = topics[0]?.topic;
  const bestTopic = [...topics].sort((a, b) => a.negativeShare - b.negativeShare)[0]?.topic;

  // The most confident reading of the theme, so the quote shown is the one the
  // model is least likely to have got wrong.
  const pick = (topic: string | undefined, sentiment: Sentiment) =>
    topic === undefined
      ? null
      : (comments
          .filter(
            (comment) =>
              comment.topic === topic && effectiveSentiment(comment, overrides) === sentiment
          )
          .sort((a, b) => b.aiConfidence - a.aiConfidence)[0] ?? null);

  return {
    counts,
    total,
    index: index === null ? null : Math.round(index * 10) / 10,
    topics,
    worstQuote: pick(worstTopic, "negative"),
    bestQuote: pick(bestTopic, "positive"),
  };
}

/* ------------------------------------------------------------------ destinos */

/** Which tab answers a block — the reason its button is worth pressing. */
export type AlertTarget = "participation" | "favorability" | "questions" | "nps" | "ai";

/** Participation under this leaves a group's result too thin to act on. */
export const PARTICIPATION_FLOOR = 70;

/* --------------------------------------------------------------- prioridades */

/**
 * A ranked priority: one finding, scored by more than its percentage.
 *
 * The naive ranking — worst favorability first — misses what makes a result
 * urgent: how many people it touches, whether it is sliding, and whether the
 * written comments confirm the same signal independently. So each candidate
 * gets a composite score, and the page shows the three highest with the
 * factors spelled out, because a priority nobody can interrogate is an
 * opinion, not an analysis.
 */
export interface Priority {
  finding: Finding;
  score: number;
  severity: "critical" | "high" | "watch";
  /** How much weight the number can carry, by how many answers back it. */
  confidence: "alta" | "media" | "baja";
  /** Why it made the cut, in one or two sentences. */
  why: string;
  /** The written comments that confirm the same signal, when they exist. */
  qual: QualSignal | null;
  /** The factors behind the score, for the "¿por qué?" affordance. */
  evidence: readonly PriorityEvidence[];
}

export interface PriorityEvidence {
  label: string;
  detail: string;
}

/** Comments whose theme names the same problem the score names. */
export interface QualSignal {
  topic: string;
  mentions: number;
  negative: number;
  negativeShare: number;
}

const stripAccents = (value: string): string =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * The comment theme that talks about this finding, if any does.
 *
 * Matched by name — "Compensación" against "Reconocimiento y compensación" —
 * because that is the link a human reader makes: the theme the model tagged
 * and the block the survey scored are two roads to the same subject.
 */
export function qualSignalFor(
  title: string,
  topics: readonly SentimentTopic[]
): QualSignal | null {
  const normalizedTitle = stripAccents(title);
  const match = [...topics]
    .filter((topic) => {
      const normalizedTopic = stripAccents(topic.topic);
      return (
        normalizedTitle.includes(normalizedTopic) ||
        normalizedTopic
          .split(/\s+/)
          .some((word) => word.length > 4 && normalizedTitle.includes(word))
      );
    })
    .sort((a, b) => b.negative - a.negative)[0];

  if (!match) return null;
  return {
    topic: match.topic,
    mentions: match.total,
    negative: match.negative,
    negativeShare: match.negativeShare,
  };
}

/** Answers behind a number before it is trusted at each grade. */
const CONFIDENCE_HIGH_N = 300;
const CONFIDENCE_MEDIUM_N = 100;

/** A theme this negative is confirmation, not coincidence. */
const QUAL_CONFIRM_SHARE = 60;

export const confidenceFor = (n: number): Priority["confidence"] =>
  n >= CONFIDENCE_HIGH_N ? "alta" : n >= CONFIDENCE_MEDIUM_N ? "media" : "baja";

/**
 * Severity × reach × qualitative confirmation, as one number.
 *
 * The weights are stated, not learned: distance below the 70% target carries
 * the score, reach adds to it, and comments that name the same problem push it
 * up — because two independent signals agreeing is exactly what "priority"
 * means. This measurement is read on its own terms; nothing here depends on
 * what a previous one said.
 */
function priorityScore(finding: Finding, qual: QualSignal | null): number {
  const gap = Math.max(0, FAVORABILITY_TARGET - finding.favorability);
  const reach = Math.min(12, Math.log10(Math.max(10, finding.n)) * 4);
  const qualBoost =
    qual && qual.negativeShare >= QUAL_CONFIRM_SHARE
      ? Math.min(15, (qual.negativeShare / 100) * 10 + Math.min(5, qual.negative / 20))
      : 0;
  return Math.round((gap + reach + qualBoost) * 10) / 10;
}

function priorityWhy(
  finding: Finding,
  isLowest: boolean,
  qual: QualSignal | null
): string {
  const clauses: string[] = [];

  clauses.push(
    isLowest
      ? "Es el resultado más bajo de todo el alcance"
      : `Está ${fmtPoints(FAVORABILITY_TARGET - finding.favorability)} por debajo del objetivo de ${FAVORABILITY_TARGET}%`
  );

  if (qual && qual.negativeShare >= QUAL_CONFIRM_SHARE) {
    clauses.push(
      `los comentarios sobre ${qual.topic.toLowerCase()} confirman la misma señal por un camino independiente`
    );
  }

  return `${clauses.join("; ")}.`;
}

/** How many priorities the page commits to. Three, so each one is read. */
const PRIORITY_COUNT = 3;

export function buildPriorities(
  findings: readonly Finding[],
  topics: readonly SentimentTopic[]
): readonly Priority[] {
  const lowestId = findings[0]?.id;

  return findings
    .map((finding) => {
      const qual = qualSignalFor(finding.title, topics);
      const score = priorityScore(finding, qual);
      return {
        finding,
        score,
        severity:
          finding.favorability < FAVORABILITY_FLOOR
            ? ("critical" as const)
            : finding.favorability < FAVORABILITY_TARGET
              ? ("high" as const)
              : ("watch" as const),
        confidence: confidenceFor(finding.n),
        why: priorityWhy(finding, finding.id === lowestId, qual),
        qual,
        evidence: [
          {
            label: "Distancia al objetivo",
            detail: `${fmt(finding.favorability)} frente al objetivo de ${FAVORABILITY_TARGET}%`,
          },
          {
            label: "Alcance",
            detail: `${finding.n.toLocaleString("es-CO")} respuestas la sustentan`,
          },
          {
            label: "Señal cualitativa",
            detail:
              qual && qual.negativeShare >= QUAL_CONFIRM_SHARE
                ? `${qual.negative} de ${qual.mentions} comentarios sobre ${qual.topic.toLowerCase()} son negativos (${Math.round(qual.negativeShare)}%)`
                : "Sin comentarios que confirmen la señal",
          },
          {
            label: "Confiabilidad",
            detail: `${confidenceFor(finding.n) === "alta" ? "Alta" : confidenceFor(finding.n) === "media" ? "Media" : "Baja"} por volumen de respuestas`,
          },
        ],
      };
    })
    .filter((priority) => priority.finding.favorability < FAVORABILITY_TARGET)
    .sort((a, b) => b.score - a.score)
    .slice(0, PRIORITY_COUNT);
}

/* ----------------------------------------------------------------- fortalezas */

/**
 * A block this close under the target still reads as a strength. Cutting
 * exactly at 70% would drop blocks a reader plainly recognises as the good
 * news of the measurement over a rounding difference.
 */
const STRENGTH_CANDIDATE_FLOOR = FAVORABILITY_TARGET - 5;

/** The blocks worth leaning on when communicating the result. */
export function buildStrengths(findings: readonly Finding[]): readonly Finding[] {
  const byFavorability = [...findings].sort((a, b) => b.favorability - a.favorability);
  const solid = byFavorability.filter(
    (finding) => finding.favorability >= STRENGTH_CANDIDATE_FLOOR
  );

  // With nothing near the target, the best block is still the closest thing to
  // a lever this measurement has — say so rather than rendering an empty box.
  return solid.length > 0 ? solid.slice(0, 3) : byFavorability.slice(0, 1);
}

/* -------------------------------------------------------------------- lectura */

/**
 * The measurement in one paragraph — interpretation, not recitation.
 *
 * The four figures sit right above this text, so repeating them here would
 * spend the reader's attention saying nothing. What the paragraph adds is the
 * three judgments the numbers cannot make alone: whether the reading can be
 * trusted, where the problems concentrate, and which strength can carry the
 * changes.
 */
export function summaryVerdict(
  findings: readonly Finding[],
  participationRate: number
): string {
  const trust =
    participationRate >= 80
      ? "La participación es suficiente para confiar en la lectura general."
      : participationRate >= 60
        ? "La participación alcanza para una lectura general, aunque conviene cuidarla en la próxima medición."
        : "La participación es baja: lee estos resultados como una señal, no como un diagnóstico.";

  const weak = findings.filter((finding) => finding.favorability < FAVORABILITY_TARGET);
  const worstNames = weak
    .slice(0, 3)
    .map((finding) => finding.title.toLowerCase())
    .join(", ");

  const concentration =
    weak.length > 0
      ? `Los problemas se concentran en ${worstNames}.`
      : `El resultado se sostiene: ningún bloque queda por debajo del objetivo de ${FAVORABILITY_TARGET}%.`;

  const best = [...findings].sort((a, b) => b.favorability - a.favorability)[0];
  const lever =
    best && best.favorability >= FAVORABILITY_TARGET
      ? ` "${best.title}" es la dimensión mejor evaluada y puede funcionar como palanca para abordar los cambios.`
      : "";

  return `${trust} ${concentration}${lever}`;
}

/* ------------------------------------------------------------------ segmentos */

/** One group of the active demographic, as the summary reads it. */
export interface SegmentStanding {
  id: string;
  label: string;
  /** The group's 1–5 average — the heatmap's own unit. Null when masked. */
  score: number | null;
  participation: number;
  completed: number;
  invited: number;
  masked: boolean;
}

/**
 * Where the scope stands per group of the chosen demographic.
 *
 * Read off the heatmap the Favorabilidad tab already draws — the row of the
 * scoped branch, or the grid's own column totals for the whole survey — so the
 * two screens can never disagree about which area is doing worst.
 */
export function segmentStandings(
  columns: readonly { id: string; label: string }[],
  scores: readonly (number | null)[],
  participation: readonly { id: string; completed: number; invited: number; rate: number; belowThreshold: boolean }[]
): readonly SegmentStanding[] {
  const byId = new Map(participation.map((row) => [row.id, row]));

  return columns.map((column, index) => {
    const row = byId.get(column.id);
    return {
      id: column.id,
      label: column.label,
      score: scores[index] ?? null,
      participation: row?.rate ?? 0,
      completed: row?.completed ?? 0,
      invited: row?.invited ?? 0,
      masked: row?.belowThreshold ?? false,
    };
  });
}


/* --------------------------------------------------------------------- brechas */

/**
 * Where the groups of a demographic pull apart.
 *
 * Lives here rather than in the block that draws it because the downloaded
 * report states the same brechas: two readings of one measurement that disagree
 * about which area is doing worst is exactly the failure this model exists to
 * prevent.
 */

/** A group this far under the average is an outlier, not noise. */
export const OUTLIER_GAP = 0.15;

/** Outliers shown before the block stops being a shortcut to the heatmap. */
export const MAX_OUTLIERS = 4;

/** A gap only counts when it separates groups this far apart on the 1–5 scale. */
export const MIN_REPORTABLE_SPREAD = 1.5;

export interface SegmentGaps {
  segment: SegmentDefinition;
  widest: WidestGap | null;
  outliers: readonly { row: SegmentStanding; gap: number }[];
  masked: readonly SegmentStanding[];
  average: number;
}

/** Everything this block reads off one demographic, or null when it says nothing. */
export function analyseSegmentGaps(
  segment: SegmentDefinition,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): SegmentGaps | null {
  const heatmap = heatmapBySegment(results, segment, filters);
  const participation = participationBySegment(results, segment, filters);
  const standings = segmentStandings(heatmap.columns, heatmap.columnTotals, participation);

  const scored = standings.filter((row) => row.score !== null && !row.masked);
  const masked = standings.filter((row) => row.score === null || row.masked);

  const average =
    scored.length === 0
      ? 0
      : scored.reduce((sum, row) => sum + (row.score ?? 0), 0) / scored.length;

  const outliers = scored
    .map((row) => ({ row, gap: (row.score ?? 0) - average }))
    .filter((entry) => entry.gap <= -OUTLIER_GAP)
    .sort((a, b) => a.gap - b.gap)
    .slice(0, MAX_OUTLIERS);

  const widest = widestGap(heatmap);

  if (!widest && outliers.length === 0) return null;
  return { segment, widest, outliers, masked, average };
}

export interface WidestGap {
  rowLabel: string;
  min: number;
  minLabel: string;
  max: number;
  maxLabel: string;
  spread: number;
}

/**
 * The single widest score spread anywhere in the grid, read off the question
 * rows — in this mock the per-group variation lives there, and a question is
 * also the actionable unit: "Claridad estratégica va de 1,6 en Gente y Cultura
 * a 5,0 en Producto" names both the subject and the two rooms to visit.
 */
export function widestGap(heatmap: HeatmapData): WidestGap | null {
  let best: WidestGap | null = null;

  const visit = (rows: readonly HeatmapRow[]) => {
    for (const row of rows) {
      if (row.kind === "question") {
        let min = Infinity;
        let max = -Infinity;
        let minIndex = -1;
        let maxIndex = -1;
        row.cells.forEach((cell, index) => {
          if (cell.score === null || cell.masked || cell.unscored) return;
          if (cell.score < min) {
            min = cell.score;
            minIndex = index;
          }
          if (cell.score > max) {
            max = cell.score;
            maxIndex = index;
          }
        });
        if (minIndex >= 0 && maxIndex >= 0 && minIndex !== maxIndex) {
          const spread = Math.round((max - min) * 10) / 10;
          if (spread >= MIN_REPORTABLE_SPREAD && (!best || spread > best.spread)) {
            best = {
              rowLabel: row.label,
              min,
              minLabel: heatmap.columns[minIndex]?.label ?? "",
              max,
              maxLabel: heatmap.columns[maxIndex]?.label ?? "",
              spread,
            };
          }
        }
      }
      visit(row.children);
    }
  };

  visit(heatmap.rows);
  return best;
}

/**
 * The demographics an open comment actually carries.
 *
 * `OpenComment` keeps área and país and nothing else, so those are the only
 * demographics a comment list can honestly be narrowed by — a control offering
 * "Antigüedad" over a list that cannot read it is a filter that does nothing.
 */
export const COMMENT_FILTER_KEYS: readonly string[] = ["area", "country"];

/**
 * Whether a comment was written by somebody the filters keep.
 *
 * Only the demographics a comment actually carries can be honoured; an
 * anonymous survey strips them, and then a filtered comment list would be a
 * fiction. So an unknown value is kept rather than guessed at, and the card
 * keeps saying what it counted.
 *
 * A filter names an option by *id* while a comment carries the option's *label*
 * — the directory writes "Tecnología", the demographic block writes
 * "…-dem-area-o6" — so `segments` is what closes the gap. Without it every
 * comparison fails and a filtered list comes back empty, which is why the
 * callers pass `results.segments`.
 */
export function commentMatchesFilters(
  comment: OpenComment,
  filters: readonly SegmentFilter[],
  segments: readonly SegmentDefinition[] = []
): boolean {
  // Grouped by demographic first: several options of one demographic are a
  // union ("Área: Producto o Tecnología"), different demographics intersect.
  const byKey = new Map<string, string[]>();
  for (const filter of filters) {
    const segment = segments.find((candidate) => candidate.key === filter.key);
    const label =
      segment?.options.find((option) => option.id === filter.optionId)?.label ?? filter.optionId;
    const group = byKey.get(filter.key);
    if (group) group.push(label);
    else byKey.set(filter.key, [label]);
  }

  return [...byKey.entries()].every(([key, labels]) => {
    const value = key === "area" ? comment.area : key === "country" ? comment.country : null;
    return value === null || labels.some((label) => value === label);
  });
}

/* ------------------------------------------------------------------- formateo */

const fmt = (value: number): string =>
  `${value.toFixed(1).replace(/\.0$/, "").replace(".", ",")}%`;

const fmtPoints = (value: number): string =>
  `${value.toFixed(1).replace(/\.0$/, "").replace(".", ",")} pp`;

/** A stable, deterministic pick — used where a demo needs one example, not all. */
export const stablePick = <T,>(items: readonly T[], seed: string): T | null =>
  items.length === 0 ? null : items[Math.floor(unitFromSeed(seed) * items.length)];

export type { QuestionResult };
