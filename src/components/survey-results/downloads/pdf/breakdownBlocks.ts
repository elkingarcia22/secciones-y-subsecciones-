import {
  heatmapBySegment,
  flattenResultSections,
  npsBySection,
  npsBySegmentData,
  type HeatmapRow,
  type NpsSectionDetail,
  type SegmentDefinition,
  type SegmentOption,
} from "@/mocks/surveyResults";
import { buildSurveyAnalysis, type InsightKind } from "@/mocks/surveyInsights";
import {
  NSNR,
  NSNR_BG,
  NSNR_TEXT,
  bandForScore,
  formatPercent,
  formatScore,
} from "../../favorabilityScale";
import { analyseSegmentGaps } from "../../summaryModel";
import {
  GRID_GROUP_LABELS,
  MAX_GRID_COLUMNS,
  chosenSegments,
  type ReportData,
  type ReportSection,
} from "./tokens";
import {
  bandLegend,
  blockTitle,
  chunk,
  count,
  distributionTotals,
  escapeHtml,
  favorabilityChip,
  indent,
  npsChip,
  scoreChip,
  shareOf,
  stackBar,
  tierLegend,
  tierShare,
  verdictChip,
} from "./primitives";

/**
 * Los bloques que abren el resultado: heatmap, preguntas, eNPS, brechas y la
 * lectura de la IA.
 *
 * Van después de la lectura general (`blocks.ts`) y no antes, porque un corte
 * por área que se lee sin haber visto el mapa completo es cómo se confunde
 * "esta área está mal" con "toda la empresa está mal". Los cuatro primeros
 * despliegan los demográficos que el lector eligió; el análisis de IA cierra.
 */

// --- 5 · Heatmap --------------------------------------------------------------------

/**
 * Celda pintada con la banda del promedio, o gris cuando el grupo está bajo el
 * umbral. El color es el mismo que usa la grilla en pantalla: si el papel y la
 * herramienta pintaran distinto el mismo 3,4, una de las dos estaría mintiendo.
 */
const heatCell = (score: number | null, masked: boolean, maskedLabel: string): string => {
  if (masked || score === null) {
    return `<td class="heat" style="background:${NSNR_BG};color:${NSNR_TEXT};font-size:8.5px">${
      masked ? escapeHtml(maskedLabel) : "—"
    }</td>`;
  }
  const band = bandForScore(score);
  return `<td class="heat" style="background:${band.background};color:${band.foreground}">${formatScore(score)}</td>`;
};

/** Anchos fijos: la última tanda de una grilla partida no debe estirar sus
 * columnas al doble, o dos mitades del mismo heatmap se leen como dos escalas
 * distintas. La tanda corta rellena con una columna vacía. */
const LABEL_WIDTH = 26;
const TOTAL_WIDTH = 8;
const COLUMN_WIDTH = (100 - LABEL_WIDTH - TOTAL_WIDTH) / MAX_GRID_COLUMNS;

const gridColgroup = (columns: number): string => {
  const filler = MAX_GRID_COLUMNS - columns;
  return `<colgroup>
    <col style="width:${LABEL_WIDTH}%" /><col style="width:${TOTAL_WIDTH}%" />
    ${Array.from({ length: columns }, () => `<col style="width:${COLUMN_WIDTH.toFixed(2)}%" />`).join("")}
    ${filler > 0 ? `<col style="width:${(COLUMN_WIDTH * filler).toFixed(2)}%" />` : ""}
  </colgroup>`;
};

const fillerCell = (columns: number, tag: "th" | "td" = "td"): string =>
  MAX_GRID_COLUMNS - columns > 0 ? `<${tag} style="border:0;background:transparent"></${tag}>` : "";

/**
 * Heatmap por cada demográfico elegido, igual que la grilla de la herramienta:
 * filas de sección y subsección, una columna por grupo, la banda del promedio
 * como color de fondo.
 *
 * Cuando hay más grupos de los que caben legibles, la grilla se parte en tandas
 * en vez de encoger la cifra: un heatmap ilegible no es un heatmap más completo.
 */
export const heatmapBlock = (data: ReportData): ReportSection | null => {
  const { results, request, draft } = data;
  const segments = chosenSegments(data, "heatmap");
  if (segments.length === 0) return null;

  // "Reservado" promete que el dato existe pero se protege. En una encuesta
  // nominal no hay nada que proteger: la celda está vacía porque nadie
  // respondió, y decir "Reservado" ahí haría sospechar de una censura que no
  // ocurrió.
  const maskedLabel = draft.visibility === "anonymous" ? "Reservado" : "Sin datos";

  const grids = segments
    .map((segment) => {
      const heatmap = heatmapBySegment(results, segment, request.filters);
      if (heatmap.columns.length === 0) return "";

      const rows: { label: string; numbering: string; depth: number; total: number | null; cells: readonly { score: number | null; masked: boolean }[] }[] = [];
      const walk = (nodes: readonly HeatmapRow[]) => {
        for (const node of nodes) {
          if (node.kind !== "section") continue;
          rows.push({
            label: node.label,
            numbering: node.numbering,
            depth: node.depth,
            total: node.total,
            cells: node.cells,
          });
          walk(node.children);
        }
      };
      walk(heatmap.rows);
      if (rows.length === 0) return "";

      const parts = chunk([...heatmap.columns.keys()], MAX_GRID_COLUMNS);
      const grid = parts
        .map((indexes, partIndex) => {
          const width = indexes.length;
          const head = indexes
            .map(
              (index) =>
                `<th class="center">${escapeHtml(heatmap.columns[index].label)}</th>`
            )
            .join("");
          const body = rows
            .map(
              (row) => `
          <tr>
            <td class="heat-label" style="${indent(row.depth)}"><span class="dim">${escapeHtml(row.numbering)}</span> ${escapeHtml(row.label)}</td>
            ${heatCell(row.total, false, maskedLabel)}
            ${indexes
              .map((index) =>
                heatCell(
                  row.cells[index]?.score ?? null,
                  row.cells[index]?.masked ?? false,
                  maskedLabel
                )
              )
              .join("")}
            ${fillerCell(width)}
          </tr>`
            )
            .join("");
          const totals = indexes
            .map((index) => heatCell(heatmap.columnTotals[index] ?? null, false, maskedLabel))
            .join("");

          return `
        <div class="grid-part">
          ${parts.length > 1 ? blockTitle(`Grupo ${GRID_GROUP_LABELS[partIndex] ?? partIndex + 1}`) : ""}
          <table class="heatmap">
            ${gridColgroup(width)}
            <thead><tr><th>Sección</th><th class="center">Total</th>${head}${fillerCell(width, "th")}</tr></thead>
            <tbody>
              ${body}
              <tr class="totals">
                <td class="heat-label">Total por grupo</td>
                <td class="heat"></td>
                ${totals}
                ${fillerCell(width)}
              </tr>
            </tbody>
          </table>
        </div>`;
        })
        .join("");

      return `
      <div class="block">
        ${blockTitle(`Heatmap por ${segment.label.toLowerCase()}`)}
        ${grid}
        ${bandLegend(
          `<span class="legend-item"><span class="dot" style="background:${NSNR_BG};border-color:${NSNR}"></span>${maskedLabel}</span>`
        )}
      </div>`;
    })
    .join("");

  if (!grids) return null;

  return {
    title: "Heatmap por demográficos",
    body: `
    <p class="note">${
      draft.visibility === "anonymous"
        ? `Cada celda es el promedio 1 a 5 de ese cruce, y su color es la banda en la que cae. Las celdas grises son grupos con menos de ${results.threshold} respuestas: sus conteos existen, pero sus resultados se reservan para proteger el anonimato.`
        : "Cada celda es el promedio 1 a 5 de ese cruce, y su color es la banda en la que cae. Las celdas grises son grupos que aún no tienen respuestas."
    }</p>
    ${grids}`,
  };
};

// --- 6 · Preguntas ------------------------------------------------------------------

/**
 * El detalle pregunta por pregunta de las secciones que el lector eligió.
 *
 * Es configurable porque el ranking completo puede pasar de cien filas: un
 * comité que revisa liderazgo no necesita imprimir las preguntas de ambiente
 * físico para llegar a él.
 */
export const questionsBlock = (data: ReportData): ReportSection | null => {
  const { sections, request } = data;
  // Vacío es "ninguna", no "todas": el panel avisa que sin secciones elegidas
  // el detalle no se imprime, y un bloque que en ese caso imprimiera las
  // cuarenta y seis preguntas desmentiría el aviso.
  const wanted = request.pdfQuestionSections;
  const chosen = sections.filter((section) => wanted.includes(section.id));
  if (chosen.length === 0) return null;

  const blocks = chosen
    .map((section) => {
      const nodes = flattenResultSections([section]);
      const rows = nodes
        .flatMap((node) =>
          node.questions
            .filter((question) => question.scored && question.n > 0)
            .map((question) => ({ node, question }))
        )
        .map(({ node, question }, index) => {
          const totals = distributionTotals(question.distribution, question.nsnr);
          return `
        <tr>
          <td class="num dim">${index + 1}</td>
          <td>${escapeHtml(question.statement)}<br /><span class="dim" style="font-size:9.5px">${escapeHtml(node.numbering)} ${escapeHtml(node.title)}</span></td>
          <td class="num">${count(question.n)}</td>
          <td style="width:16%">${stackBar(totals)}</td>
          <td class="num">${tierShare(totals, 0)}</td>
          <td class="num">${tierShare(totals, 2)}</td>
          <td class="center">${scoreChip(question.score)}</td>
          <td class="center">${favorabilityChip(question.favorability)}</td>
        </tr>`;
        })
        .join("");

      if (!rows) return "";

      return `
      <div class="block">
        ${blockTitle(`${section.numbering}. ${section.title}`)}
        <table>
          <thead><tr>
            <th class="num">#</th>
            <th>Pregunta</th>
            <th class="num">Respuestas</th>
            <th>Distribución</th>
            <th class="num">Desfav.</th>
            <th class="num">Favor.</th>
            <th class="center">Puntaje</th>
            <th class="center">Favorabilidad</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    })
    .join("");

  if (!blocks) return null;

  return {
    title: "Detalle de preguntas",
    body: `${blocks}${tierLegend()}`,
  };
};

// --- 7 · eNPS -----------------------------------------------------------------------

const NPS_BANDS = [
  { id: "detractor", label: "Detractores", range: "0 a 6", color: "#ef4444", background: "#fee2e2" },
  { id: "passive", label: "Neutros", range: "7 a 8", color: "#facc15", background: "#fef9c3" },
  { id: "promoter", label: "Promotores", range: "9 a 10", color: "#22c55e", background: "#dcfce7" },
] as const;

/**
 * eNPS con la misma anatomía que la pestaña: puntaje, mezcla, y el desglose por
 * secciones y subsecciones antes que por grupo.
 *
 * El orden importa: el puntaje global no dice dónde actuar, y el corte por
 * demográfico sin el mapa por secciones deja al lector adivinando qué dimensión
 * está moviendo el número.
 */
export const npsBlock = (data: ReportData): ReportSection | null => {
  const { results, request } = data;
  const nps = results.nps;
  if (!nps) return null;

  const position = ((nps.score + 100) / 200) * 100;
  const mix = [
    { ...NPS_BANDS[0], value: nps.detractors },
    { ...NPS_BANDS[1], value: nps.passives },
    { ...NPS_BANDS[2], value: nps.promoters },
  ];

  const gauge = `
  <div class="gauge break-avoid">
    <div class="gauge-figure">
      <span class="gauge-score">${nps.score > 0 ? "+" : ""}${Math.round(nps.score)}</span>
      <span class="gauge-detail">eNPS sobre ${count(nps.n)} personas</span>
    </div>
    <div class="gauge-track">
      <div class="gauge-zones">
        <div style="width:50%;background:#fee2e2"></div>
        <div style="width:10%;background:#fef9c3"></div>
        <div style="width:40%;background:#dcfce7"></div>
      </div>
      <div class="gauge-marker" style="left:${Math.min(100, Math.max(0, position)).toFixed(1)}%">
        <span class="gauge-pin"></span>
      </div>
      <div class="gauge-ticks">
        <span style="left:0%">−100</span><span style="left:50%">0</span><span style="left:100%">+100</span>
      </div>
    </div>
  </div>
  <div class="nps-bands">
    ${mix
      .map(
        (band) => `
    <div class="nps-band" style="border-top-color:${band.color}">
      <span class="nps-band-share">${shareOf(band.value, nps.n)}%</span>
      <span class="nps-band-label">${band.label}</span>
      <span class="nps-band-detail">${count(band.value)} personas · ${band.range}</span>
    </div>`
      )
      .join("")}
  </div>`;

  // Por secciones y subsecciones.
  const detail = npsBySection(results, request.filters);
  const npsRow = (section: NpsSectionDetail, depth: number): string => `
    <tr${depth === 0 ? ' class="lvl0"' : ""}>
      <td style="${indent(depth)}">${escapeHtml(section.title)}</td>
      <td class="num">${count(section.n)}</td>
      <td class="num">${shareOf(section.detractors, section.n)}%</td>
      <td class="num">${shareOf(section.passives, section.n)}%</td>
      <td class="num">${shareOf(section.promoters, section.n)}%</td>
      <td class="center">${npsChip(section.score)}</td>
    </tr>`;
  const walkNps = (nodes: readonly NpsSectionDetail[], depth: number): string =>
    nodes.map((node) => npsRow(node, depth) + walkNps(node.children, depth + 1)).join("");

  const sectionTable = detail.length
    ? `
  <div class="block">
    ${blockTitle("eNPS por secciones y subsecciones")}
    <table>
      <thead><tr>
        <th>Sección / subsección</th>
        <th class="num">Respuestas</th>
        <th class="num">Detractores</th>
        <th class="num">Neutros</th>
        <th class="num">Promotores</th>
        <th class="center">eNPS</th>
      </tr></thead>
      <tbody>${walkNps(detail, 0)}</tbody>
    </table>
  </div>`
    : "";

  // Por cada demográfico elegido.
  const segmentTables = chosenSegments(data, "nps")
    .map((segment) => {
      const grid = npsBySegmentData(results, segment, request.filters);
      if (grid.columns.length === 0) return "";
      // El total se toma de la misma agregación que las filas — no del eNPS
      // global — porque estas tablas cuentan respuestas y el medidor cuenta
      // personas. Mezclarlos pondría 438 al pie de una columna que suma 4.380.
      const total = grid.totalRow.total;
      const rows = grid.columns
        .map((column: SegmentOption, index: number) => {
          const cell = grid.totalRow.cells[index];
          if (!cell || cell.belowThreshold) {
            return `
          <tr>
            <td>${escapeHtml(column.label)}</td>
            <td class="num">${cell ? count(cell.n) : "—"}</td>
            <td class="dim" colspan="4" style="text-align:center;font-style:italic">Reservado · menos de ${results.threshold} respuestas</td>
          </tr>`;
          }
          return `
        <tr>
          <td>${escapeHtml(column.label)}</td>
          <td class="num">${count(cell.n)}</td>
          <td class="num">${shareOf(cell.detractors, cell.n)}%</td>
          <td class="num">${shareOf(cell.passives, cell.n)}%</td>
          <td class="num">${shareOf(cell.promoters, cell.n)}%</td>
          <td class="center">${npsChip(cell.score)}</td>
        </tr>`;
        })
        .join("");

      return `
      <div class="block">
        ${blockTitle(`eNPS por ${segment.label.toLowerCase()}`)}
        <table>
          <thead><tr>
            <th>${escapeHtml(segment.label)}</th>
            <th class="num">Respuestas</th>
            <th class="num">Detractores</th>
            <th class="num">Neutros</th>
            <th class="num">Promotores</th>
            <th class="center">eNPS</th>
          </tr></thead>
          <tbody>
            ${rows}
            <tr class="total-row">
              <td>Total general</td>
              <td class="num">${count(total.n)}</td>
              <td class="num">${shareOf(total.detractors, total.n)}%</td>
              <td class="num">${shareOf(total.passives, total.n)}%</td>
              <td class="num">${shareOf(total.promoters, total.n)}%</td>
              <td class="center">${npsChip(total.score)}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    })
    .join("");

  return {
    title: "eNPS",
    body: `${gauge}${sectionTable}${segmentTables}`,
  };
};

// --- 8 · Brechas --------------------------------------------------------------------

/**
 * Dónde se separan los grupos, para cada demográfico elegido.
 *
 * Una brecha solo es accionable si el lector puede nombrar el grupo, así que el
 * bloque nombra el peor y la pregunta que más los separa — no un índice de
 * dispersión que nadie sabe traducir a una conversación.
 */
export const gapsBlock = (data: ReportData): ReportSection | null => {
  const { results, request } = data;
  const segments = chosenSegments(data, "gaps");
  if (segments.length === 0) return null;

  const blocks = segments
    .map((segment: SegmentDefinition) => {
      const gaps = analyseSegmentGaps(segment, results, request.filters);
      if (!gaps) return "";

      const widest = gaps.widest
        ? `<div class="callout">Mayor polarización: <strong>${escapeHtml(gaps.widest.rowLabel)}</strong> va de ${formatScore(gaps.widest.min)} en ${escapeHtml(gaps.widest.minLabel)} a ${formatScore(gaps.widest.max)} en ${escapeHtml(gaps.widest.maxLabel)} — ${formatScore(gaps.widest.spread)} puntos de diferencia.</div>`
        : "";

      const outliers = gaps.outliers
        .map(
          ({ row, gap }) => `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          <td class="num">${count(row.completed)}</td>
          <td class="num">${gap.toFixed(1).replace(".", ",")}</td>
          <td class="num">${formatPercent(row.participation)}</td>
          <td class="center">${scoreChip(row.score)}</td>
        </tr>`
        )
        .join("");

      return `
      <div class="block">
        ${blockTitle(`Brechas por ${segment.label.toLowerCase()}`)}
        ${widest}
        ${
          outliers
            ? `<table style="margin-top:10px">
          <thead><tr>
            <th>Grupo rezagado</th>
            <th class="num">Respuestas</th>
            <th class="num">Diferencia</th>
            <th class="num">Participación</th>
            <th class="center">Puntaje</th>
          </tr></thead>
          <tbody>${outliers}</tbody>
        </table>
        <p class="note">Diferencia contra el promedio de ${formatScore(gaps.average)} de este demográfico.</p>`
            : `<p class="note">Ningún grupo cae por debajo del promedio de ${formatScore(gaps.average)} lo suficiente para reportarlo.</p>`
        }
      </div>`;
    })
    .join("");

  if (!blocks) return null;

  return { title: "Brechas entre grupos", body: blocks };
};

// --- 9 · Análisis IA ----------------------------------------------------------------

const INSIGHT_COPY: Readonly<Record<InsightKind, { label: string; variant: string }>> = {
  finding: { label: "Hallazgo", variant: "neutral" },
  risk: { label: "Riesgo", variant: "negative" },
  recommendation: { label: "Recomendación", variant: "positive" },
};

const CONFIDENCE_COPY: Readonly<Record<"low" | "medium" | "high", string>> = {
  low: "Confiabilidad baja",
  medium: "Confiabilidad media",
  high: "Confiabilidad alta",
};

/**
 * La lectura de la IA, cada afirmación con la cifra en la que se apoya.
 *
 * Cierra el documento a propósito: leerla antes de las tablas la convierte en la
 * conclusión en vez de en una hipótesis, y cada afirmación viaja con su
 * evidencia justamente para que el lector pueda contradecirla con la página
 * anterior.
 */
export const aiBlock = ({ results, sections }: ReportData): ReportSection | null => {
  const analysis = buildSurveyAnalysis({ ...results, sections });
  if (!analysis.insights.length) return null;

  const cards = analysis.insights
    .map(
      (insight) => `
    <div class="ai-card">
      <div class="ai-head">
        ${verdictChip(INSIGHT_COPY[insight.kind].label, INSIGHT_COPY[insight.kind].variant)}
        <span class="ai-title">${escapeHtml(insight.title)}</span>
        <span class="dim" style="font-size:9.5px">${CONFIDENCE_COPY[insight.confidence]}</span>
      </div>
      <p class="ai-body">${escapeHtml(insight.body)}</p>
      <p class="ai-evidence">Evidencia: ${escapeHtml(insight.evidence)}</p>
    </div>`
    )
    .join("");

  return {
    title: "Análisis de IA",
    body: `
    <div class="ai-summary">${escapeHtml(analysis.summary)}</div>
    ${cards}
    <p class="note">Lectura generada a partir de los resultados de esta medición. Cada afirmación cita la cifra que la sostiene para que pueda verificarse contra las secciones anteriores.</p>`,
  };
};
