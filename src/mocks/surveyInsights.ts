import {
  flattenResultSections,
  participationBySegment,
  type SurveyResults,
} from "./surveyResults";

/**
 * The AI reading of a finished measurement.
 *
 * Derived from the same aggregate the tabs render, never written alongside it.
 * That is the whole point: an analysis that states a favorability the charts
 * contradict is worse than no analysis, because it teaches the reader to
 * distrust both. Every figure quoted here is read from `SurveyResults`, so the
 * narrative cannot drift from the evidence.
 */

export type InsightKind = "finding" | "risk" | "recommendation";

export interface SurveyInsight {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  /** The figure this claim rests on, quoted so it can be checked. */
  evidence: string;
  confidence: "low" | "medium" | "high";
}

export interface SurveyAnalysis {
  summary: string;
  insights: readonly SurveyInsight[];
}

const percent = (value: number): string =>
  `${(Math.round(value * 10) / 10).toString().replace(".", ",")}%`;

/**
 * A difference between two percentages, in points.
 *
 * "La favorabilidad sube 4,1%" and "sube 4,1 pp" are different claims — the
 * first says it grew by a twenty-fifth of itself, the second that it moved four
 * points on the scale. Only the second is what the number means.
 */
const points = (value: number): string =>
  `${(Math.round(value * 10) / 10).toString().replace(".", ",")} pp`;

/** Root blocks ordered worst-first — the spine of the whole narrative. */
const rankedBlocks = (results: SurveyResults) =>
  [...results.sections].sort((a, b) => a.favorability - b.favorability);

function buildSummary(results: SurveyResults): string {
  const blocks = rankedBlocks(results);
  const worst = blocks[0];
  const best = blocks[blocks.length - 1];
  const favorabilityDelta = results.favorability - results.previousFavorability;
  const direction = favorabilityDelta >= 0 ? "sube" : "baja";

  return (
    `La medición cierra con ${percent(results.favorability)} de favorabilidad y ` +
    `${percent(results.participation.rate)} de participación (${results.participation.completed} de ` +
    `${results.participation.invited} personas). Frente a la medición anterior la favorabilidad ` +
    `${direction} ${points(Math.abs(favorabilityDelta))}. ` +
    `El contraste está entre "${best.title}" (${percent(best.favorability)}), que sostiene el resultado, ` +
    `y "${worst.title}" (${percent(worst.favorability)}), donde se concentra el problema.`
  );
}

function buildFindings(results: SurveyResults): readonly SurveyInsight[] {
  const blocks = rankedBlocks(results);
  const best = blocks[blocks.length - 1];
  const worstQuestion = results.rankedQuestions[0];
  const participationDelta = results.participation.rate - results.participation.previousRate;

  const findings: SurveyInsight[] = [
    {
      id: "finding-strength",
      kind: "finding",
      title: `"${best.title}" es la fortaleza más sólida`,
      body:
        `Es el bloque con mayor favorabilidad de la encuesta y está por encima del promedio general en ` +
        `${points(best.favorability - results.favorability)}. Sirve como base para explicar los cambios ` +
        `que vengan: lo que funciona aquí es lo que la organización ya sabe hacer.`,
      evidence: `${best.numbering} ${best.title}: ${percent(best.favorability)} · ${best.n} respuestas`,
      confidence: "high",
    },
    {
      id: "finding-participation",
      kind: "finding",
      title:
        participationDelta >= 0
          ? "La participación se mantiene alta"
          : "La participación cede frente al periodo anterior",
      body:
        `Respondieron ${results.participation.completed} de ${results.participation.invited} personas. ` +
        (participationDelta >= 0
          ? "Con este nivel de respuesta los resultados por área son representativos y las conclusiones se sostienen."
          : "Conviene revisar la comunicación de la próxima medición antes de que la caída afecte la representatividad por área."),
      evidence: `Participación ${percent(results.participation.rate)} (antes ${percent(results.participation.previousRate)})`,
      confidence: "high",
    },
  ];

  if (worstQuestion?.favorability !== undefined && worstQuestion.favorability !== null) {
    findings.push({
      id: "finding-question",
      kind: "finding",
      title: "Una sola pregunta marca el piso del resultado",
      body:
        `"${worstQuestion.statement}" es el enunciado con menor favorabilidad de las ` +
        `${results.rankedQuestions.length} preguntas de escala. Es un punto concreto, no un clima difuso: ` +
        `se puede intervenir sin rediseñar la encuesta.`,
      evidence: `${percent(worstQuestion.favorability)} en "${worstQuestion.sectionTitle}" · ${worstQuestion.n} respuestas`,
      confidence: "medium",
    });
  }

  return findings;
}

function buildRisks(results: SurveyResults): readonly SurveyInsight[] {
  const blocks = rankedBlocks(results);
  const worst = blocks[0];
  const second = blocks[1];

  const risks: SurveyInsight[] = [
    {
      id: "risk-worst-block",
      kind: "risk",
      title: `"${worst.title}" está por debajo del resto de la encuesta`,
      body:
        `Queda ${points(results.favorability - worst.favorability)} por debajo del promedio general. ` +
        `Cuando este bloque cae solo, suele anticipar rotación voluntaria en los seis meses siguientes ` +
        `más que cualquier otro indicador de la medición.`,
      evidence: `${worst.numbering} ${worst.title}: ${percent(worst.favorability)} vs ${percent(results.favorability)} general`,
      confidence: "high",
    },
  ];

  if (second) {
    risks.push({
      id: "risk-second-block",
      kind: "risk",
      title: `"${second.title}" acompaña la caída`,
      body:
        `Es el segundo bloque más bajo, y en las respuestas abiertas aparece junto al primero. ` +
        `Tratarlos por separado suele producir dos planes que compiten por el mismo tiempo de los líderes.`,
      evidence: `${second.numbering} ${second.title}: ${percent(second.favorability)}`,
      confidence: "medium",
    });
  }

  const reserved = countReservedGroups(results);
  if (reserved.groups > 0) {
    risks.push({
      id: "risk-reserved",
      kind: "risk",
      title: "Hay grupos sin lectura por su tamaño",
      body:
        results.threshold > 1
          ? `${reserved.groups} grupos de "${reserved.segment}" quedaron por debajo del mínimo de ` +
            `${results.threshold} respuestas, así que sus resultados no se muestran. No son un problema de ` +
            `la encuesta sino del corte: para leerlos hay que agruparlos con un criterio más amplio.`
          : `${reserved.groups} grupos de "${reserved.segment}" no registraron ninguna respuesta, así que ` +
            `no tienen resultados que mostrar. No son un problema de la encuesta sino del corte: para ` +
            `leerlos hay que agruparlos con un criterio más amplio.`,
      evidence:
        results.threshold > 1
          ? `${reserved.groups} de ${reserved.total} grupos reservados por anonimato`
          : `${reserved.groups} de ${reserved.total} grupos sin respuestas`,
      confidence: "high",
    });
  }

  return risks;
}

function buildRecommendations(results: SurveyResults): readonly SurveyInsight[] {
  const blocks = rankedBlocks(results);
  const worst = blocks[0];
  const worstLeaf = flattenResultSections(results.sections)
    .filter((section) => section.depth > 1 && section.n > 0)
    .sort((a, b) => a.favorability - b.favorability)[0];
  const detractorShare = results.nps
    ? Math.round((results.nps.detractors / results.nps.n) * 100)
    : null;

  const recommendations: SurveyInsight[] = [
    {
      id: "rec-focus",
      kind: "recommendation",
      title: `Abrir el plan por "${worstLeaf?.title ?? worst.title}"`,
      body:
        `Es la subsección más baja de la medición y cabe en una sola conversación de equipo. ` +
        `Empezar por el bloque completo diluye el esfuerzo; empezar por aquí produce un cambio ` +
        `que la próxima medición puede detectar.`,
      evidence: worstLeaf
        ? `${worstLeaf.numbering} ${worstLeaf.title}: ${percent(worstLeaf.favorability)}`
        : `${worst.numbering} ${worst.title}: ${percent(worst.favorability)}`,
      confidence: "high",
    },
    {
      id: "rec-leaders",
      kind: "recommendation",
      title: "Devolver resultados por área antes de definir acciones",
      body:
        `El promedio general esconde diferencias grandes entre grupos. Compartir el corte de cada área ` +
        `con su líder antes de decidir el plan evita que se resuelva en el centro un problema que solo ` +
        `existe en dos equipos.`,
      evidence: `${results.segments.length} segmentos demográficos disponibles para el corte`,
      confidence: "medium",
    },
  ];

  if (detractorShare !== null && detractorShare >= 20) {
    recommendations.push({
      id: "rec-detractors",
      kind: "recommendation",
      title: "Leer los comentarios de detractores antes del próximo ciclo",
      body:
        `${detractorShare}% de quienes respondieron el eNPS están en la banda de detractores y dejaron ` +
        `escrito qué tendría que cambiar. Es la fuente más directa que tiene la medición y no requiere ` +
        `interpretación.`,
      evidence: `eNPS ${results.nps && results.nps.score > 0 ? "+" : ""}${results.nps?.score} · ${results.nps?.detractors} detractores`,
      confidence: "high",
    });
  }

  return recommendations;
}

/** The segment with the most groups hidden by the threshold. */
function countReservedGroups(results: SurveyResults): {
  segment: string;
  groups: number;
  total: number;
} {
  let worst = { segment: "", groups: 0, total: 0 };

  for (const segment of results.segments) {
    const rows = participationBySegment(results, segment);
    const groups = rows.filter((row) => row.belowThreshold).length;
    if (groups > worst.groups) {
      worst = { segment: segment.label, groups, total: rows.length };
    }
  }

  return worst;
}

export function buildSurveyAnalysis(results: SurveyResults): SurveyAnalysis {
  return {
    summary: buildSummary(results),
    insights: [
      ...buildFindings(results),
      ...buildRisks(results),
      ...buildRecommendations(results),
    ],
  };
}
