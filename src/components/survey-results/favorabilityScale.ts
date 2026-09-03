import type { LegendItem, LegendTone, ResponseSegment } from "@/components/survey-analytics";
import type { Distribution } from "@/mocks/surveyResults";

/**
 * The one favorability scale.
 *
 * Every view of the results — the KPI cards, the heatmap cells, the distribution
 * bars, the question rows — reads a 1-to-5 average or a five-box distribution.
 * Giving each surface its own palette is how a report becomes unreadable: the
 * same 3.4 looks alarming in one card and acceptable in the next. So the bands
 * live here and feed the analytics kit's own components — `ResponseStackedBar`,
 * `InlineLegend`, `Badge` — rather than a parallel set of bars and chips.
 *
 * Built from the three status tokens the design system already has, at two
 * intensities either side of the neutral middle. The two mid intensities are the
 * reason a band carries an explicit `color`: the kit's six tones cannot express
 * "the same red, weaker", and a diverging scale needs exactly that. No literal
 * HEX enters the system for this.
 */

/** Badge variants the scale uses, so a score chip stays a `Badge`. */
export type BandVariant = "negative" | "warning" | "positive";

export interface FavorabilityBand {
  id: string;
  label: string;
  /** Range as the legend states it, e.g. "2 a 2.9". */
  range: string;
  /** Upper bound, inclusive. The last band catches everything above. */
  max: number;
  /** Tone for the kit's components. Null when only `color` can express it. */
  tone: LegendTone | null;
  /** Medium fill, as a token expression. Feeds bars and legend dots. */
  color: string | null;
  /** Pale fill for heatmap cells — the color, softened to a pastel. */
  background: string;
  /** Stronger edge for the same cell; a pastel needs it to keep its shape. */
  border: string;
  /** Text color that stays readable on `background`. */
  foreground: string;
  /** Variant for a `Badge` showing a score in this band. */
  variant: BandVariant;
}

/**
 * Pale gradients, one hue per band, diverging around the yellow middle. Deep
 * text and a firmer border carry the reading: the fill alone would be too
 * faint a divider between two adjacent columns.
 *
 * `*_BG` / `*_BORDER` / `*_TEXT` resolve through the `--fav-*` CSS custom
 * properties (defined in globals.css) rather than literal HSL, so every
 * on-screen consumer — badges, heatmap cells, legend chips — re-tunes itself
 * for `.dark` for free. The mid-tone `*` constants (dots, bars, rings) stay
 * literal, and are pinned to the exact same hue as `StatusBadge`'s
 * success/pending/failed colors (Tailwind's emerald-600 / amber-600 /
 * red-600) — a ring reporting "Completadas" must be the same green as the
 * "Completado" badge in the table it summarizes, not a nearby green. The
 * results PDF is the one exception — it prints from an isolated iframe that
 * never sees this stylesheet, so `downloads/pdf/pdfPalette.ts` keeps its own
 * literal copy of the light values below instead of importing these.
 */
export const NEGATIVE_BG = "hsl(var(--fav-negative-bg))";
export const NEGATIVE_BORDER = "hsl(var(--fav-negative-border))";
export const NEGATIVE = "hsl(0 72.2% 50.6%)"; // Tailwind red-600, same as StatusBadge's "failed"
export const NEGATIVE_TEXT = "hsl(var(--fav-negative-fg))"; // Lighter text

export const SOFTER_NEGATIVE_BG = "hsl(var(--fav-softer-negative-bg))";
export const SOFTER_NEGATIVE_BORDER = "hsl(var(--fav-softer-negative-border))";
export const SOFTER_NEGATIVE = "hsl(357 80% 66%)";
export const SOFTER_NEGATIVE_TEXT = "hsl(var(--fav-softer-negative-fg))"; // Lighter text

export const YELLOW_BG = "hsl(var(--fav-yellow-bg))";
export const YELLOW_BORDER = "hsl(var(--fav-yellow-border))";
export const YELLOW = "hsl(32.1 94.6% 43.7%)"; // Tailwind amber-600, same as StatusBadge's "pending"
export const YELLOW_TEXT = "hsl(var(--fav-yellow-fg))"; // Lighter text

export const POSITIVE_BG = "hsl(var(--fav-positive-bg))";
export const POSITIVE_BORDER = "hsl(var(--fav-positive-border))";
export const POSITIVE = "hsl(161.4 93.5% 30.4%)"; // Tailwind emerald-600, same as StatusBadge's "success"
export const POSITIVE_TEXT = "hsl(var(--fav-positive-fg))"; // Lighter text

/** "5" earns a visibly richer green than the "4" band: pale mint vs deep forest. */
export const DEEP_POSITIVE_BG = "hsl(var(--fav-deep-positive-bg))";
export const DEEP_POSITIVE_BORDER = "hsl(var(--fav-deep-positive-border))";
export const DEEP_POSITIVE = "hsl(120 46% 36%)";
export const DEEP_POSITIVE_TEXT = "hsl(var(--fav-deep-positive-fg))"; // Lighter text

/** "No sabe / No responde" — the sixth option, outside the 1–5 scale. */
export const NSNR_BG = "hsl(var(--fav-nsnr-bg))";
export const NSNR_BORDER = "hsl(var(--fav-nsnr-border))";
export const NSNR = "hsl(218 12% 61%)";
export const NSNR_TEXT = "hsl(var(--fav-nsnr-fg))";

/** A chip the scale legend can render: a band or the NS/NR sixth option. */
export interface ScaleLegendItem {
  id: string;
  label: string;
  range: string;
  color: string | null;
  background: string;
  border: string;
  foreground: string;
}

export const NSNR_LEGEND_ITEM: ScaleLegendItem = {
  id: "nsnr",
  label: "No sabe / No responde",
  range: "NS/NR",
  color: NSNR,
  background: NSNR_BG,
  border: NSNR_BORDER,
  foreground: NSNR_TEXT,
};

export const FAVORABILITY_BANDS: readonly FavorabilityBand[] = [
  {
    id: "very-unfavorable",
    label: "Muy desfavorable",
    range: "1 a 1.9",
    max: 1.9,
    tone: "negative",
    color: NEGATIVE,
    background: NEGATIVE_BG,
    border: NEGATIVE_BORDER,
    foreground: NEGATIVE_TEXT,
    variant: "negative",
  },
  {
    id: "unfavorable",
    label: "Desfavorable",
    range: "2 a 2.9",
    max: 2.9,
    tone: null,
    color: SOFTER_NEGATIVE,
    background: SOFTER_NEGATIVE_BG,
    border: SOFTER_NEGATIVE_BORDER,
    foreground: SOFTER_NEGATIVE_TEXT,
    variant: "negative",
  },
  {
    id: "neutral",
    label: "Neutral",
    range: "3 a 3.9",
    max: 3.9,
    tone: "warning",
    color: YELLOW,
    background: YELLOW_BG,
    border: YELLOW_BORDER,
    foreground: YELLOW_TEXT,
    variant: "warning",
  },
  {
    id: "favorable",
    label: "Favorable",
    range: "4 a 4.9",
    max: 4.9,
    tone: null,
    color: POSITIVE,
    background: POSITIVE_BG,
    border: POSITIVE_BORDER,
    foreground: POSITIVE_TEXT,
    variant: "positive",
  },
  {
    id: "very-favorable",
    label: "Muy favorable",
    range: "5",
    max: Infinity,
    tone: "positive",
    color: DEEP_POSITIVE,
    background: DEEP_POSITIVE_BG,
    border: DEEP_POSITIVE_BORDER,
    foreground: DEEP_POSITIVE_TEXT,
    variant: "positive",
  },
];

/** The full scale legend the questions view shows: five bands + NS/NR. */
export const FAVORABILITY_SCALE_LEGEND: readonly ScaleLegendItem[] = [
  ...FAVORABILITY_BANDS,
  NSNR_LEGEND_ITEM,
];

/**
 * The scale a *person's* average is read by, for the "Por persona" roster.
 *
 * The chip beside every name is `bandForScore` on their 1–5 average, so the
 * legend that explains it has to be the five bands — not the three tiers the
 * sections view speaks, and without NS/NR: an opt-out never enters somebody's
 * own average, it only lowers how many questions it was computed over.
 */
export const PARTICIPANT_SCORE_LEGEND: readonly ScaleLegendItem[] = [
  { id: "favorable", label: "Favorables", range: "4 a 5", color: POSITIVE, background: POSITIVE_BG, border: POSITIVE_BORDER, foreground: POSITIVE_TEXT },
  { id: "neutral", label: "Neutrales", range: "3 a 3.9", color: YELLOW, background: YELLOW_BG, border: YELLOW_BORDER, foreground: YELLOW_TEXT },
  { id: "unfavorable", label: "Desfavorables", range: "1 a 2.9", color: SOFTER_NEGATIVE, background: SOFTER_NEGATIVE_BG, border: SOFTER_NEGATIVE_BORDER, foreground: SOFTER_NEGATIVE_TEXT },
];

export const THREE_TIER_FAVORABILITY_LEGEND: readonly ScaleLegendItem[] = [
  { id: "favorable", label: "Favorables", range: "4 a 5", color: POSITIVE, background: POSITIVE_BG, border: POSITIVE_BORDER, foreground: POSITIVE_TEXT },
  { id: "neutral", label: "Neutrales", range: "3 a 3.9", color: YELLOW, background: YELLOW_BG, border: YELLOW_BORDER, foreground: YELLOW_TEXT },
  { id: "unfavorable", label: "Desfavorables", range: "1 a 2.9", color: SOFTER_NEGATIVE, background: SOFTER_NEGATIVE_BG, border: SOFTER_NEGATIVE_BORDER, foreground: SOFTER_NEGATIVE_TEXT },
  NSNR_LEGEND_ITEM,
];

/**
 * The three tiers a *result* is read by in "Detalle por secciones".
 *
 * That view never shows the five 1–5 bands: its legend, its KPI cards and its
 * breakdown dots all speak Favorables / Neutrales / Desfavorables (+ NS/NR).
 * So "Personalizar" there has to offer the same four buckets — offering five bands a
 * reader cannot see anywhere on the screen is what made the control read as
 * broken. The heatmap keeps `FAVORABILITY_BANDS`, since its cells are colored
 * by that finer scale.
 */
export interface FavorabilityTier {
  id: "unfavorable" | "neutral" | "favorable";
  label: string;
  /** Upper bound on the 1–5 average, inclusive. */
  max: number;
}

export const FAVORABILITY_TIERS: readonly FavorabilityTier[] = [
  { id: "unfavorable", label: "Desfavorables", max: 2.9 },
  { id: "neutral", label: "Neutrales", max: 3.9 },
  { id: "favorable", label: "Favorables", max: Infinity },
];

/** The tier a 1–5 average falls into. */
export const tierForScore = (score: number): FavorabilityTier =>
  FAVORABILITY_TIERS.find((tier) => score <= tier.max) ??
  FAVORABILITY_TIERS[FAVORABILITY_TIERS.length - 1];

/** Every bucket the three-tier highlight can light, NS/NR included. */
export const FAVORABILITY_TIER_IDS: readonly string[] = THREE_TIER_FAVORABILITY_LEGEND.map(
  (item) => item.id
);

export const NPS_SCALE_LEGEND: readonly ScaleLegendItem[] = [
  { id: "promotores", label: "Promotores", range: "9-10", color: null, background: POSITIVE_BG, border: POSITIVE_BORDER, foreground: POSITIVE_TEXT },
  { id: "neutros", label: "Neutros", range: "7-8", color: null, background: YELLOW_BG, border: YELLOW_BORDER, foreground: YELLOW_TEXT },
  { id: "detractores", label: "Detractores", range: "0-6", color: null, background: SOFTER_NEGATIVE_BG, border: SOFTER_NEGATIVE_BORDER, foreground: SOFTER_NEGATIVE_TEXT },
];

export const NPS_SCORE_LEGEND: readonly ScaleLegendItem[] = [
  { id: "promotores-score", label: "Promotores", range: "20 a 100", color: null, background: POSITIVE_BG, border: POSITIVE_BORDER, foreground: POSITIVE_TEXT },
  { id: "neutros-score", label: "Neutros", range: "0 a 19", color: null, background: YELLOW_BG, border: YELLOW_BORDER, foreground: YELLOW_TEXT },
  { id: "detractores-score", label: "Detractores", range: "-100 a -1", color: null, background: SOFTER_NEGATIVE_BG, border: SOFTER_NEGATIVE_BORDER, foreground: SOFTER_NEGATIVE_TEXT },
];

/**
 * How a resulting eNPS should be read — a different axis from the legend above.
 *
 * `NPS_SCALE_LEGEND` classifies a *respondent* (a 9 is a promoter). These bands
 * classify a *result*: the -100..100 score a section or question ends up with.
 * "Resaltar" needs the second, the same way Favorabilidad's own highlight reads
 * `FAVORABILITY_BANDS` rather than the five Likert boxes.
 */
export interface NpsScoreBand {
  id: string;
  label: string;
  /** Range as the tab states it, e.g. "20 o más" — read beside the label. */
  range: string;
  /** Lower bound, inclusive. The last band catches everything below. */
  min: number;
  /** Solid dot for the highlight list. */
  color: string;
  background: string;
  border: string;
  foreground: string;
}

export const NPS_SCORE_BANDS: readonly NpsScoreBand[] = [
  { id: "promotores", label: "Promotores", range: "20 o más", min: 20, color: "#22c55e", background: POSITIVE_BG, border: POSITIVE_BORDER, foreground: POSITIVE_TEXT },
  { id: "neutros", label: "Neutros", range: "0 a 19", min: 0, color: "#facc15", background: YELLOW_BG, border: YELLOW_BORDER, foreground: YELLOW_TEXT },
  { id: "detractores", label: "Detractores", range: "bajo 0", min: -Infinity, color: "#ef4444", background: SOFTER_NEGATIVE_BG, border: SOFTER_NEGATIVE_BORDER, foreground: SOFTER_NEGATIVE_TEXT },
];

/** The band an eNPS score falls into. */
export const npsBandForScore = (score: number): NpsScoreBand =>
  NPS_SCORE_BANDS.find((band) => score >= band.min) ?? NPS_SCORE_BANDS[NPS_SCORE_BANDS.length - 1];

/** The band a 1–5 average falls into. */
export const bandForScore = (score: number): FavorabilityBand =>
  FAVORABILITY_BANDS.find((band) => score <= band.max) ?? FAVORABILITY_BANDS[0];

/**
 * Wording for each box of a Likert distribution. Deliberately shorter than the
 * Likert steps a respondent reads: this is a legend, not a question.
 */

export const favorabilitySegments = (
  distribution: Distribution,
  idPrefix: string,
  nsnr = 0
): ResponseSegment[] => {
  const sum = (a: number, b: number) => a + b;
  
  const desfavorable = sum(distribution[0] || 0, distribution[1] || 0);
  const neutral = distribution[2] || 0;
  const favorable = sum(distribution[3] || 0, distribution[4] || 0);

  const segments: ResponseSegment[] = [
    {
      id: `${idPrefix}-unfavorable`,
      label: THREE_TIER_FAVORABILITY_LEGEND[2].label,
      value: desfavorable,
      tone: "negative",
      color: THREE_TIER_FAVORABILITY_LEGEND[2].background,
    },
    {
      id: `${idPrefix}-neutral`,
      label: THREE_TIER_FAVORABILITY_LEGEND[1].label,
      value: neutral,
      tone: "warning",
      color: THREE_TIER_FAVORABILITY_LEGEND[1].background,
    },
    {
      id: `${idPrefix}-favorable`,
      label: THREE_TIER_FAVORABILITY_LEGEND[0].label,
      value: favorable,
      tone: "positive", // Favorable
      color: THREE_TIER_FAVORABILITY_LEGEND[0].background,
    }
  ];

  // Always present, even at zero: the legend promises NS/NR, and a
  // tooltip that drops NS/NR whenever nobody picked it reads as broken rather
  // than as "nobody opted out here".
  segments.push({
    id: `${idPrefix}-nsnr`,
    label: NSNR_LEGEND_ITEM.label,
    value: nsnr,
    tone: "neutral",
    color: NSNR_BG,
  });

  return segments;
};

/** The band legend as the items `InlineLegend` renders. */
export const favorabilityLegendItems = (showRanges = false): LegendItem[] =>
  FAVORABILITY_BANDS.map((band) => ({
    label: band.label,
    color: band.background,
    tone: band.tone ?? undefined,
    description: showRanges ? band.range : undefined,
  }));

/**
 * How a favorability percentage should be read.
 *
 * A percentage has no natural bands the way a 1–5 average does, so the product
 * has to state them. These are the thresholds the report treats as "healthy",
 * "watch" and "act on", and they are the same ones the AI tab cites.
 */
export const FAVORABILITY_TARGET = 70;
export const FAVORABILITY_FLOOR = 50;

export type FavorabilityVerdict = "healthy" | "watch" | "critical";

export const verdictForFavorability = (value: number): FavorabilityVerdict =>
  value >= FAVORABILITY_TARGET ? "healthy" : value >= FAVORABILITY_FLOOR ? "watch" : "critical";

export const VERDICT_COPY: Readonly<
  Record<FavorabilityVerdict, { label: string; variant: BandVariant }>
> = {
  healthy: { label: "En rango saludable", variant: "positive" },
  watch: { label: "Requiere seguimiento", variant: "warning" },
  critical: { label: "Requiere acción", variant: "negative" },
};

/** `38.3` → `"38,3%"`. Spanish decimals, one place, no trailing zero noise. */
export const formatPercent = (value: number): string =>
  `${value.toFixed(1).replace(/\.0$/, "").replace(".", ",")}%`;

/** `3.42` → `"3,4"`. */
export const formatScore = (value: number): string => value.toFixed(1).replace(".", ",");

/** `+2,8 pp` / `-1,4 pp` — a difference between two percentages. */
export const formatDelta = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(1).replace(/\.0$/, "").replace(".", ",")} pp`;
};

/** Which way a delta should read on a `DeltaPill`. */
export const deltaTone = (value: number): "positive" | "negative" | "neutral" =>
  value > 0.5 ? "positive" : value < -0.5 ? "negative" : "neutral";

// --- Card tones ---------------------------------------------------------------

/** The tone a metric card takes for each reading, shared by the home pulse
 *  and the results tabs so the same number is never green here and orange there. */
export type MetricTone = "positive" | "warning" | "negative";

/** Participation reads on the same floor/target the "Avance" column buckets use. */
export const toneForParticipation = (rate: number): MetricTone =>
  rate >= 80 ? "positive" : rate >= 50 ? "warning" : "negative";

const VERDICT_TONE: Readonly<Record<FavorabilityVerdict, MetricTone>> = {
  healthy: "positive",
  watch: "warning",
  critical: "negative",
};

export const toneForFavorability = (value: number): MetricTone =>
  VERDICT_TONE[verdictForFavorability(value)];

const NPS_BAND_TONE: Readonly<Record<string, MetricTone>> = {
  promotores: "positive",
  neutros: "warning",
  detractores: "negative",
};

export const toneForNps = (score: number): MetricTone =>
  NPS_BAND_TONE[npsBandForScore(score).id] ?? "warning";

/** The `MetricSummaryCard` accent bar for each tone, shared so a card's left
 * edge always agrees with its own reading badge instead of staying a fixed
 * color no matter what the number says. */
export const ACCENT_CLASS_BY_TONE: Readonly<Record<MetricTone, string>> = {
  positive: "bg-status-positive",
  warning: "bg-status-warning",
  negative: "bg-status-negative",
};

/** `+12` / `-4` / `0` — an eNPS score reads with its sign. */
export const formatNpsScore = (value: number): string =>
  `${value > 0 ? "+" : ""}${Math.round(value)}`;
