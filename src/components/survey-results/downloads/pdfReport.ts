import type { SurveyDraft } from "@/components/survey-builder";
import { SURVEY_KIND_LABELS } from "@/components/survey-builder";
import { formatPreviewDate } from "@/components/survey-preview/previewModel";
import {
  participationBySegment,
  sectionResultsForFilters,
  type SectionResult,
  type SurveyResults,
} from "@/mocks/surveyResults";
import { SCOPE_ALL, resolveScope, scopedMetrics } from "../summaryModel";
import {
  PDF_SECTIONS,
  reportableSegments,
  type PdfSectionId,
  type ReportRequest,
} from "./downloadTypes";
import { participationBlock, sectionsBlock, verificationBlock } from "./pdf/blocks";
import {
  aiBlock,
  gapsBlock,
  heatmapBlock,
  npsBlock,
  questionsBlock,
} from "./pdf/breakdownBlocks";
import { count, escapeHtml } from "./pdf/primitives";
import { STYLES } from "./pdf/styles";
import type { ReportData, ReportSection } from "./pdf/tokens";

/**
 * El reporte general: la medición contada para quien decide, no para quien
 * analiza.
 *
 * El documento alterna dos clases de sección y ese ritmo es la función. Las
 * generales — verificación, favorabilidad por secciones, análisis IA — son la
 * lectura de la encuesta completa y salen iguales para todo lector; las
 * configurables despliegan los demográficos que el lector eligió. Leer un corte
 * por área sin haber visto antes el mapa general es cómo se confunde "esta área
 * está mal" con "toda la empresa está mal".
 *
 * Nada aquí se compara contra una medición anterior. Este documento responde
 * "¿qué pasa hoy?"; la historia de una cifra es otra pregunta y mezclarlas
 * convierte cada número en dos.
 *
 * Sale como HTML impreso desde un iframe: el "Guardar como PDF" del navegador
 * produce el archivo, sin meter una librería de PDF en el bundle.
 */

const SECTION_BUILDERS: Readonly<
  Record<PdfSectionId, (data: ReportData) => ReportSection | null>
> = {
  verification: verificationBlock,
  participation: participationBlock,
  sections: sectionsBlock,
  heatmap: heatmapBlock,
  questions: questionsBlock,
  nps: npsBlock,
  gaps: gapsBlock,
  ai: aiBlock,
};

const coverBlock = ({ draft, participation, filterLabel }: ReportData): string => {
  const kind = draft.kind ? SURVEY_KIND_LABELS[draft.kind] : "Encuesta";
  const start = formatPreviewDate(draft.startDate) ?? "—";
  const end = formatPreviewDate(draft.endDate) ?? "—";
  const generated = new Date().toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `
  <header class="cover">
    <div class="cover-top">
      <span class="cover-kind">${escapeHtml(kind)}</span>
      <span class="cover-brand">Reporte general</span>
    </div>
    <h1>${escapeHtml(draft.name)}${filterLabel ? ` <span class="cover-cut">— ${escapeHtml(filterLabel)}</span>` : ""}</h1>
    <div class="cover-meta">
      <span><strong>Período</strong> ${escapeHtml(start)} — ${escapeHtml(end)}</span>
      <span><strong>Población</strong> ${escapeHtml(filterLabel ?? "Toda la empresa")}</span>
      <span><strong>Invitados</strong> ${count(participation.invited)}</span>
      <span><strong>Generado</strong> ${escapeHtml(generated)}</span>
    </div>
  </header>`;
};

/**
 * Favorabilidad ponderada del árbol (posiblemente filtrado), para que el titular
 * del PDF hable de la población que el lector eligió y no de la empresa entera.
 */
const aggregateFavorability = (
  sections: readonly SectionResult[],
  fallback: number
): number => {
  let weighted = 0;
  let n = 0;
  for (const section of sections) {
    weighted += section.favorability * section.n;
    n += section.n;
  }
  return n > 0 ? Math.round((weighted / n) * 10) / 10 : fallback;
};

export function buildPdfDocument(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const filters = request.filters;
  const sections = sectionResultsForFilters(results, filters);
  const filterSegment = filters.length
    ? results.segments.find((segment) => segment.key === filters[0].key)
    : undefined;
  const filterOptionLabels = filters
    .map((filter) => filterSegment?.options.find((option) => option.id === filter.optionId)?.label)
    .filter((label): label is string => Boolean(label));

  // Las cifras de titular se leen como las lee la pestaña Resumen, sobre la
  // misma población recortada, para que el papel y la pantalla no puedan
  // discrepar sobre un número.
  const scope = resolveScope({ ...results, sections }, SCOPE_ALL);
  const metrics = scopedMetrics(scope);

  // Con un filtro puesto, la participación de toda la encuesta ya no es la de
  // la gente en vista, así que se re-totaliza desde los grupos que sobrevivieron
  // — exactamente lo que hace el titular de la pestaña.
  const participationRows = filterSegment
    ? participationBySegment(results, filterSegment, filters)
    : [];
  const participation = filterSegment
    ? (() => {
        const completed = participationRows.reduce((sum, row) => sum + row.completed, 0);
        const inProgress = participationRows.reduce((sum, row) => sum + row.inProgress, 0);
        const invited = participationRows.reduce((sum, row) => sum + row.invited, 0);
        return {
          invited,
          completed,
          inProgress,
          rate: invited === 0 ? 0 : Math.round((completed / invited) * 1000) / 10,
        };
      })()
    : {
        invited: results.participation.invited,
        completed: results.participation.completed,
        inProgress: results.participation.inProgress,
        rate: results.participation.rate,
      };

  const data: ReportData = {
    draft,
    results,
    request,
    sections,
    favorability: filters.length
      ? aggregateFavorability(sections, results.favorability)
      : results.favorability,
    metrics,
    participation,
    reportable: reportableSegments(results.segments),
    filterLabel: filterOptionLabels.length
      ? `${filterSegment?.label}: ${filterOptionLabels.join(", ")}`
      : null,
  };

  // Las secciones apagadas no imprimen, y las que quedan se renumeran: un
  // documento que salta del 3 al 5 hace pensar en una página perdida.
  const body = PDF_SECTIONS.filter((section) => request.pdfSections.includes(section.id))
    .map((section) => SECTION_BUILDERS[section.id](data))
    .filter((section): section is ReportSection => section !== null)
    .map(
      (section, index) => `
  <section${section.keepTogether ? ' class="break-avoid"' : ""}>
    <h2><span class="h2-index">${index + 1}</span>${escapeHtml(section.title)}</h2>
    ${section.body}
  </section>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(draft.name)} — Reporte general</title>
<style>${STYLES}</style>
</head>
<body>
${coverBlock(data)}
${body}
<footer class="doc-footer">
  <span>${escapeHtml(draft.name)} · Reporte general generado el ${new Date().toLocaleDateString("es-CO")}</span>
  <span>${
    draft.visibility === "anonymous"
      ? `Los grupos con menos de ${results.threshold} respuestas se reportan como “Reservado”.`
      : "Encuesta nominal: los resultados pueden atribuirse."
  }</span>
</footer>
</body>
</html>`;
}

/**
 * Renderiza el documento en un iframe oculto de la misma página y dispara el
 * diálogo de impresión: "Guardar como PDF" ahí es la descarga. Iframe en vez de
 * `window.open` a propósito — un bloqueador de popups puede comerse una pestaña
 * nueva en silencio, y un reporte que a veces no aparece se lee como un botón
 * roto.
 */
export function openPdfReport(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): boolean {
  const html = buildPdfDocument(draft, results, request);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => frame.remove();
  win.addEventListener("afterprint", () => setTimeout(cleanup, 500));
  // Respaldo para navegadores que nunca disparan afterprint en iframes.
  setTimeout(cleanup, 120_000);

  // Un respiro para que el layout se asiente antes de que el diálogo lo congele.
  setTimeout(() => {
    win.focus();
    win.print();
  }, 350);
  return true;
}
