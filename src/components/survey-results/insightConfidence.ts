import {
  NSNR,
  NSNR_BG,
  NSNR_BORDER,
  NSNR_TEXT,
  POSITIVE,
  POSITIVE_BG,
  POSITIVE_BORDER,
  POSITIVE_TEXT,
  YELLOW,
  YELLOW_BG,
  YELLOW_BORDER,
  YELLOW_TEXT,
  type ScaleLegendItem,
} from "./favorabilityScale";

/**
 * How sure the model is about one claim, on the report's own scale.
 *
 * Confidence is the only thing the AI tab measures that no other tab measures,
 * so it is the one legend this view owns. The three tones are borrowed rather
 * than invented — the same green, yellow and grey Favorabilidad and Comentarios
 * use — because a reader who has learned that green means "solid" two tabs ago
 * should not have to relearn it here.
 */

export type InsightConfidence = "low" | "medium" | "high";

export interface ConfidenceStyle {
  label: string;
  /** What the level actually means, for the legend. */
  meaning: string;
  color: string;
  background: string;
  border: string;
  foreground: string;
}

export const CONFIDENCE_STYLES: Readonly<Record<InsightConfidence, ConfidenceStyle>> = {
  high: {
    label: "Alta",
    meaning: "Cifra directa de la medición",
    color: POSITIVE,
    background: POSITIVE_BG,
    border: POSITIVE_BORDER,
    foreground: POSITIVE_TEXT,
  },
  medium: {
    label: "Media",
    meaning: "Lectura razonable, conviene verificar",
    color: YELLOW,
    background: YELLOW_BG,
    border: YELLOW_BORDER,
    foreground: YELLOW_TEXT,
  },
  low: {
    label: "Baja",
    meaning: "Indicio, no conclusión",
    color: NSNR,
    background: NSNR_BG,
    border: NSNR_BORDER,
    foreground: NSNR_TEXT,
  },
};

/** Best-first: the order a reader wants to see the bands explained in. */
export const CONFIDENCE_ORDER: readonly InsightConfidence[] = ["high", "medium", "low"];

export const CONFIDENCE_LEGEND: readonly ScaleLegendItem[] = CONFIDENCE_ORDER.map((id) => {
  const style = CONFIDENCE_STYLES[id];
  return {
    id,
    label: style.label,
    range: style.meaning,
    color: style.color,
    background: style.background,
    border: style.border,
    foreground: style.foreground,
  };
});
