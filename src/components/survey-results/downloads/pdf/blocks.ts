import {
  participationBySegment,
  type SectionResult,
} from "@/mocks/surveyResults";
import { NSNR, POSITIVE, YELLOW, formatPercent } from "../../favorabilityScale";
import { chosenSegments, type ReportData, type ReportSection } from "./tokens";
import {
  blockTitle,
  coverageChart,
  count,
  escapeHtml,
  favorabilityChip,
  favorabilityVerdictStrip,
  indent,
  scoreChip,
  sectionTierTotals,
  shareOf,
  stackBar,
  tierLegend,
  tierShare,
  verdictChip,
  type TierTotals,
} from "./primitives";

// --- 1 · Verificación de la medición ----------------------------------------------

/**
 * Las cifras que dicen si la medición se sostiene, y nada más.
 *
 * Sin párrafo de conclusión: una frase generada que nombra "las dimensiones peor
 * evaluadas" compite con las tablas que dicen lo mismo con la cifra al lado, y
 * cuando las dos lecturas se separan aunque sea un poco, el lector cree la prosa
 * y desconfía del dato.
 */
export const verificationBlock = ({
  results,
  favorability,
  metrics,
  participation,
}: ReportData): ReportSection => {
  const nps = results.nps;
  const kpi = (label: string, value: string, detail: string) => `
    <div class="kpi">
      <span class="kpi-label">${escapeHtml(label)}</span>
      <span class="kpi-value">${value}</span>
      <span class="kpi-detail">${escapeHtml(detail)}</span>
    </div>`;

  return {
    title: "Verificación de la medición",
    keepTogether: true,
    body: `
    <div class="kpi-row">
      ${kpi(
        "Favorabilidad",
        formatPercent(favorability),
        `${count(metrics.scoredQuestions)} preguntas de escala`
      )}
      ${kpi(
        "Participación",
        formatPercent(participation.rate),
        `${count(participation.completed)} de ${count(participation.invited)} personas`
      )}
      ${
        nps
          ? kpi(
              "eNPS",
              `${nps.score > 0 ? "+" : ""}${Math.round(nps.score)}`,
              `${shareOf(nps.promoters, nps.n)}% promotores · ${shareOf(nps.detractors, nps.n)}% detractores`
            )
          : kpi("eNPS", "—", "Esta encuesta no incluyó pregunta de recomendabilidad")
      }
      ${kpi(
        "Respuestas registradas",
        count(metrics.scaleAnswers),
        "Respuestas sobre preguntas de escala 1 a 5"
      )}
    </div>`,
  };
};

// --- 2 · Participación --------------------------------------------------------------

/**
 * La cobertura general y, si el lector lo pidió, grupo por grupo.
 *
 * El desglose es configurable porque no todo comité lee la misma unidad: el de
 * gente mira áreas, el de operación mira sedes. Sin demográficos elegidos el
 * bloque sigue valiendo — la tasa global es la que habilita o descarta toda
 * lectura posterior.
 */
export const participationBlock = (data: ReportData): ReportSection => {
  const { results, request, participation } = data;
  const rate = participation.rate;
  const verdict =
    rate >= 80
      ? { label: "Alta participación", variant: "positive" }
      : rate >= 60
        ? { label: "Participación media", variant: "warning" }
        : { label: "Participación baja", variant: "negative" };

  const notStarted = Math.max(
    0,
    participation.invited - participation.completed - participation.inProgress
  );
  const total = Math.max(1, participation.invited);
  const mix = [
    { label: "Completaron", value: participation.completed, color: POSITIVE },
    { label: "En curso", value: participation.inProgress, color: YELLOW },
    { label: "Sin abrir", value: notStarted, color: NSNR },
  ];

  const breakdowns = chosenSegments(data, "participation")
    .map((segment) => {
      const rows = participationBySegment(results, segment, request.filters);
      if (rows.length === 0) return "";

      // Sin fila de total: los invitados de los grupos reconstituyen el censo,
      // pero sus respuestas no suman exactamente la cifra global de la medición.
      // Imprimir un total a pie de tabla pondría dos números de respuestas a
      // tres centímetros uno del otro, y el lector no tiene cómo saber cuál
      // creer. La cifra que manda ya está arriba, en la barra de mezcla.
      return `
      <div class="block">
        ${blockTitle(`Cobertura por ${segment.label.toLowerCase()}`)}
        ${coverageChart(
          rows.map((row) => ({
            label: row.label,
            value: row.completed,
            total: Math.max(1, row.invited),
            detail: `${count(row.completed)} / ${count(row.invited)} (${formatPercent(row.rate)})`,
          }))
        )}
        <table>
          <thead><tr>
            <th>${escapeHtml(segment.label)}</th>
            <th class="num">Invitados</th>
            <th class="num">Respuestas</th>
            <th class="num">En curso</th>
            <th class="num">Participación</th>
          </tr></thead>
          <tbody>
            ${rows
              .map(
                (row) => `
            <tr>
              <td>${escapeHtml(row.label)}</td>
              <td class="num">${count(row.invited)}</td>
              <td class="num">${count(row.completed)}</td>
              <td class="num">${count(row.inProgress)}</td>
              <td class="num">${formatPercent(row.rate)}</td>
            </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
    })
    .join("");

  return {
    title: "Participación",
    body: `
    <div class="scale">
      <span class="scale-title">Escala de lectura de la tasa de respuesta</span>
      <span class="legend-item"><span class="dot" style="background:#dcfce7;border-color:#86efac"></span>Alta <em>80% o más</em></span>
      <span class="legend-item"><span class="dot" style="background:#fef9c3;border-color:#fde047"></span>Media <em>60% a 79%</em></span>
      <span class="legend-item"><span class="dot" style="background:#fee2e2;border-color:#fca5a5"></span>Baja <em>menos de 60%</em></span>
      ${verdictChip(`${formatPercent(rate)} · ${verdict.label}`, verdict.variant)}
    </div>
    <div class="break-avoid">
      <div class="bar bar-lg">${mix
        .filter((entry) => entry.value > 0)
        .map(
          (entry) =>
            `<div style="width:${((entry.value / total) * 100).toFixed(2)}%;background:${entry.color}"></div>`
        )
        .join("")}</div>
      <div class="nps-legend" style="margin-top:6px">${mix
        .map(
          (entry) =>
            `<span><span class="dot" style="background:${entry.color}"></span>${entry.label} ${count(entry.value)} · ${shareOf(entry.value, total)}%</span>`
        )
        .join("")}</div>
    </div>
    ${breakdowns}`,
  };
};

// --- 3 · Favorabilidad por secciones ------------------------------------------------

/**
 * El mapa completo: cada sección y cada subsección con su mezcla y su porcentaje.
 *
 * No es configurable a propósito — es la lectura general de la encuesta, la
 * misma para todo lector, y es contra ella que se leen los cortes por
 * demográfico que vienen después. Se abren todas las subsecciones: el árbol es
 * el constructo que escribió el autor y recortarlo deja al lector sin el mapa.
 */
export const sectionsBlock = ({ sections, favorability }: ReportData): ReportSection => {
  const row = (section: SectionResult, depth: number): string => {
    const totals: TierTotals = sectionTierTotals(section);
    const hasScale = section.n > 0 && totals.reduce((a, b) => a + b, 0) > 0;
    return `
    <tr${depth === 0 ? ' class="lvl0"' : ""}>
      <td style="${indent(depth)}"><span class="dim">${escapeHtml(section.numbering)}</span> ${escapeHtml(section.title)}</td>
      <td class="num">${count(section.n)}</td>
      <td style="width:16%">${stackBar(totals)}</td>
      <td class="num">${hasScale ? tierShare(totals, 0) : "—"}</td>
      <td class="num">${hasScale ? tierShare(totals, 1) : "—"}</td>
      <td class="num">${hasScale ? tierShare(totals, 2) : "—"}</td>
      <td class="center">${scoreChip(hasScale ? section.score : null)}</td>
      <td class="center">${favorabilityChip(hasScale ? section.favorability : null)}</td>
    </tr>`;
  };

  const walk = (nodes: readonly SectionResult[], depth: number): string =>
    nodes.map((node) => row(node, depth) + walk(node.children, depth + 1)).join("");

  return {
    title: "Favorabilidad por secciones",
    body: `
    ${favorabilityVerdictStrip(favorability)}
    <table>
      <thead><tr>
        <th>Sección / subsección</th>
        <th class="num">Respuestas</th>
        <th>Distribución</th>
        <th class="num">Desfav.</th>
        <th class="num">Neutral</th>
        <th class="num">Favor.</th>
        <th class="center">Puntaje</th>
        <th class="center">Favorabilidad</th>
      </tr></thead>
      <tbody>${walk(sections, 0)}</tbody>
    </table>
    ${tierLegend()}`,
  };
};

