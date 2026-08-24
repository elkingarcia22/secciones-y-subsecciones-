import type { SurveyDraft } from "@/components/survey-builder";
import { SURVEY_KIND_LABELS } from "@/components/survey-builder";
import { formatPreviewDate } from "@/components/survey-preview/previewModel";
import {
  flattenResultSections,
  heatmapBySegment,
  participationBySegment,
  sectionResultsForFilters,
  type HeatmapRow,
  type SectionResult,
  type SurveyResults,
} from "@/mocks/surveyResults";
import {
  FAVORABILITY_BANDS,
  NSNR,
  NSNR_BG,
  NSNR_TEXT,
  POSITIVE,
  SOFTER_NEGATIVE,
  VERDICT_COPY,
  YELLOW,
  bandForScore,
  formatDelta,
  formatPercent,
  formatScore,
  verdictForFavorability,
} from "../favorabilityScale";
import type { PdfBlockId, ReportRequest } from "./downloadTypes";

/**
 * The visual PDF: the results screen retold as a printed document.
 *
 * It deliberately reuses the screen's own vocabulary — the same five bands,
 * the same three tiers, the same "Reservado" for masked cells — but translates
 * every interactive element into something a sheet of paper can carry: tooltips
 * become printed columns, hover states become nothing, and the heatmap's
 * scroll becomes a table sized to the page.
 *
 * Output is a standalone HTML document opened in a new window with `print()`
 * fired once it renders: the browser's own "Guardar como PDF" produces the
 * file. No PDF library enters the bundle for this.
 */

const BRAND = "#0C5BEF";
const INK = "#1a1f2e";
const MUTED = "#6b7280";
const PAPER_BORDER = "#e5e7eb";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// --- Shared fragments -----------------------------------------------------------

const scoreChip = (score: number | null): string => {
  if (score === null)
    return `<span class="chip" style="background:${NSNR_BG};color:${NSNR_TEXT};border-color:${NSNR}">—</span>`;
  const band = bandForScore(score);
  return `<span class="chip" style="background:${band.background};color:${band.foreground};border-color:${band.border}">${formatScore(score)}</span>`;
};

/** Three-tier stacked bar (+ NS/NR) out of a section's questions. */
const tierBar = (section: SectionResult): string => {
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
  const sum = totals.reduce((a, b) => a + b, 0);
  if (sum === 0) return `<div class="bar"><div style="width:100%;background:${NSNR_BG}"></div></div>`;
  const colors = [SOFTER_NEGATIVE, YELLOW, POSITIVE, NSNR];
  const parts = totals
    .map((value, index) =>
      value > 0
        ? `<div style="width:${((value / sum) * 100).toFixed(2)}%;background:${colors[index]}"></div>`
        : ""
    )
    .join("");
  return `<div class="bar">${parts}</div>`;
};

const distributionBar = (distribution: readonly number[], nsnr: number): string => {
  const values = [...distribution, nsnr];
  const colors = [...FAVORABILITY_BANDS.map((band) => band.color ?? NSNR), NSNR];
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum === 0) return "";
  const parts = values
    .map((value, index) =>
      value > 0
        ? `<div style="width:${((value / sum) * 100).toFixed(2)}%;background:${colors[index]}"></div>`
        : ""
    )
    .join("");
  return `<div class="bar">${parts}</div>`;
};

// --- Blocks ----------------------------------------------------------------------

interface ReportData {
  draft: SurveyDraft;
  results: SurveyResults;
  request: ReportRequest;
  sections: readonly SectionResult[];
  favorability: number;
  segmentLabel: string | null;
  filterLabel: string | null;
}

const coverBlock = ({ draft, results, filterLabel }: ReportData): string => {
  const kind = draft.kind ? SURVEY_KIND_LABELS[draft.kind] : "Encuesta";
  const start = formatPreviewDate(draft.startDate) ?? "—";
  const end = formatPreviewDate(draft.endDate) ?? "—";
  const generated = new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  return `
  <header class="cover">
    <div class="cover-top">
      <span class="cover-kind">${escapeHtml(kind)}</span>
      <span class="cover-brand">Reporte de resultados</span>
    </div>
    <h1>${escapeHtml(draft.name)}</h1>
    <div class="cover-meta">
      <span><strong>Período</strong> ${escapeHtml(start)} — ${escapeHtml(end)}</span>
      <span><strong>Población</strong> ${escapeHtml(filterLabel ?? "Toda la empresa")}</span>
      <span><strong>Invitados</strong> ${results.participation.invited.toLocaleString("es-CO")}</span>
      <span><strong>Generado</strong> ${escapeHtml(generated)}</span>
    </div>
  </header>`;
};

const summaryBlock = ({ results, favorability }: ReportData): string => {
  const verdict = VERDICT_COPY[verdictForFavorability(favorability)];
  const favDelta = favorability - results.previousFavorability;
  const rateDelta = results.participation.rate - results.participation.previousRate;
  const nps = results.nps;

  const kpi = (label: string, value: string, detail: string, chip?: string) => `
    <div class="kpi">
      <span class="kpi-label">${label}</span>
      <span class="kpi-value">${value}</span>
      <span class="kpi-detail">${detail}</span>
      ${chip ?? ""}
    </div>`;

  const legend = [...FAVORABILITY_BANDS]
    .map(
      (band) => `
      <span class="legend-item">
        <span class="dot" style="background:${band.background};border-color:${band.border}"></span>
        ${band.label} <em>${band.range}</em>
      </span>`
    )
    .join("");

  return `
  <section>
    <h2>Resumen ejecutivo</h2>
    <div class="kpi-row">
      ${kpi(
        "Favorabilidad general",
        formatPercent(favorability),
        `${formatDelta(favDelta)} vs. medición anterior`,
        `<span class="verdict verdict-${verdict.variant}">${verdict.label}</span>`
      )}
      ${kpi(
        "Participación",
        formatPercent(results.participation.rate),
        `${results.participation.completed.toLocaleString("es-CO")} de ${results.participation.invited.toLocaleString("es-CO")} invitados · ${formatDelta(rateDelta)}`
      )}
      ${
        nps
          ? kpi("eNPS", String(Math.round(nps.score)), `${formatDelta(nps.score - nps.previousScore).replace(" pp", " pts")} vs. anterior`)
          : kpi("eNPS", "—", "Esta medición no incluyó pregunta eNPS")
      }
    </div>
    <div class="legend"><span class="legend-title">Escala de lectura (promedio 1–5)</span>${legend}</div>
  </section>`;
};

const participationBlock = (data: ReportData): string => {
  const { results, request } = data;
  const segment = results.segments.find((candidate) => candidate.key === request.pdfSegmentKey);
  if (!segment || segment.perPerson) return "";
  const rows = participationBySegment(results, segment, request.filter ? [request.filter] : []);
  const body = rows
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td class="num">${row.invited.toLocaleString("es-CO")}</td>
        <td class="num">${row.completed.toLocaleString("es-CO")}</td>
        <td class="num">${row.inProgress.toLocaleString("es-CO")}</td>
        <td class="rate">
          <div class="rate-cell">
            <div class="track"><div class="fill" style="width:${Math.min(100, row.rate)}%"></div></div>
            <span class="num">${formatPercent(row.rate)}</span>
          </div>
        </td>
      </tr>`
    )
    .join("");
  return `
  <section class="break-avoid">
    <h2>Participación por ${escapeHtml(segment.label.toLowerCase())}</h2>
    <table>
      <thead><tr><th>${escapeHtml(segment.label)}</th><th class="num">Invitados</th><th class="num">Completadas</th><th class="num">En curso</th><th>Tasa de respuesta</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </section>`;
};

const favorabilityBlock = ({ sections }: ReportData): string => {
  const cards = sections
    .map((section) => {
      const children = flattenResultSections(section.children)
        .map(
          (child) => `
          <tr>
            <td class="dim">${escapeHtml(child.numbering)}</td>
            <td style="padding-left:${8 + (child.depth - 1) * 14}px">${escapeHtml(child.title)}</td>
            <td class="num">${child.n.toLocaleString("es-CO")}</td>
            <td class="center">${scoreChip(child.n > 0 ? child.score : null)}</td>
            <td class="num">${child.n > 0 ? formatPercent(child.favorability) : "—"}</td>
          </tr>`
        )
        .join("");
      return `
      <div class="section-card break-avoid">
        <div class="section-head">
          <span class="section-title"><span class="dim">${escapeHtml(section.numbering)}</span> ${escapeHtml(section.title)}</span>
          <span class="section-figures">${scoreChip(section.n > 0 ? section.score : null)} <strong>${section.n > 0 ? formatPercent(section.favorability) : "—"}</strong> favorable</span>
        </div>
        ${tierBar(section)}
        ${
          children
            ? `<table class="sub"><thead><tr><th></th><th>Subsección</th><th class="num">Respuestas</th><th class="center">Puntaje</th><th class="num">Favorabilidad</th></tr></thead><tbody>${children}</tbody></table>`
            : ""
        }
      </div>`;
    })
    .join("");
  return `<section><h2>Favorabilidad por secciones</h2>${cards}</section>`;
};

const heatmapBlock = (data: ReportData): string => {
  const { results, request } = data;
  const segment = results.segments.find((candidate) => candidate.key === request.pdfSegmentKey);
  if (!segment || segment.perPerson) return "";
  const heatmap = heatmapBySegment(results, segment, request.filter ? [request.filter] : []);
  if (heatmap.columns.length === 0) return "";

  const cell = (score: number | null, masked: boolean): string => {
    if (masked) return `<td class="heat" style="background:${NSNR_BG};color:${NSNR_TEXT}">Reservado</td>`;
    if (score === null) return `<td class="heat" style="color:${MUTED}">—</td>`;
    const band = bandForScore(score);
    return `<td class="heat" style="background:${band.background};color:${band.foreground}">${formatScore(score)}</td>`;
  };

  const rows: string[] = [];
  const walk = (nodes: readonly HeatmapRow[]) => {
    for (const node of nodes) {
      if (node.kind !== "section") continue;
      rows.push(`
        <tr>
          <td class="heat-label" style="padding-left:${8 + node.depth * 14}px"><span class="dim">${escapeHtml(node.numbering)}</span> ${escapeHtml(node.label)}</td>
          ${cell(node.total, false)}
          ${node.cells.map((entry) => cell(entry.score, entry.masked)).join("")}
        </tr>`);
      walk(node.children);
    }
  };
  walk(heatmap.rows);

  return `
  <section>
    <h2>Heatmap por ${escapeHtml(segment.label.toLowerCase())}</h2>
    <p class="note">Celdas en gris: grupos con menos de ${results.threshold} respuestas. Sus conteos existen, pero sus resultados se reservan para proteger el anonimato.</p>
    <table class="heatmap">
      <thead><tr><th>Sección</th><th class="center">Total</th>${heatmap.columns
        .map((column) => `<th class="center">${escapeHtml(column.label)}</th>`)
        .join("")}</tr></thead>
      <tbody>
        ${rows.join("")}
        <tr class="totals"><td class="heat-label">Total por grupo</td><td class="heat"></td>${heatmap.columnTotals
          .map((total) => cell(total, total === null))
          .join("")}</tr>
      </tbody>
    </table>
  </section>`;
};

const questionsBlock = ({ sections }: ReportData): string => {
  const ranked = flattenResultSections(sections)
    .flatMap((section) =>
      section.questions
        .filter((question) => question.scored && question.favorability !== null)
        .map((question) => ({ ...question, sectionTitle: section.title, numbering: section.numbering }))
    )
    .sort((a, b) => (a.favorability ?? 0) - (b.favorability ?? 0))
    .slice(0, 10);

  const body = ranked
    .map(
      (question, index) => `
      <tr>
        <td class="dim">${index + 1}</td>
        <td>
          <div class="q-statement">${escapeHtml(question.statement)}</div>
          <div class="q-section">${escapeHtml(question.numbering)} ${escapeHtml(question.sectionTitle)} · ${question.n.toLocaleString("es-CO")} respuestas</div>
        </td>
        <td class="center">${scoreChip(question.score)}</td>
        <td class="num">${question.favorability !== null ? formatPercent(question.favorability) : "—"}</td>
        <td class="dist">${question.distribution ? distributionBar(question.distribution, question.nsnr) : ""}</td>
      </tr>`
    )
    .join("");

  return `
  <section class="break-avoid">
    <h2>Preguntas a priorizar</h2>
    <p class="note">Las diez preguntas con menor favorabilidad, de peor a mejor: el orden en el que conviene actuar.</p>
    <table>
      <thead><tr><th>#</th><th>Pregunta</th><th class="center">Puntaje</th><th class="num">Favorabilidad</th><th>Distribución 1→5 + NS/NR</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </section>`;
};

const npsBlock = ({ results }: ReportData): string => {
  const nps = results.nps;
  if (!nps) return "";
  const total = Math.max(1, nps.promoters + nps.passives + nps.detractors);
  const share = (value: number) => ((value / total) * 100).toFixed(1);
  return `
  <section class="break-avoid">
    <h2>eNPS</h2>
    <div class="nps">
      <div class="nps-score">
        <span class="kpi-value">${Math.round(nps.score)}</span>
        <span class="kpi-detail">${formatDelta(nps.score - nps.previousScore).replace(" pp", " pts")} vs. medición anterior · ${nps.n.toLocaleString("es-CO")} respuestas</span>
      </div>
      <div class="nps-mix">
        <div class="bar bar-lg">
          <div style="width:${share(nps.promoters)}%;background:#22c55e"></div>
          <div style="width:${share(nps.passives)}%;background:#facc15"></div>
          <div style="width:${share(nps.detractors)}%;background:#ef4444"></div>
        </div>
        <div class="nps-legend">
          <span><span class="dot" style="background:#22c55e"></span>Promotores ${share(nps.promoters).replace(".", ",")}%</span>
          <span><span class="dot" style="background:#facc15"></span>Neutros ${share(nps.passives).replace(".", ",")}%</span>
          <span><span class="dot" style="background:#ef4444"></span>Detractores ${share(nps.detractors).replace(".", ",")}%</span>
        </div>
      </div>
    </div>
  </section>`;
};

const commentsBlock = ({ results }: ReportData): string => {
  if (results.verbatims.length === 0) return "";
  const edge = { promoter: "#22c55e", passive: "#facc15", detractor: "#ef4444" } as const;
  const label = { promoter: "Positivo", passive: "Neutral", detractor: "Negativo" } as const;
  const cards = results.verbatims
    .slice(0, 8)
    .map(
      (verbatim) => `
      <div class="comment" style="border-left-color:${edge[verbatim.band]}">
        <p>“${escapeHtml(verbatim.text)}”</p>
        <div class="comment-meta">
          <span>${escapeHtml(verbatim.question)}</span>
          <span>${label[verbatim.band]} · ${escapeHtml(verbatim.segment)}</span>
        </div>
      </div>`
    )
    .join("");
  return `
  <section class="break-avoid">
    <h2>Comentarios destacados</h2>
    <p class="note">Respuestas abiertas representativas, citadas textualmente y sin autor: la encuesta es anónima.</p>
    <div class="comments">${cards}</div>
  </section>`;
};

const BLOCK_RENDERERS: Readonly<Record<PdfBlockId, (data: ReportData) => string>> = {
  summary: summaryBlock,
  participation: participationBlock,
  favorability: favorabilityBlock,
  heatmap: heatmapBlock,
  questions: questionsBlock,
  nps: npsBlock,
  comments: commentsBlock,
};

// --- Document ---------------------------------------------------------------------

const STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4; margin: 14mm 12mm 16mm; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: ${INK}; font-size: 12px; line-height: 1.5; background: #fff;
  }
  .cover {
    background: linear-gradient(120deg, ${BRAND}, #2f7bff 65%, #6aa4ff);
    color: #fff; border-radius: 16px; padding: 28px 28px 22px; margin-bottom: 24px;
  }
  .cover-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .cover-kind {
    background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.35);
    border-radius: 999px; padding: 3px 12px; font-size: 11px; font-weight: 700; letter-spacing: .04em;
  }
  .cover-brand { font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; opacity: .85; }
  .cover h1 { font-size: 26px; font-weight: 800; letter-spacing: -.02em; margin-bottom: 16px; }
  .cover-meta { display: flex; flex-wrap: wrap; gap: 6px 24px; font-size: 11.5px; opacity: .95; }
  .cover-meta strong { display: block; font-size: 9.5px; text-transform: uppercase; letter-spacing: .08em; opacity: .75; }
  section { margin-bottom: 26px; }
  .break-avoid { break-inside: avoid; }
  h2 {
    font-size: 15px; font-weight: 800; letter-spacing: -.01em; margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 2px solid ${BRAND};
  }
  .note { color: ${MUTED}; font-size: 11px; margin-bottom: 10px; }
  .kpi-row { display: flex; gap: 12px; margin-bottom: 14px; }
  .kpi {
    flex: 1; border: 1px solid ${PAPER_BORDER}; border-radius: 12px; padding: 14px 16px;
    display: flex; flex-direction: column; gap: 2px; break-inside: avoid;
  }
  .kpi-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: ${MUTED}; }
  .kpi-value { font-size: 30px; font-weight: 800; letter-spacing: -.03em; line-height: 1.15; }
  .kpi-detail { font-size: 11px; color: ${MUTED}; }
  .verdict {
    align-self: flex-start; margin-top: 6px; border-radius: 999px; padding: 2px 10px;
    font-size: 10.5px; font-weight: 700;
  }
  .verdict-positive { background: #dcfce7; color: #15803d; }
  .verdict-warning { background: #fef9c3; color: #a16207; }
  .verdict-negative { background: #fee2e2; color: #b91c1c; }
  .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; font-size: 10.5px; color: ${MUTED}; }
  .legend-title { font-weight: 700; color: ${INK}; margin-right: 2px; }
  .legend-item { display: inline-flex; align-items: center; gap: 5px; }
  .legend-item em { font-style: normal; opacity: .75; }
  .dot { width: 9px; height: 9px; border-radius: 999px; border: 1px solid transparent; display: inline-block; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th {
    text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: .06em;
    color: ${MUTED}; font-weight: 700; padding: 6px 8px; border-bottom: 1px solid ${PAPER_BORDER};
  }
  td { padding: 6px 8px; border-bottom: 1px solid #f1f3f5; vertical-align: middle; }
  tr { break-inside: avoid; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .center { text-align: center; }
  .dim { color: ${MUTED}; }
  .chip {
    display: inline-block; min-width: 34px; text-align: center; border-radius: 999px;
    border: 1px solid; padding: 1px 8px; font-weight: 700; font-size: 10.5px; font-variant-numeric: tabular-nums;
  }
  .bar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: #f1f3f5; }
  .bar-lg { height: 16px; }
  .rate-cell { display: flex; align-items: center; gap: 8px; }
  .track { flex: 1; height: 7px; border-radius: 999px; background: #eef1f5; overflow: hidden; min-width: 70px; }
  .fill { height: 100%; border-radius: 999px; background: ${BRAND}; }
  .section-card { border: 1px solid ${PAPER_BORDER}; border-radius: 12px; padding: 12px 14px; margin-bottom: 12px; }
  .section-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 8px; }
  .section-title { font-size: 12.5px; font-weight: 700; }
  .section-figures { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; font-size: 11px; color: ${MUTED}; }
  .section-figures strong { color: ${INK}; font-size: 12px; }
  table.sub { margin-top: 10px; }
  table.heatmap th, table.heatmap td { padding: 5px 6px; }
  td.heat { text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; border: 1px solid #fff; border-radius: 4px; font-size: 10.5px; }
  td.heat-label { font-weight: 600; }
  tr.totals td { border-top: 2px solid ${PAPER_BORDER}; font-weight: 700; }
  .q-statement { font-weight: 600; }
  .q-section { color: ${MUTED}; font-size: 10px; margin-top: 1px; }
  td.dist { width: 140px; }
  .nps { display: flex; gap: 24px; align-items: center; border: 1px solid ${PAPER_BORDER}; border-radius: 12px; padding: 16px; }
  .nps-score { min-width: 170px; display: flex; flex-direction: column; gap: 2px; }
  .nps-mix { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .nps-legend { display: flex; gap: 16px; font-size: 10.5px; color: ${MUTED}; }
  .nps-legend span { display: inline-flex; align-items: center; gap: 5px; }
  .comments { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .comment {
    border: 1px solid ${PAPER_BORDER}; border-left: 3px solid; border-radius: 10px;
    padding: 10px 12px; break-inside: avoid;
  }
  .comment p { font-size: 11px; font-style: italic; margin-bottom: 6px; }
  .comment-meta { display: flex; justify-content: space-between; gap: 8px; font-size: 9.5px; color: ${MUTED}; }
  .doc-footer { margin-top: 8px; padding-top: 10px; border-top: 1px solid ${PAPER_BORDER}; font-size: 9.5px; color: ${MUTED}; display: flex; justify-content: space-between; }
`;

/**
 * Weighted favorability of the (possibly filtered) section tree, so the PDF's
 * headline matches the population the reader chose rather than the company's.
 */
const aggregateFavorability = (sections: readonly SectionResult[], fallback: number): number => {
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
  const filters = request.filter ? [request.filter] : [];
  const sections = sectionResultsForFilters(results, filters);
  const filterSegment = request.filter
    ? results.segments.find((segment) => segment.key === request.filter?.key)
    : undefined;
  const filterOption = filterSegment?.options.find(
    (option) => option.id === request.filter?.optionId
  );

  const data: ReportData = {
    draft,
    results,
    request,
    sections,
    favorability: request.filter
      ? aggregateFavorability(sections, results.favorability)
      : results.favorability,
    segmentLabel:
      results.segments.find((segment) => segment.key === request.pdfSegmentKey)?.label ?? null,
    filterLabel: filterOption ? `${filterSegment?.label}: ${filterOption.label}` : null,
  };

  const blocks = request.pdfBlocks
    .map((blockId) => BLOCK_RENDERERS[blockId]?.(data) ?? "")
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(draft.name)} — Reporte de resultados</title>
<style>${STYLES}</style>
</head>
<body>
${coverBlock(data)}
${blocks}
<footer class="doc-footer">
  <span>${escapeHtml(draft.name)} · Reporte generado el ${new Date().toLocaleDateString("es-CO")}</span>
  <span>Los grupos con menos de ${results.threshold} respuestas se reportan como “Reservado”.</span>
</footer>
</body>
</html>`;
}

/**
 * Renders the document into a hidden same-page iframe and fires the print
 * dialog: "Guardar como PDF" there is the download. An iframe instead of
 * `window.open` on purpose — a popup blocker can silently eat a new tab, and
 * a report that sometimes doesn't appear reads as a broken button.
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
  // Fallback for browsers that never fire afterprint on iframes.
  setTimeout(cleanup, 120_000);

  // Give the layout a beat to settle before the print dialog freezes it.
  setTimeout(() => {
    win.focus();
    win.print();
  }, 350);
  return true;
}
