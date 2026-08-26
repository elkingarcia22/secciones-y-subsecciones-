import type { SurveyDraft } from "@/components/survey-builder";
import type {
  SectionResult,
  SegmentDefinition,
  SurveyResults,
} from "@/mocks/surveyResults";
import type { ScopedMetrics } from "../../summaryModel";
import type { PdfSegmentSlot, ReportRequest } from "../downloadTypes";

/** Paleta del documento. Todo lo demás sale de `favorabilityScale`. */
export const BRAND = "#0C5BEF";
export const INK = "#1a1f2e";
export const MUTED = "#6b7280";
export const PAPER_BORDER = "#e5e7eb";

/**
 * Columnas de grupo que caben en una grilla antes de que el número deje de
 * leerse. Pasado ese ancho el bloque se parte en tandas — "Grupo A", "Grupo B" —
 * en vez de encoger la tipografía hasta lo ilegible.
 */
export const MAX_GRID_COLUMNS = 6;

/** Rótulo de cada tanda cuando una grilla se parte. */
export const GRID_GROUP_LABELS = ["A", "B", "C", "D", "E", "F"] as const;

/**
 * Todo lo que un bloque necesita, calculado una sola vez.
 *
 * Los bloques no vuelven a tocar `results` crudo: si dos secciones leyeran la
 * participación por caminos distintos, el mismo reporte podría imprimir dos
 * tasas y ninguna sería verificable.
 */
export interface ReportData {
  draft: SurveyDraft;
  results: SurveyResults;
  request: ReportRequest;
  /** Árbol de secciones ya recortado por el filtro de población. */
  sections: readonly SectionResult[];
  favorability: number;
  metrics: ScopedMetrics;
  participation: {
    invited: number;
    completed: number;
    inProgress: number;
    rate: number;
  };
  /** Demográficos que el reporte puede desplegar, ya filtrados por anonimato. */
  reportable: readonly SegmentDefinition[];
  filterLabel: string | null;
}

/** Los demográficos que el lector eligió para un bloque configurable. */
export const chosenSegments = (
  data: ReportData,
  slot: PdfSegmentSlot
): readonly SegmentDefinition[] => {
  const keys = data.request.pdfSegments[slot] ?? [];
  return data.reportable.filter((segment) => keys.includes(segment.key));
};

/** Una sección del documento. El número lo pone el documento, no el bloque. */
export interface ReportSection {
  title: string;
  body: string;
  /** Secciones cortas que no deben partirse entre páginas. */
  keepTogether?: boolean;
}
