import { ThumbsDown, ThumbsUp, Minus, type LucideIcon } from "lucide-react";
import type { Sentiment } from "@/mocks/questionResponses";
import {
  NEGATIVE,
  NEGATIVE_BG,
  NEGATIVE_BORDER,
  NEGATIVE_TEXT,
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
 * The sentiment scale, borrowed rather than invented.
 *
 * A comment read as negative and a 1 on a Likert mean the same thing to the
 * reader, so they are the same red — the three tones come straight out of
 * `favorabilityScale` instead of a parallel palette. And not just any three:
 * exactly the ones Favorabilidad gives its three groups — green for
 * Favorables, yellow for Neutrales, red for Desfavorables — because both
 * breakdowns sit in the same column slot of the same report, and a green that
 * changes shade between tabs makes the reader check whether it means the same
 * thing. Grey stays reserved for NS/NR, which is an opt-out, not a middle.
 */

export interface SentimentStyle {
  id: Sentiment;
  label: string;
  /** Wording for a count: "8 comentarios positivos". */
  plural: string;
  icon: LucideIcon;
  color: string;
  background: string;
  border: string;
  foreground: string;
}

export const SENTIMENT_STYLES: Readonly<Record<Sentiment, SentimentStyle>> = {
  positive: {
    id: "positive",
    label: "Positivo",
    plural: "positivos",
    icon: ThumbsUp,
    color: POSITIVE,
    background: POSITIVE_BG,
    border: POSITIVE_BORDER,
    foreground: POSITIVE_TEXT,
  },
  neutral: {
    id: "neutral",
    label: "Neutral",
    plural: "neutrales",
    icon: Minus,
    color: YELLOW,
    background: YELLOW_BG,
    border: YELLOW_BORDER,
    foreground: YELLOW_TEXT,
  },
  negative: {
    id: "negative",
    label: "Negativo",
    plural: "negativos",
    icon: ThumbsDown,
    color: NEGATIVE,
    background: NEGATIVE_BG,
    border: NEGATIVE_BORDER,
    foreground: NEGATIVE_TEXT,
  },
};

export const SENTIMENT_ORDER: readonly Sentiment[] = ["positive", "neutral", "negative"];

/** The scale as `MeasurementScaleButton` renders it, so the legend matches. */
export const SENTIMENT_SCALE_LEGEND: readonly ScaleLegendItem[] = SENTIMENT_ORDER.map((id) => {
  const style = SENTIMENT_STYLES[id];
  return {
    id: style.id,
    label: style.label,
    range: style.id === "neutral" ? "sin carga" : style.id === "positive" ? "a favor" : "en contra",
    color: style.color,
    background: style.background,
    border: style.border,
    foreground: style.foreground,
  };
});

/**
 * Below this, the model's own reading is treated as a suggestion.
 *
 * Not a cosmetic threshold: it decides which comments get a visible "revisar"
 * nudge, which is the only reason a correctable label earns its place.
 */
export const AI_CONFIDENCE_FLOOR = 70;

/* --------------------------------------------------------------- promedio */

/**
 * What one comment is worth when the three readings are averaged.
 *
 * Comments have no scale of their own, so the average borrows favorability's
 * ground: 0 to 100, where a positive comment is a 100 and a negative one a 0.
 * A neutral sitting at exactly 50 is what makes the number readable — an all
 * neutral thread lands on the midpoint instead of drifting toward whichever
 * end the weights happened to favour.
 */
export const SENTIMENT_WEIGHT: Readonly<Record<Sentiment, number>> = {
  positive: 100,
  neutral: 50,
  negative: 0,
};

/** Where the average stops reading as neutral and becomes a verdict. */
export const SENTIMENT_POSITIVE_FLOOR = 60;
export const SENTIMENT_NEGATIVE_CEILING = 40;

export interface SentimentAverage {
  /** The average on 0–100, or null when there is nothing to average. */
  index: number | null;
  /** Which of the three readings that average lands on. */
  type: Sentiment;
  /** Comments behind the number. */
  counted: number;
}

/**
 * The average sentiment of a set of comments, and the reading it lands on.
 *
 * Corrections are already folded in by `sentimentTotals`, so a comment the
 * reader re-labelled moves this number — which is the point of showing it
 * instead of a count of how many labels were touched.
 */
export function sentimentAverage(totals: Readonly<Record<Sentiment, number>>): SentimentAverage {
  const counted = SENTIMENT_ORDER.reduce((sum, id) => sum + totals[id], 0);
  if (counted === 0) return { index: null, type: "neutral", counted: 0 };

  const weighted = SENTIMENT_ORDER.reduce(
    (sum, id) => sum + totals[id] * SENTIMENT_WEIGHT[id],
    0
  );
  const index = weighted / counted;

  return {
    index,
    type:
      index >= SENTIMENT_POSITIVE_FLOOR
        ? "positive"
        : index <= SENTIMENT_NEGATIVE_CEILING
          ? "negative"
          : "neutral",
    counted,
  };
}
