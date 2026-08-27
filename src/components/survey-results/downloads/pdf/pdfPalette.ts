import type { FavorabilityBand, NpsScoreBand } from "../../favorabilityScale";

/**
 * Literal, light-mode copy of `favorabilityScale`'s status colors.
 *
 * The report renders inside an isolated iframe (see `pdfReport.ts`) that
 * never loads the app's stylesheet, so it can't resolve the `--fav-*` custom
 * properties `favorabilityScale.ts` uses to re-tune these colors for
 * `.dark`. A printed report is meant to look the same regardless of the
 * viewer's app theme, so it keeps this frozen, print-safe copy instead of
 * importing the theme-aware constants directly. Keep the values here in
 * sync with the `:root` block in `src/styles/globals.css` if the light
 * palette ever changes.
 */
export const NEGATIVE_BG = "hsl(354 80% 87%)";
export const NEGATIVE_BORDER = "hsl(354 78% 54%)";
export const NEGATIVE = "hsl(354 76% 48%)";
export const NEGATIVE_TEXT = "hsl(354 76% 42%)";

export const SOFTER_NEGATIVE_BG = "hsl(1 84% 96%)";
export const SOFTER_NEGATIVE_BORDER = "hsl(357 82% 76%)";
export const SOFTER_NEGATIVE = "hsl(357 80% 66%)";
export const SOFTER_NEGATIVE_TEXT = "hsl(357 80% 56%)";

export const YELLOW_BG = "hsl(48 96% 92%)";
export const YELLOW_BORDER = "hsl(48 92% 64%)";
export const YELLOW = "hsl(48 92% 50%)";
export const YELLOW_TEXT = "hsl(46 90% 42%)";

export const POSITIVE_BG = "hsl(116 52% 94%)";
export const POSITIVE_BORDER = "hsl(116 50% 72%)";
export const POSITIVE = "hsl(116 48% 48%)";
export const POSITIVE_TEXT = "hsl(116 48% 42%)";

export const DEEP_POSITIVE_BG = "hsl(122 55% 82%)";
export const DEEP_POSITIVE_BORDER = "hsl(120 48% 40%)";
export const DEEP_POSITIVE = "hsl(120 46% 36%)";
export const DEEP_POSITIVE_TEXT = "hsl(120 46% 30%)";

export const NSNR_BG = "hsl(218 14% 93%)";
export const NSNR_BORDER = "hsl(218 10% 66%)";
export const NSNR = "hsl(218 12% 61%)";
export const NSNR_TEXT = "hsl(218 14% 38%)";

/** Print-safe mirror of `FAVORABILITY_BANDS` — same shape, literal colors. */
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

/** The band a 1–5 average falls into — print-safe colors. */
export const bandForScore = (score: number): FavorabilityBand =>
  FAVORABILITY_BANDS.find((band) => score <= band.max) ?? FAVORABILITY_BANDS[0];

/** Print-safe mirror of `NPS_SCORE_BANDS`. */
export const NPS_SCORE_BANDS: readonly NpsScoreBand[] = [
  { id: "promotores", label: "Promotores", range: "20 o más", min: 20, color: "#22c55e", background: POSITIVE_BG, border: POSITIVE_BORDER, foreground: POSITIVE_TEXT },
  { id: "neutros", label: "Neutros", range: "0 a 19", min: 0, color: "#facc15", background: YELLOW_BG, border: YELLOW_BORDER, foreground: YELLOW_TEXT },
  { id: "detractores", label: "Detractores", range: "bajo 0", min: -Infinity, color: "#ef4444", background: SOFTER_NEGATIVE_BG, border: SOFTER_NEGATIVE_BORDER, foreground: SOFTER_NEGATIVE_TEXT },
];

/** The band an eNPS score falls into — print-safe colors. */
export const npsBandForScore = (score: number): NpsScoreBand =>
  NPS_SCORE_BANDS.find((band) => score >= band.min) ?? NPS_SCORE_BANDS[NPS_SCORE_BANDS.length - 1];
