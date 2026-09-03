import type * as React from "react";
import {
  FAVORABILITY_BANDS,
  NSNR_BG,
  NSNR_BORDER,
  NSNR_TEXT,
  type FavorabilityBand,
} from "@/components/survey-results/favorabilityScale";

/**
 * Where a step of a rating scale falls on the app's one favorability scale —
 * shared by the builder's static "Vista del participante" sketch and the
 * live preview a respondent can actually click, so an answer reads the same
 * color whether the author is drafting the question or trying it out.
 *
 * Coloring the scale itself (not just its selected state) is deliberate: the
 * same wording that shows up amber in the sketch is amber in the heatmap and
 * the distribution bars later, so the author can judge which end of the scale
 * a step sits on before anyone has answered it.
 */
export function bandForStep(index: number, total: number): FavorabilityBand {
  if (total <= 1) return FAVORABILITY_BANDS[FAVORABILITY_BANDS.length - 1];
  const position = (index / (total - 1)) * (FAVORABILITY_BANDS.length - 1);
  return FAVORABILITY_BANDS[Math.round(position)];
}

/** NPS reads by its own three zones (detractor/pasivo/promotor), not the 1–5 bands. */
export function npsBand(score: number): FavorabilityBand {
  if (score <= 6) return FAVORABILITY_BANDS[1];
  if (score <= 8) return FAVORABILITY_BANDS[2];
  return FAVORABILITY_BANDS[3];
}

/** The band's mid-tone — a real color on every entry of `FAVORABILITY_BANDS`;
 *  `color` is typed nullable only because the shared `FavorabilityBand`
 *  interface allows it, and `foreground` is the readable stand-in for the
 *  case that never actually occurs here. */
export const bandInk = (band: FavorabilityBand): string => band.color ?? band.foreground;

/** Tinted chip: pale fill, firm edge, readable text — a mark drawn at rest. */
export const bandChip = (band: FavorabilityBand): React.CSSProperties => ({
  backgroundColor: band.background,
  borderColor: band.border,
  color: band.foreground,
});

/** Filled chip: the band's own color as a solid fill with light text — for a
 *  control that was picked outright, the same weight `bg-primary text-white`
 *  carried before every answer read the same regardless of which one it was. */
export const bandSolid = (band: FavorabilityBand): React.CSSProperties => ({
  backgroundColor: bandInk(band),
  borderColor: bandInk(band),
  color: "var(--color-text-inverse)",
});

/** The neutral opt-out chip — never a sentiment, so it never takes a band. */
export const NSNR_CHIP: React.CSSProperties = {
  backgroundColor: NSNR_BG,
  borderColor: NSNR_BORDER,
  color: NSNR_TEXT,
};
