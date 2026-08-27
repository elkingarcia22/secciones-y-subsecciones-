import type { Distribution, SectionResult } from "@/mocks/surveyResults";
import {
  VERDICT_COPY,
  formatPercent,
  formatScore,
  verdictForFavorability,
} from "../../favorabilityScale";
import {
  FAVORABILITY_BANDS,
  NSNR,
  NSNR_BG,
  NSNR_BORDER,
  NSNR_TEXT,
  POSITIVE,
  POSITIVE_BG,
  POSITIVE_BORDER,
  POSITIVE_TEXT,
  SOFTER_NEGATIVE,
  SOFTER_NEGATIVE_BG,
  SOFTER_NEGATIVE_BORDER,
  SOFTER_NEGATIVE_TEXT,
  YELLOW,
  YELLOW_BG,
  YELLOW_BORDER,
  YELLOW_TEXT,
  bandForScore,
  npsBandForScore,
} from "./pdfPalette";

// --- Texto y números --------------------------------------------------------------

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const count = (value: number): string => value.toLocaleString("es-CO");

/** Share of a whole as a rounded percentage, guarding the empty case. */
export const shareOf = (value: number, total: number): number =>
  total === 0 ? 0 : Math.round((value / total) * 100);

/** Parte una lista en tandas de a lo sumo `size`. */
export const chunk = <T,>(items: readonly T[], size: number): T[][] => {
  const parts: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    parts.push(items.slice(index, index + size));
  }
  return parts;
};

/** Sangría de una fila según su profundidad en el árbol de secciones. */
export const indent = (depth: number): string => `padding-left:${8 + depth * 14}px`;

// --- Chips ------------------------------------------------------------------------

const chip = (label: string, background: string, foreground: string, border: string): string =>
  `<span class="chip" style="background:${background};color:${foreground};border-color:${border}">${label}</span>`;

/** Promedio 1–5, coloreado por las cinco bandas — la escala del heatmap. */
export const scoreChip = (score: number | null): string =>
  score === null
    ? chip("—", NSNR_BG, NSNR_TEXT, NSNR)
    : (() => {
        const band = bandForScore(score);
        return chip(formatScore(score), band.background, band.foreground, band.border);
      })();

/**
 * Porcentaje de favorabilidad, coloreado por las tres zonas.
 *
 * No son las cinco bandas a propósito: en pantalla, "Detalle por secciones" lee
 * un porcentaje contra el objetivo (70%) y el piso (50%), no un promedio contra
 * una banda. Pintar aquí las cinco bandas haría que el mismo 62% se viera
 * distinto en el papel y en la herramienta.
 */
export const favorabilityChip = (value: number | null): string => {
  if (value === null) return chip("—", NSNR_BG, NSNR_TEXT, NSNR);
  const verdict = verdictForFavorability(value);
  const palette =
    verdict === "healthy"
      ? [POSITIVE_BG, POSITIVE_TEXT, POSITIVE_BORDER]
      : verdict === "watch"
        ? [YELLOW_BG, YELLOW_TEXT, YELLOW_BORDER]
        : [SOFTER_NEGATIVE_BG, SOFTER_NEGATIVE_TEXT, SOFTER_NEGATIVE_BORDER];
  return chip(formatPercent(value), palette[0], palette[1], palette[2]);
};

/** eNPS −100..100, coloreado por la banda del resultado. */
export const npsChip = (score: number | null): string => {
  if (score === null) return chip("—", NSNR_BG, NSNR_TEXT, NSNR);
  const band = npsBandForScore(score);
  const rounded = Math.round(score);
  return chip(
    `${rounded > 0 ? "+" : ""}${rounded}`,
    band.background,
    band.foreground,
    band.border
  );
};

export const verdictChip = (label: string, variant: string): string =>
  `<span class="verdict verdict-${variant}">${label}</span>`;

// --- Distribución 1–5 -------------------------------------------------------------

/** Desfavorables, neutrales, favorables y NS/NR — en ese orden. */
export type TierTotals = readonly [number, number, number, number];

const TIER_COLORS: readonly string[] = [SOFTER_NEGATIVE, YELLOW, POSITIVE, NSNR];

export const distributionTotals = (
  distribution: Distribution | null,
  nsnr: number
): TierTotals =>
  distribution === null
    ? [0, 0, 0, nsnr]
    : [
        distribution[0] + distribution[1],
        distribution[2],
        distribution[3] + distribution[4],
        nsnr,
      ];

/** Los cuatro tramos de una rama completa: sus preguntas y las de sus hijas. */
export const sectionTierTotals = (section: SectionResult): TierTotals => {
  const totals = [0, 0, 0, 0];
  const walk = (node: SectionResult) => {
    for (const question of node.questions) {
      if (!question.distribution) continue;
      totals[0] += question.distribution[0] + question.distribution[1];
      totals[1] += question.distribution[2];
      totals[2] += question.distribution[3] + question.distribution[4];
      totals[3] += question.nsnr;
    }
    node.children.forEach(walk);
  };
  walk(section);
  return totals as unknown as TierTotals;
};

/** Barra apilada desfavorable → neutral → favorable → NS/NR. */
export const stackBar = (totals: TierTotals): string => {
  const sum = totals.reduce((a, b) => a + b, 0);
  if (sum === 0) return `<div class="bar"><div style="width:100%;background:${NSNR_BG}"></div></div>`;
  const parts = totals
    .map((value, index) =>
      value > 0
        ? `<div style="width:${((value / sum) * 100).toFixed(2)}%;background:${TIER_COLORS[index]}"></div>`
        : ""
    )
    .join("");
  return `<div class="bar">${parts}</div>`;
};

/** El porcentaje de un tramo sobre el total de la barra, ya formateado. */
export const tierShare = (totals: TierTotals, index: number): string => {
  const sum = totals.reduce((a, b) => a + b, 0);
  return sum === 0 ? "—" : `${shareOf(totals[index], sum)}%`;
};

// --- Encabezados y leyendas -------------------------------------------------------

/** Subtítulo de bloque: barra vertical de marca + rótulo en versalitas. */
export const blockTitle = (label: string): string =>
  `<h3 class="block-title">${escapeHtml(label)}</h3>`;

const legendChip = (
  label: string,
  range: string,
  background: string,
  border: string
): string => `
  <span class="legend-item">
    <span class="dot" style="background:${background};border-color:${border}"></span>
    ${escapeHtml(label)}${range ? ` <em>${escapeHtml(range)}</em>` : ""}
  </span>`;

/**
 * Las cinco bandas del promedio 1–5 — la leyenda que acompaña un heatmap.
 *
 * El chip de las celdas grises lo pone quien llama, porque su rótulo depende de
 * la encuesta: "Reservado" solo es cierto cuando hay anonimato que proteger.
 */
export const bandLegend = (extra = ""): string => `
  <div class="legend">
    ${FAVORABILITY_BANDS.map((band) =>
      legendChip(band.label, band.range, band.background, band.border)
    ).join("")}
    ${extra}
  </div>`;

/** Los tres tramos + NS/NR — la leyenda de "Detalle por secciones". */
export const tierLegend = (): string => `
  <div class="legend">
    ${legendChip("Favorables", "4 a 5", POSITIVE_BG, POSITIVE_BORDER)}
    ${legendChip("Neutrales", "3 a 3.9", YELLOW_BG, YELLOW_BORDER)}
    ${legendChip("Desfavorables", "1 a 2.9", SOFTER_NEGATIVE_BG, SOFTER_NEGATIVE_BORDER)}
    ${legendChip("No sabe / No responde", "NS/NR", NSNR_BG, NSNR_BORDER)}
  </div>`;

/** La franja que encabeza Favorabilidad: cómo se lee el porcentaje y el veredicto. */
export const favorabilityVerdictStrip = (favorability: number): string => {
  const verdict = VERDICT_COPY[verdictForFavorability(favorability)];
  return `
    <div class="scale">
      <span class="scale-title">Favorabilidad general</span>
      <span class="legend-item"><span class="dot" style="background:${POSITIVE_BG};border-color:${POSITIVE_BORDER}"></span>Saludable <em>70% o más</em></span>
      <span class="legend-item"><span class="dot" style="background:${YELLOW_BG};border-color:${YELLOW_BORDER}"></span>Seguimiento <em>50% a 69%</em></span>
      <span class="legend-item"><span class="dot" style="background:${SOFTER_NEGATIVE_BG};border-color:${SOFTER_NEGATIVE_BORDER}"></span>Acción <em>menos de 50%</em></span>
      ${verdictChip(`${formatPercent(favorability)} · ${verdict.label}`, verdict.variant)}
    </div>`;
};

// --- Barras de cobertura ----------------------------------------------------------

export interface CoverageEntry {
  label: string;
  value: number;
  total: number;
  detail: string;
}

/** El "gráfico de cobertura": una barra por grupo, con su cifra al lado. */
export const coverageChart = (entries: readonly CoverageEntry[]): string =>
  `<div class="coverage">${entries
    .map(
      (entry) => `
    <div class="cov-row">
      <span class="cov-label">${escapeHtml(entry.label)}</span>
      <span class="cov-track"><span class="cov-fill" style="width:${Math.min(
        100,
        entry.total === 0 ? 0 : (entry.value / entry.total) * 100
      ).toFixed(2)}%"></span></span>
      <span class="cov-value">${escapeHtml(entry.detail)}</span>
    </div>`
    )
    .join("")}</div>`;

/** Una nota corta bajo un bloque. */
export const note = (text: string): string => `<p class="note">${escapeHtml(text)}</p>`;
