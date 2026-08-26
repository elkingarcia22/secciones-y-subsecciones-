import type { SurveyDraft } from "@/components/survey-builder";
import { SURVEY_KIND_LABELS } from "@/components/survey-builder";
import {
  flattenResultSections,
  heatmapBySegment,
  npsBySection,
  npsBySegmentData,
  participationBySegment,
  sectionResultsForFilters,
  type NpsBand,
  type NpsSectionDetail,
  type NpsSegmentRow,
  type SegmentDefinition,
  type SegmentFilter,
  type SurveyResults,
} from "@/mocks/surveyResults";
import {
  buildAnswerMatrix,
  buildOpenComments,
  buildQuestionBreakdowns,
  buildRespondentAnswers,
  buildRespondents,
  type QuestionBreakdown,
  type Respondent,
  type RespondentAnswer,
  type Sentiment,
} from "@/mocks/questionResponses";
import { buildSurveyAnalysis, type InsightKind } from "@/mocks/surveyInsights";
import {
  NPS_BAND_LABELS,
  flattenNpsDepth,
  npsDepthBySection,
  npsDepthTotals,
} from "@/mocks/npsDepth";
import {
  FINDING_LEVELS,
  SCOPE_ALL,
  analyseSegmentGaps,
  buildPriorities,
  buildStrengths,
  commentMatchesFilters,
  defaultFindingLevel,
  findingsAtLevel,
  resolveScope,
  scopedMetrics,
  scopedQuestionIds,
  sentimentRollup,
  summaryVerdict,
  type Priority,
} from "../summaryModel";
import type { ReportRequest, XlsxSheetId } from "./downloadTypes";

/**
 * Workbook builders for the download center.
 *
 * Every non-PDF report is a styled SpreadsheetML workbook (Excel 2003 XML):
 * multi-sheet, no dependency, and Excel, Numbers and Sheets all open it. The
 * styling matters as much as the data — a report lands on someone's desk as a
 * spreadsheet, and an unstyled wall of cells reads as a data dump, not a
 * deliverable. So the sheets carry the product's own vocabulary: brand-blue
 * headers, the five favorability bands as cell fills, sentiment colors on
 * comments, sized columns and zebra rows.
 *
 * Everything is pure string assembly from the same aggregate the screen
 * renders — the files must say exactly what the report says, or the first
 * person who cross-checks a cell concludes one of the two is lying.
 */

export const fileStamp = (): string => new Date().toISOString().slice(0, 10);

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

export function saveBlob(fileName: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// --- SpreadsheetML core -----------------------------------------------------

/**
 * The style palette every sheet draws from. Hex twins of the app's own hsl
 * band tokens — SpreadsheetML only speaks hex, so the scale is re-stated here
 * at the same hues rather than imported.
 */
const STYLE_XML = `
<Styles>
  <Style ss:ID="Default" ss:Name="Normal">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#1A1F2E"/>
    <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="title"><Font ss:FontName="Calibri" ss:Size="15" ss:Bold="1" ss:Color="#0C5BEF"/></Style>
  <Style ss:ID="hint"><Font ss:FontName="Calibri" ss:Size="9" ss:Color="#6B7280"/></Style>
  <Style ss:ID="head">
    <Font ss:FontName="Calibri" ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/>
    <Interior ss:Color="#0C5BEF" ss:Pattern="Solid"/>
    <Alignment ss:Vertical="Center" ss:WrapText="1"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0A47B8"/></Borders>
  </Style>
  <Style ss:ID="label">
    <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#1A1F2E"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EDF0F4"/></Borders>
  </Style>
  <Style ss:ID="cell">
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EDF0F4"/></Borders>
  </Style>
  <Style ss:ID="alt">
    <Interior ss:Color="#F4F7FB" ss:Pattern="Solid"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E4E9F0"/></Borders>
  </Style>
  <Style ss:ID="wrap">
    <Alignment ss:Vertical="Top" ss:WrapText="1"/>
    <Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EDF0F4"/></Borders>
  </Style>
  <Style ss:ID="b1"><Font ss:Bold="1" ss:Size="10" ss:Color="#B02A37"/><Interior ss:Color="#F6C6CB" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="b2"><Font ss:Bold="1" ss:Size="10" ss:Color="#D9535F"/><Interior ss:Color="#FBE3E5" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="b3"><Font ss:Bold="1" ss:Size="10" ss:Color="#8F6400"/><Interior ss:Color="#FBF2C4" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="b4"><Font ss:Bold="1" ss:Size="10" ss:Color="#3E8E41"/><Interior ss:Color="#E1F2DD" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="b5"><Font ss:Bold="1" ss:Size="10" ss:Color="#2C6B2F"/><Interior ss:Color="#BFE6C3" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="bx"><Font ss:Size="9" ss:Color="#5A6472"/><Interior ss:Color="#E9ECEF" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="pos"><Font ss:Bold="1" ss:Size="9" ss:Color="#15803D"/><Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="neu"><Font ss:Bold="1" ss:Size="9" ss:Color="#A16207"/><Interior ss:Color="#FEF9C3" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
  <Style ss:ID="neg"><Font ss:Bold="1" ss:Size="9" ss:Color="#B91C1C"/><Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center" ss:Vertical="Center"/></Style>
</Styles>`;

type StyleId =
  | "title" | "hint" | "head" | "label" | "cell" | "alt" | "wrap"
  | "b1" | "b2" | "b3" | "b4" | "b5" | "bx"
  | "pos" | "neu" | "neg";

interface XmlCell {
  value: string | number | null;
  style?: StyleId;
}

interface RowSpec {
  cells: readonly XmlCell[];
  height?: number;
  autoFitHeight?: boolean;
}

interface SheetSpec {
  name: string;
  /** Column widths in points, left to right. Missing entries autofit. */
  columns?: readonly number[];
  rows: readonly RowSpec[];
}

const xmlEscape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cellXml = (cell: XmlCell): string => {
  const style = cell.style ? ` ss:StyleID="${cell.style}"` : "";
  if (cell.value === null || cell.value === "") return `<Cell${style}/>`;
  const type = typeof cell.value === "number" ? "Number" : "String";
  const data = typeof cell.value === "number" ? String(cell.value) : xmlEscape(cell.value);
  return `<Cell${style}><Data ss:Type="${type}">${data}</Data></Cell>`;
};

const rowXml = (row: RowSpec): string => {
  const height = row.height ? ` ss:Height="${row.height}"` : "";
  const autoFit = row.autoFitHeight ? ' ss:AutoFitHeight="1"' : "";
  return `<Row${height}${autoFit}>${row.cells.map(cellXml).join("")}</Row>`;
};

const sheetXml = ({ name, columns = [], rows }: SheetSpec): string => {
  const safeName = xmlEscape(name.slice(0, 31));
  const cols = columns
    .map((width) => `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`)
    .join("");
  return `<Worksheet ss:Name="${safeName}"><Table>${cols}${rows.map(rowXml).join("")}</Table></Worksheet>`;
};

const workbook = (sheets: readonly SheetSpec[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>` +
  `<?mso-application progid="Excel.Sheet"?>` +
  `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"` +
  ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
  STYLE_XML +
  sheets.map(sheetXml).join("") +
  `</Workbook>`;

// --- Row helpers ---------------------------------------------------------------

const titleRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: "title" }],
  height: 24,
});

const hintRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: "hint" }],
  height: 14,
});

const blankRow: RowSpec = { cells: [] };

const headRow = (labels: readonly string[]): RowSpec => ({
  cells: labels.map((value) => ({ value, style: "head" as const })),
  height: 26,
});

/** A data row: zebra base per index, per-cell styles win over the base. */
const dataRow = (
  index: number,
  cells: readonly { value: string | number | null; style?: StyleId }[],
  options?: { autoFitHeight?: boolean }
): RowSpec => ({
  cells: cells.map((cell) => ({
    value: cell.value,
    style: cell.style ?? (index % 2 === 1 ? "alt" : "cell"),
  })),
  height: options?.autoFitHeight ? undefined : 18,
  autoFitHeight: options?.autoFitHeight,
});

/** The band style a 1–5 score falls into — same cuts as `FAVORABILITY_BANDS`. */
const bandStyle = (score: number | null): StyleId => {
  if (score === null) return "bx";
  if (score <= 1.9) return "b1";
  if (score <= 2.9) return "b2";
  if (score <= 3.9) return "b3";
  if (score <= 4.9) return "b4";
  return "b5";
};

// --- Shared context ----------------------------------------------------------------

const filterLabelFor = (
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): string => {
  if (filters.length === 0) return "Toda la empresa";
  const segment = results.segments.find((candidate) => candidate.key === filters[0].key);
  const labels = filters
    .map((filter) => segment?.options.find((candidate) => candidate.id === filter.optionId)?.label)
    .filter((label): label is string => Boolean(label));
  return segment && labels.length > 0 ? `${segment.label}: ${labels.join(", ")}` : "Toda la empresa";
};

/** The "title + context + blank" block every sheet opens with. */
const sheetIntro = (
  title: string,
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[],
  extra?: string
): RowSpec[] => [
  titleRow(title),
  hintRow(
    [
      draft.name,
      `Generado el ${new Date().toLocaleDateString("es-CO")}`,
      `Población: ${filterLabelFor(results, filters)}`,
      ...(extra ? [extra] : []),
    ].join("  ·  ")
  ),
  blankRow,
];

interface FlatQuestion {
  sectionNumbering: string;
  sectionTitle: string;
  id: string;
  statement: string;
  scored: boolean;
  n: number;
  nsnr: number;
  score: number | null;
  favorability: number | null;
  distribution: readonly number[] | null;
}

const flattenQuestions = (
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): FlatQuestion[] => {
  const sections = sectionResultsForFilters(results, filters);
  return flattenResultSections(sections).flatMap((section) =>
    section.questions.map((question) => ({
      sectionNumbering: section.numbering,
      sectionTitle: section.title,
      ...question,
    }))
  );
};

const questionSheet = (
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): Pick<SheetSpec, "columns" | "rows"> => {
  const rows = flattenQuestions(results, filters).map((question, index) =>
    dataRow(index, [
      { value: `${question.sectionNumbering} ${question.sectionTitle}` },
      { value: question.statement },
      { value: question.n },
      { value: question.nsnr },
      { value: question.score, style: question.scored ? bandStyle(question.score) : "bx" },
      { value: question.favorability },
      ...(question.distribution ?? [null, null, null, null, null]).map((count) => ({ value: count })),
    ])
  );
  return {
    columns: [190, 380, 70, 55, 80, 100, 95, 85, 60, 70, 90],
    rows: [
      headRow([
        "Sección",
        "Pregunta",
        "Respuestas",
        "NS/NR",
        "Puntaje (1-5)",
        "Favorabilidad (%)",
        "Muy desfavorable",
        "Desfavorable",
        "Neutral",
        "Favorable",
        "Muy favorable",
      ]),
      ...rows,
    ],
  };
};

/** The eNPS reading of a −100..100 result — same cuts as `NPS_SCORE_BANDS`. */
const npsScoreStyle = (score: number | null): StyleId => {
  if (score === null) return "bx";
  if (score >= 20) return "pos";
  if (score >= 0) return "neu";
  return "neg";
};

/** A part of `n` as a one-decimal percentage, or null when there is no base. */
const share = (part: number, n: number): number | null =>
  n > 0 ? Math.round((part / n) * 1000) / 10 : null;

const NPS_HEAD = [
  "Dimensión / pregunta",
  "Nivel",
  "eNPS",
  "Promotores",
  "Pasivos",
  "Detractores",
  "% Promotores",
  "% Detractores",
  "Respuestas",
] as const;

const NPS_COLUMNS = [330, 70, 60, 80, 70, 80, 90, 90, 80] as const;

/** The eNPS outline flattened: every dimension followed by its own questions. */
const npsDetailRows = (details: readonly NpsSectionDetail[]): RowSpec[] => {
  const rows: RowSpec[] = [];

  const push = (
    label: string,
    depth: number,
    level: "Sección" | "Pregunta",
    data: { score: number; promoters: number; passives: number; detractors: number; n: number }
  ) => {
    rows.push(
      dataRow(rows.length, [
        {
          value: `${"    ".repeat(depth)}${label}`,
          style: level === "Sección" && depth === 0 ? "label" : undefined,
        },
        { value: level },
        { value: data.score, style: npsScoreStyle(data.score) },
        { value: data.promoters },
        { value: data.passives },
        { value: data.detractors },
        { value: share(data.promoters, data.n) },
        { value: share(data.detractors, data.n) },
        { value: data.n },
      ])
    );
  };

  const walk = (sections: readonly NpsSectionDetail[]) => {
    for (const section of sections) {
      push(`${section.numbering} ${section.title}`, section.depth, "Sección", section);
      for (const question of section.questions) {
        push(question.text, section.depth + 1, "Pregunta", question);
      }
      walk(section.children);
    }
  };

  walk(details);
  return rows;
};

/** The eNPS grid flattened: total, then every dimension and its questions. */
const npsSegmentRows = (rows: readonly NpsSegmentRow[], depth: number): RowSpec[] => {
  const flat: RowSpec[] = [];

  const cellsOf = (row: NpsSegmentRow) =>
    row.cells.map((cell) =>
      cell === null || cell.belowThreshold
        ? { value: "Reservado" as const, style: "bx" as const }
        : { value: cell.score, style: npsScoreStyle(cell.score) }
    );

  const walk = (current: readonly NpsSegmentRow[], level: number) => {
    for (const row of current) {
      flat.push(
        dataRow(flat.length, [
          {
            value: `${"    ".repeat(level)}${row.title}`,
            style: row.kind !== "question" && level === 0 ? "label" : undefined,
          },
          {
            value: row.total.n > 0 ? row.total.score : null,
            style: row.total.n > 0 ? npsScoreStyle(row.total.score) : "bx",
          },
          ...cellsOf(row),
        ])
      );
      walk(row.questions ?? [], level + 1);
      walk(row.children ?? [], level + 1);
    }
  };

  walk(rows, depth);
  return flat;
};

/**
 * Detalle de preguntas: one row per answer option, every format included.
 *
 * The "Preguntas" sheet only speaks the 1–5 scale, so a single-choice or
 * multiple-answer question shows up there as an empty distribution. This is the
 * tally the Preguntas tab renders — what each option was actually picked by —
 * in the tidy shape a spreadsheet can pivot: the question repeats on every one
 * of its option rows rather than being a merged header nothing can filter by.
 */
const questionDetailSheet = (
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): Pick<SheetSpec, "columns" | "rows"> => {
  const sections = sectionResultsForFilters(results, filters);
  const breakdowns = buildQuestionBreakdowns(draft, { ...results, sections });
  const rows: RowSpec[] = [];

  for (const section of flattenResultSections(sections)) {
    for (const question of section.questions) {
      const breakdown = breakdowns.get(question.id);
      if (!breakdown) continue;

      const context = [
        { value: `${section.numbering} ${section.title}` },
        { value: breakdown.statement },
        { value: breakdown.formatLabel },
      ];
      const metrics = [
        { value: breakdown.score },
        { value: breakdown.favorability },
      ];

      if (breakdown.tallies.length === 0) {
        rows.push(
          dataRow(rows.length, [
            ...context,
            { value: "Respuestas escritas" },
            { value: breakdown.commentCount },
            { value: breakdown.commentCount > 0 ? 100 : null },
            ...metrics,
          ])
        );
        continue;
      }

      for (const tally of breakdown.tallies) {
        rows.push(
          dataRow(rows.length, [
            ...context,
            {
              value: tally.label,
              style: tally.isNsNr
                ? "bx"
                : tally.bandIndex === null
                  ? undefined
                  : bandStyle(tally.bandIndex + 1),
            },
            { value: tally.count },
            { value: tally.percentage },
            ...metrics,
          ])
        );
      }
    }
  }

  return {
    columns: [190, 340, 150, 210, 85, 80, 85, 105],
    rows: [
      headRow([
        "Sección",
        "Pregunta",
        "Formato",
        "Opción de respuesta",
        "Respuestas",
        "% del total",
        "Puntaje pregunta (1-5)",
        "Favorabilidad pregunta (%)",
      ]),
      ...rows,
    ],
  };
};

const INSIGHT_KIND_LABELS: Readonly<Record<InsightKind, string>> = {
  finding: "Hallazgo",
  risk: "Riesgo",
  recommendation: "Acción sugerida",
};

const CONFIDENCE_LABELS: Readonly<Record<"low" | "medium" | "high", { label: string; style: StyleId }>> = {
  high: { label: "Alta", style: "pos" },
  medium: { label: "Media", style: "neu" },
  low: { label: "Baja", style: "neg" },
};

/** Análisis IA: the same reading the tab shows, claim by claim with its figure. */
const aiAnalysisSheet = (
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): SheetSpec => {
  const sections = sectionResultsForFilters(results, filters);
  const analysis = buildSurveyAnalysis({ ...results, sections });

  return {
    name: "Análisis IA",
    columns: [110, 300, 470, 300, 95],
    rows: [
      ...sheetIntro(
        "Lectura de la IA",
        draft,
        results,
        filters,
        "Generada a partir de los resultados de esta medición"
      ),
      { cells: [{ value: "Resumen general", style: "label" }], height: 18 },
      {
        cells: [{ value: analysis.summary, style: "wrap" }],
        autoFitHeight: true,
      },
      blankRow,
      headRow(["Tipo", "Lectura", "Detalle", "Evidencia", "Confiabilidad"]),
      ...analysis.insights.map((insight, index) =>
        dataRow(
          index,
          [
            { value: INSIGHT_KIND_LABELS[insight.kind] },
            { value: insight.title, style: "label" },
            { value: insight.body, style: "wrap" },
            { value: insight.evidence, style: "wrap" },
            {
              value: CONFIDENCE_LABELS[insight.confidence].label,
              style: CONFIDENCE_LABELS[insight.confidence].style,
            },
          ],
          { autoFitHeight: true }
        )
      ),
    ],
  };
};

/**
 * Resumen: the Resumen tab as one sheet.
 *
 * The metrics alone were a header without a report — the tab's whole point is
 * that it decides what the reader does next, and that lives in the executive
 * reading, the ranked priorities with the factors behind them, the strengths to
 * lean on, where the groups pull apart and in whose words. So this sheet prints
 * the same six blocks the screen does, in the same order, from the same model
 * functions: no second implementation that can disagree with the tab.
 */
const SUMMARY_COLUMNS = [265, 300, 120, 105, 115, 115, 400, 260] as const;

const SEVERITY_LABELS: Readonly<Record<Priority["severity"], { label: string; style: StyleId }>> = {
  critical: { label: "Crítica", style: "neg" },
  high: { label: "Alta", style: "neu" },
  watch: { label: "En observación", style: "bx" },
};

const CONFIDENCE_TEXT: Readonly<Record<Priority["confidence"], string>> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const SENTIMENT_LABELS: Readonly<Record<Sentiment, { label: string; style: StyleId }>> = {
  positive: { label: "Positivos", style: "pos" },
  neutral: { label: "Neutros", style: "neu" },
  negative: { label: "Negativos", style: "neg" },
};

/** A block heading inside a sheet that holds several tables. */
const blockRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: "title" }],
  height: 22,
});

const paragraphRow = (text: string): RowSpec => ({
  cells: [{ value: text, style: "wrap" }],
  autoFitHeight: true,
});

function summarySheet(
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): SheetSpec {
  const sections = sectionResultsForFilters(results, filters);
  const filtered: SurveyResults = filters.length === 0 ? results : { ...results, sections };

  const scope = resolveScope(filtered, SCOPE_ALL);
  const metrics = scopedMetrics(scope);
  const level = defaultFindingLevel(scope);
  const findings = findingsAtLevel(scope, level);

  const respondents = buildRespondents(draft, results);
  const scopedIds = scopedQuestionIds(scope);
  const comments = buildOpenComments(draft, results, respondents).filter(
    (comment) => scopedIds.has(comment.questionId) && commentMatchesFilters(comment, filters, results.segments)
  );
  const sentiment = sentimentRollup(comments, new Map());

  const priorities = buildPriorities(findings, sentiment.topics);
  const strengths = buildStrengths(findings);
  const gaps = results.segments
    .filter((segment) => !segment.perPerson)
    .map((segment) => analyseSegmentGaps(segment, results, filters))
    .filter((analysis): analysis is NonNullable<typeof analysis> => analysis !== null);

  // With a filter on, the survey-wide participation is no longer the
  // participation of the people in view, so it is re-totalled from the groups
  // that survived — exactly what the tab's headline does.
  const filterSegment = filters.length
    ? results.segments.find((segment) => segment.key === filters[0].key)
    : undefined;
  const participation = filterSegment
    ? participationBySegment(results, filterSegment, filters)
    : [];
  const scoped =
    filterSegment === undefined
      ? results.participation
      : (() => {
          const completed = participation.reduce((sum, row) => sum + row.completed, 0);
          const inProgress = participation.reduce((sum, row) => sum + row.inProgress, 0);
          const invited = participation.reduce((sum, row) => sum + row.invited, 0);
          return {
            completed,
            inProgress,
            invited,
            rate: invited === 0 ? 0 : Math.round((completed / invited) * 1000) / 10,
          };
        })();

  const verdict = summaryVerdict(findings, scoped.rate);

  const rows: RowSpec[] = [
    ...sheetIntro("Resumen de la medición", draft, results, filters),
  ];

  /* --- indicadores ------------------------------------------------------- */

  const indicators: readonly (readonly [string, string | number | null, StyleId?])[] = [
    ["Encuesta", draft.name],
    ["Tipo", draft.kind ? SURVEY_KIND_LABELS[draft.kind] : "—"],
    ["Población", filterLabelFor(results, filters)],
    ["Invitados", scoped.invited],
    ["Completadas", scoped.completed],
    ["En curso", scoped.inProgress],
    ["Tasa de participación (%)", scoped.rate],
    ["Favorabilidad (%)", metrics.favorability],
    ...(filters.length === 0
      ? ([["Favorabilidad anterior (%)", results.previousFavorability]] as const)
      : []),
    ...(results.nps
      ? ([["eNPS", results.nps.score, npsScoreStyle(results.nps.score)]] as const)
      : []),
    ["Preguntas", metrics.questions],
    ["Preguntas de escala", metrics.scoredQuestions],
    ["Respuestas recibidas", metrics.answers],
    ["NS/NR", metrics.nsnr],
    ["Comentarios", sentiment.total],
    ["Índice de sentimiento (0-100)", sentiment.index],
    // The floor only protects an anonymous measurement — a public one reserves
    // nothing, and printing a "mínimo por grupo" of 1 reads as a rule it isn't.
    ...(draft.visibility === "anonymous"
      ? ([["Mínimo por grupo (anonimato)", results.threshold]] as const)
      : []),
  ];

  rows.push(blockRow("Indicadores"));
  indicators.forEach(([label, value, style], index) =>
    rows.push(
      dataRow(index, [
        { value: label, style: "label" },
        { value, style },
      ])
    )
  );

  /* --- lectura ejecutiva -------------------------------------------------- */

  rows.push(blankRow, blockRow("Lectura ejecutiva"), paragraphRow(verdict));

  /* --- prioridades -------------------------------------------------------- */

  const levelLabel =
    FINDING_LEVELS.find((candidate) => candidate.id === level)?.label ?? "Secciones";

  rows.push(
    blankRow,
    blockRow("Prioridades de esta medición"),
    hintRow(`Severidad × alcance × evidencia cualitativa · leído a nivel de ${levelLabel.toLowerCase()}`),
    headRow([
      "Prioridad",
      "Ubicación",
      "Favorabilidad (%)",
      "Respuestas",
      "Severidad",
      "Confiabilidad",
      "Por qué importa",
      "Señal cualitativa",
    ])
  );

  if (priorities.length === 0) {
    rows.push(paragraphRow("Ningún bloque queda por debajo del objetivo: esta medición no abre prioridades."));
  }

  priorities.forEach((priority, index) =>
    rows.push(
      dataRow(
        index,
        [
          {
            value: `${index + 1}. ${priority.finding.numbering} ${priority.finding.title}`,
            style: "label",
          },
          { value: priority.finding.parent },
          { value: priority.finding.favorability },
          { value: priority.finding.n },
          {
            value: SEVERITY_LABELS[priority.severity].label,
            style: SEVERITY_LABELS[priority.severity].style,
          },
          { value: CONFIDENCE_TEXT[priority.confidence] },
          { value: priority.why, style: "wrap" },
          {
            value: priority.qual
              ? `${priority.qual.negative} de ${priority.qual.mentions} comentarios sobre ${priority.qual.topic.toLowerCase()} son negativos (${Math.round(priority.qual.negativeShare)}%)`
              : "Sin comentarios que confirmen la señal",
            style: "wrap",
          },
        ],
        { autoFitHeight: true }
      )
    )
  );

  /* --- fortalezas --------------------------------------------------------- */

  rows.push(
    blankRow,
    blockRow("Fortalezas para apalancar"),
    headRow(["Fortaleza", "Ubicación", "Favorabilidad (%)", "Respuestas"])
  );
  strengths.forEach((strength, index) =>
    rows.push(
      dataRow(index, [
        { value: `${strength.numbering} ${strength.title}`, style: "label" },
        { value: strength.parent },
        { value: strength.favorability },
        { value: strength.n },
      ])
    )
  );

  /* --- brechas ------------------------------------------------------------ */

  rows.push(
    blankRow,
    blockRow("Dónde existen brechas"),
    hintRow("Grupos que caen por debajo del promedio de su demográfico, en la escala 1 a 5"),
    headRow([
      "Demográfico",
      "Grupo",
      "Puntaje (1-5)",
      "Diferencia",
      "Participación (%)",
      "Estado",
      "Mayor brecha del demográfico",
    ])
  );

  if (gaps.length === 0) {
    rows.push(paragraphRow("Ningún demográfico separa a sus grupos lo suficiente para reportar una brecha."));
  }

  for (const gap of gaps) {
    const widest = gap.widest
      ? `${gap.widest.rowLabel}: ${gap.widest.min} en ${gap.widest.minLabel} vs ${gap.widest.max} en ${gap.widest.maxLabel} (${gap.widest.spread} pts)`
      : "Sin brechas por encima del umbral";

    rows.push(
      dataRow(rows.length, [
        { value: gap.segment.label, style: "label" },
        { value: `Promedio del demográfico: ${Math.round(gap.average * 10) / 10}`, style: "hint" },
        { value: null },
        { value: null },
        { value: null },
        { value: null },
        { value: widest, style: "wrap" },
      ])
    );

    for (const outlier of gap.outliers) {
      rows.push(
        dataRow(rows.length, [
          { value: `    ${gap.segment.label}` },
          { value: outlier.row.label },
          { value: outlier.row.score, style: bandStyle(outlier.row.score) },
          { value: Math.round(outlier.gap * 10) / 10 },
          { value: outlier.row.participation },
          { value: "Bajo el promedio", style: "neg" },
          { value: null },
        ])
      );
    }

    for (const masked of gap.masked) {
      rows.push(
        dataRow(rows.length, [
          { value: `    ${gap.segment.label}` },
          { value: masked.label },
          { value: "Reservado", style: "bx" },
          { value: null },
          { value: masked.participation },
          { value: `Menos de ${results.threshold} respuestas`, style: "bx" },
          { value: null },
        ])
      );
    }
  }

  /* --- voz de los colaboradores ------------------------------------------- */

  rows.push(
    blankRow,
    blockRow("Voz de los colaboradores"),
    hintRow(`${sentiment.total} comentarios leídos por la IA · índice ${sentiment.index ?? "—"} de 100`)
  );

  rows.push(
    headRow(["Lectura", "Comentarios", "% del total"]),
    ...(["positive", "neutral", "negative"] as const).map((band, index) =>
      dataRow(index, [
        { value: SENTIMENT_LABELS[band].label, style: SENTIMENT_LABELS[band].style },
        { value: sentiment.counts[band] },
        { value: share(sentiment.counts[band], sentiment.total) },
      ])
    )
  );

  if (sentiment.topics.length > 0) {
    rows.push(
      blankRow,
      headRow(["Tema", "Menciones", "Positivos", "Neutros", "Negativos", "% negativos"]),
      ...sentiment.topics.map((topic, index) =>
        dataRow(index, [
          { value: topic.topic, style: "label" },
          { value: topic.total },
          { value: topic.positive },
          { value: topic.neutral },
          { value: topic.negative },
          { value: Math.round(topic.negativeShare * 10) / 10 },
        ])
      )
    );
  }

  for (const [label, quote] of [
    ["Comentario más crítico", sentiment.worstQuote],
    ["Comentario más positivo", sentiment.bestQuote],
  ] as const) {
    if (!quote) continue;
    rows.push(
      blankRow,
      dataRow(
        0,
        [
          { value: label, style: "label" },
          { value: quote.topic },
          { value: null },
          { value: null },
          { value: null },
          { value: null },
          { value: `“${quote.text}”`, style: "wrap" },
        ],
        { autoFitHeight: true }
      )
    );
  }

  return { name: "Resumen", columns: SUMMARY_COLUMNS, rows };
}

/**
 * Demográficos: which demographics the survey used and how each group answered.
 *
 * Every breakdown in the workbook rests on this list, and a reader who receives
 * only the breakdowns cannot tell whether "Área" had eight groups or eighty, nor
 * which ones were preloaded rather than asked. So the list travels with them.
 */
function demographicsSheet(
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): SheetSpec {
  const rows: RowSpec[] = [];

  for (const segment of results.segments) {
    const participation = participationBySegment(results, segment, filters);
    const origin = segment.preloaded ? "Precargado" : "Preguntado en la encuesta";
    const kind = segment.perPerson ? "Una fila por persona" : "Grupo";

    rows.push(
      dataRow(rows.length, [
        { value: segment.label, style: "label" },
        { value: origin },
        { value: kind },
        { value: `${segment.options.length} grupos` },
        { value: null },
        { value: null },
        { value: null },
        { value: null },
      ])
    );

    for (const row of participation) {
      rows.push(
        dataRow(rows.length, [
          { value: `    ${segment.label}` },
          { value: origin },
          { value: kind },
          { value: row.label },
          { value: row.invited },
          { value: row.completed },
          { value: row.rate },
          {
            value: row.belowThreshold ? "Reservado" : "Se reporta",
            style: row.belowThreshold ? "bx" : undefined,
          },
        ])
      );
    }
  }

  return {
    name: "Demográficos",
    columns: [190, 190, 150, 200, 80, 95, 85, 105],
    rows: [
      ...sheetIntro(
        "Demográficos de la encuesta",
        draft,
        results,
        filters,
        draft.visibility === "anonymous"
          ? `${results.segments.length} demográficos · umbral de anonimato en ${results.threshold} respuestas`
          : `${results.segments.length} demográficos · encuesta pública, sin umbral de anonimato`
      ),
      headRow([
        "Demográfico",
        "Origen",
        "Tipo",
        "Grupo",
        "Invitados",
        "Completadas",
        "Tasa (%)",
        "Resultados",
      ]),
      ...rows,
    ],
  };
}

/**
 * Profundidad: what each band answered when the survey asked why.
 *
 * One row per written answer, with the band's coverage repeated on every row —
 * the tidy shape a spreadsheet can pivot, and the only one where filtering to
 * "Detractores" still tells the reader how many detractors there were. The
 * screen draws the first eight answers of a band; this sheet carries all of
 * them, which is what the screen's own "y N más" line points at.
 */
function npsDepthSheet(
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): SheetSpec {
  const sections = npsDepthBySection(draft, results, filters);
  const questions = flattenNpsDepth(sections);
  const totals = npsDepthTotals(sections);

  const bandStyles: Readonly<Record<NpsBand, StyleId>> = {
    promoter: "pos",
    passive: "neu",
    detractor: "neg",
  };

  const rows: RowSpec[] = [];

  for (const question of questions) {
    for (const band of question.bands) {
      const context = [
        { value: `${question.sectionNumbering} ${question.sectionTitle}` },
        { value: question.statement },
        { value: NPS_BAND_LABELS[band.band], style: bandStyles[band.band] },
        { value: band.question.trim() || "Sin pregunta configurada", style: band.question.trim() ? undefined : "bx" as const },
        { value: band.people },
        { value: band.answered },
        { value: band.coverage },
      ];

      if (band.answers.length === 0) {
        rows.push(
          dataRow(rows.length, [
            ...context,
            { value: "Sin respuestas de esta banda", style: "bx" },
            { value: null },
          ])
        );
        continue;
      }

      for (const answer of band.answers) {
        rows.push(
          dataRow(
            rows.length,
            [...context, { value: answer.text, style: "wrap" }, { value: answer.segment }],
            { autoFitHeight: true }
          )
        );
      }
    }
  }

  if (rows.length === 0) {
    rows.push(dataRow(0, [{ value: "Ninguna pregunta pidió profundidad", style: "hint" }]));
  }

  return {
    name: "Profundidad",
    columns: [190, 300, 95, 300, 85, 95, 85, 420, 170],
    rows: [
      ...sheetIntro(
        "Preguntas de profundidad",
        draft,
        results,
        filters,
        `${totals.answered} respuestas de ${totals.people} personas · ${totals.coverage ?? 0}% de cobertura`
      ),
      headRow([
        "Sección",
        "Pregunta de escala",
        "Banda",
        "Pregunta de profundidad",
        "Personas en la banda",
        "Respondieron",
        "Cobertura (%)",
        "Respuesta",
        "Segmento",
      ]),
      ...rows,
    ],
  };
}

// --- Reportes ---------------------------------------------------------------------

/**
 * Resultados generales: todos los niveles de análisis, una hoja por nivel.
 *
 * The reader picks which levels travel — the same list the drawer shows — so
 * the sheet order here is `XLSX_SHEETS` order, and a level nobody asked for is
 * simply absent rather than present and empty.
 */
export function buildResultsWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const filters = request.filters;
  const sections = sectionResultsForFilters(results, filters);
  const sheets: SheetSpec[] = [];
  const wants = (sheet: XlsxSheetId): boolean => request.xlsxSheets.includes(sheet);

  if (wants("summary")) sheets.push(summarySheet(draft, results, filters));

  if (wants("demographics") && results.segments.length > 0) {
    sheets.push(demographicsSheet(draft, results, filters));
  }

  if (wants("sections")) sheets.push({
    name: "Secciones",
    columns: [70, 340, 80, 110, 90, 60],
    rows: [
      ...sheetIntro("Favorabilidad por secciones", draft, results, filters),
      headRow(["Numeración", "Sección", "Puntaje (1-5)", "Favorabilidad (%)", "Respuestas", "NS/NR"]),
      ...flattenResultSections(sections).map((section, index) =>
        dataRow(index, [
          { value: section.numbering },
          { value: `${"    ".repeat(section.depth)}${section.title}`, style: section.depth === 0 ? "label" : undefined },
          { value: section.n > 0 ? section.score : null, style: section.n > 0 ? bandStyle(section.score) : "bx" },
          { value: section.n > 0 ? section.favorability : null },
          { value: section.n },
          { value: section.nsnr },
        ])
      ),
    ],
  });

  if (wants("questions")) {
    const questions = questionSheet(results, filters);
    sheets.push({
      name: "Preguntas",
      columns: questions.columns,
      rows: [...sheetIntro("Resultados por pregunta", draft, results, filters), ...questions.rows],
    });
  }

  if (wants("question-detail")) {
    const detail = questionDetailSheet(draft, results, filters);
    sheets.push({
      name: "Detalle de preguntas",
      columns: detail.columns,
      rows: [
        ...sheetIntro(
          "Detalle por opción de respuesta",
          draft,
          results,
          filters,
          "Incluye escalas, opción única, múltiples respuestas y preguntas abiertas"
        ),
        ...detail.rows,
      ],
    });
  }

  if (wants("nps") && results.nps) {
    const nps = results.nps;
    const npsPairs: readonly [string, string | number | null][] = [
      ["eNPS", nps.score],
      ["eNPS anterior", nps.previousScore],
      ["Variación (puntos)", Math.round((nps.score - nps.previousScore) * 10) / 10],
      ["Promotores", nps.promoters],
      ["Pasivos", nps.passives],
      ["Detractores", nps.detractors],
      ["% Promotores", share(nps.promoters, nps.n)],
      ["% Pasivos", share(nps.passives, nps.n)],
      ["% Detractores", share(nps.detractors, nps.n)],
      ["Respuestas", nps.n],
    ];

    sheets.push({
      name: "eNPS",
      columns: NPS_COLUMNS,
      rows: [
        ...sheetIntro(
          "eNPS de la medición",
          draft,
          results,
          filters,
          "eNPS = % promotores − % detractores, de −100 a +100"
        ),
        ...npsPairs.map(([label, value], index) =>
          dataRow(index, [
            { value: label, style: "label" },
            { value, style: label === "eNPS" ? npsScoreStyle(nps.score) : undefined },
          ])
        ),
        blankRow,
        headRow([...NPS_HEAD]),
        ...npsDetailRows(npsBySection(results, filters)),
      ],
    });
  }

  const segmentByKey = (key: string): SegmentDefinition | undefined =>
    results.segments.find((segment) => segment.key === key);

  for (const key of request.participationSegments) {
    const segment = segmentByKey(key);
    if (!segment) continue;
    const rows = participationBySegment(results, segment, filters);
    sheets.push({
      name: `Participación · ${segment.label}`,
      columns: [190, 80, 95, 75, 75, 95],
      rows: [
        ...sheetIntro(`Participación por ${segment.label.toLowerCase()}`, draft, results, filters),
        headRow([segment.label, "Invitados", "Completadas", "En curso", "Tasa (%)", "Bajo umbral"]),
        ...rows.map((row, index) =>
          dataRow(index, [
            { value: row.label },
            { value: row.invited },
            { value: row.completed },
            { value: row.inProgress },
            { value: row.rate },
            { value: row.belowThreshold ? "Sí" : "No", style: row.belowThreshold ? "neg" : undefined },
          ])
        ),
      ],
    });
  }

  for (const key of request.heatmapSegments) {
    const segment = segmentByKey(key);
    if (!segment || segment.perPerson) continue;
    const heatmap = heatmapBySegment(results, segment, filters);
    const flat: RowSpec[] = [];
    let index = 0;
    const walk = (rows: readonly (typeof heatmap.rows)[number][]) => {
      for (const row of rows) {
        flat.push(
          dataRow(index, [
            {
              value: `${"    ".repeat(row.depth)}${row.numbering} ${row.label}`,
              style: row.kind === "section" && row.depth === 0 ? "label" : undefined,
            },
            { value: row.total, style: bandStyle(row.total) },
            ...row.cells.map((cell) => ({
              value: cell.masked ? "Reservado" : cell.score,
              style: cell.masked ? ("bx" as const) : bandStyle(cell.score),
            })),
          ])
        );
        index += 1;
        walk(row.children);
      }
    };
    walk(heatmap.rows);
    sheets.push({
      name: `Heatmap · ${segment.label}`,
      columns: [280, 60, ...heatmap.columns.map(() => 78)],
      rows: [
        ...sheetIntro(
          `Heatmap por ${segment.label.toLowerCase()}`,
          draft,
          results,
          filters,
          `Grupos con menos de ${results.threshold} respuestas se reportan como Reservado`
        ),
        headRow(["Sección / pregunta", "Total", ...heatmap.columns.map((column) => column.label)]),
        ...flat,
        dataRow(index, [
          { value: "Total por grupo", style: "label" },
          { value: null },
          ...heatmap.columnTotals.map((total) => ({
            value: total ?? "Reservado",
            style: total === null ? ("bx" as const) : bandStyle(total),
          })),
        ]),
      ],
    });
  }

  if (results.nps) {
    for (const key of request.npsSegments) {
      const segment = segmentByKey(key);
      if (!segment || segment.perPerson) continue;
      const grid = npsBySegmentData(results, segment, filters);
      sheets.push({
        name: `eNPS · ${segment.label}`,
        columns: [300, 60, ...grid.columns.map(() => 78)],
        rows: [
          ...sheetIntro(
            `eNPS por ${segment.label.toLowerCase()}`,
            draft,
            results,
            filters,
            `Grupos con menos de ${results.threshold} respuestas se reportan como Reservado`
          ),
          headRow(["Dimensión / pregunta", "Total", ...grid.columns.map((column) => column.label)]),
          ...npsSegmentRows([grid.totalRow, ...grid.sectionRows], 0),
        ],
      });
    }
  }

  if (wants("depth")) sheets.push(npsDepthSheet(draft, results, filters));

  // Last on purpose: the narrative reads after the data it rests on.
  if (wants("ai")) sheets.push(aiAnalysisSheet(draft, results, filters));

  return workbook(sheets);
}

/**
 * Comentarios: las respuestas abiertas, filtradas por sentimiento, tema y población.
 *
 * The file is the Preguntas tab's comment list, not the eNPS follow-ups: it is
 * built from the same `buildOpenComments` the screen reads, so a reader who
 * narrowed by theme there recognises every row here — theme included, which is
 * the column the eNPS verbatims never had.
 */
export function buildCommentsWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const wanted = new Set<Sentiment>(request.commentSentiments);
  // An empty theme list means "todos": a measurement can pick up a theme the
  // configuration never saw, and dropping it silently would be worse than
  // exporting one row more than the reader ticked.
  const topics = new Set(request.commentTopics);

  const respondents = buildRespondents(draft, results);
  const comments = buildOpenComments(draft, results, respondents).filter(
    (comment) =>
      wanted.has(comment.aiSentiment) &&
      (topics.size === 0 || topics.has(comment.topic)) &&
      commentMatchesFilters(comment, request.filters, results.segments)
  );

  // Singular here, plural in `SENTIMENT_LABELS`: that one labels a count
  // ("14 Negativos"), this one labels one comment's own reading.
  const reading: Readonly<Record<Sentiment, { label: string; style: StyleId }>> = {
    positive: { label: "Positivo", style: "pos" },
    neutral: { label: "Neutral", style: "neu" },
    negative: { label: "Negativo", style: "neg" },
  };
  const order: readonly Sentiment[] = ["positive", "neutral", "negative"];

  const scopeHint = [
    wanted.size === 3
      ? "Todos los sentimientos"
      : `Sentimientos: ${order
          .filter((id) => wanted.has(id))
          .map((id) => reading[id].label)
          .join(", ")}`,
    topics.size === 0 ? "Todos los temas" : `Temas: ${[...topics].join(", ")}`,
  ].join("  ·  ");

  const rows: RowSpec[] =
    comments.length === 0
      ? [dataRow(0, [{ value: "Sin comentarios con esta configuración", style: "hint" }])]
      : comments.map((comment, index) =>
          dataRow(
            index,
            [
              { value: `${comment.sectionNumbering} ${comment.sectionTitle}`.trim() },
              { value: comment.questionStatement },
              { value: comment.text, style: "wrap" },
              {
                value: reading[comment.aiSentiment].label,
                style: reading[comment.aiSentiment].style,
              },
              { value: comment.aiConfidence },
              { value: comment.topic, style: "label" },
              { value: comment.area ?? "Anónimo" },
              { value: comment.country ?? "Anónimo" },
              { value: comment.submittedLabel },
            ],
            { autoFitHeight: true }
          )
        );

  return workbook([
    {
      name: "Comentarios",
      columns: [150, 230, 340, 90, 80, 130, 120, 110, 100],
      rows: [
        ...sheetIntro("Comentarios de los colaboradores", draft, results, request.filters, scopeHint),
        headRow([
          "Sección",
          "Pregunta",
          "Comentario",
          "Sentimiento",
          "Confianza IA",
          "Tema",
          "Área",
          "País",
          "Enviado",
        ]),
        ...rows,
      ],
    },
  ]);
}

// --- Individual answers ------------------------------------------------------

/**
 * The demographic each respondent carries, keyed by the segment key the report
 * filters speak. A survey can ask for a demographic the roster never stores —
 * that one simply has no column and narrows nothing.
 */
const RESPONDENT_FACETS: Readonly<Record<string, (person: Respondent) => string | null>> = {
  area: (person) => person.area,
  leader: (person) => person.leader,
  country: (person) => person.country,
  gender: (person) => person.gender,
  age: (person) => person.age,
};

/**
 * Same rule as `commentMatchesFilters`: several options of one demographic are
 * a union, different demographics intersect, and a value the measurement never
 * carried — every one of them on an anonymous survey — narrows nothing.
 */
const respondentMatchesFilters = (
  person: Respondent,
  filters: readonly SegmentFilter[],
  segments: readonly SegmentDefinition[]
): boolean => {
  const byKey = new Map<string, string[]>();
  for (const filter of filters) {
    const segment = segments.find((candidate) => candidate.key === filter.key);
    const label =
      segment?.options.find((option) => option.id === filter.optionId)?.label ?? filter.optionId;
    const group = byKey.get(filter.key);
    if (group) group.push(label);
    else byKey.set(filter.key, [label]);
  }

  return [...byKey.entries()].every(([key, labels]) => {
    const value = RESPONDENT_FACETS[key]?.(person) ?? null;
    return value === null || labels.some((label) => value === label);
  });
};

interface ResponseData {
  /** The roster, already narrowed by the population filter. */
  respondents: readonly Respondent[];
  breakdowns: ReadonlyMap<string, QuestionBreakdown>;
  /** `respondentId` → what that person answered, keyed by question id. */
  answers: ReadonlyMap<string, ReadonlyMap<string, RespondentAnswer>>;
  /** The demographic columns worth printing: none on an anonymous survey. */
  facets: readonly { key: string; label: string }[];
  anonymous: boolean;
}

/**
 * Who answered what, read off the same allocation the individual sheets show.
 *
 * The answers are not re-sampled here: `buildAnswerMatrix` hands every tally
 * its exact slice of the roster once, so a question that reports "190 en 4"
 * lists exactly 190 people on the 4 — the export and the screen cannot drift.
 */
function buildResponseData(
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): ResponseData {
  const roster = buildRespondents(draft, results);
  const breakdowns = buildQuestionBreakdowns(draft, results);
  const comments = buildOpenComments(draft, results, roster);
  const matrix = buildAnswerMatrix(roster, breakdowns);

  const respondents = roster.filter((person) =>
    respondentMatchesFilters(person, filters, results.segments)
  );
  const answers = new Map(
    respondents.map((person) => [
      person.id,
      buildRespondentAnswers(person, breakdowns, comments, matrix),
    ])
  );

  const facets = results.segments
    .filter(
      (segment) =>
        RESPONDENT_FACETS[segment.key] !== undefined &&
        respondents.some((person) => RESPONDENT_FACETS[segment.key](person) !== null)
    )
    .map((segment) => ({ key: segment.key, label: segment.label }));

  return {
    respondents,
    breakdowns,
    answers,
    facets,
    anonymous: draft.visibility === "anonymous",
  };
}

/**
 * What the individual sheets say about who the rows are.
 *
 * A population filter narrows the aggregate but cannot narrow an anonymous
 * roster — nobody in it carries a demographic to match — so the file says so
 * instead of letting the reader read "Población: Área: Producto" over rows
 * that hold everyone.
 */
const identityHint = (anonymous: boolean, filters: readonly SegmentFilter[]): string => {
  if (!anonymous) {
    return "Encuesta pública: cada fila lleva la identidad y los demográficos de quien respondió";
  }
  return filters.length > 0
    ? "Encuesta anónima: participantes numerados, sin demográficos — por eso las filas no se acotan por población"
    : "Encuesta anónima: cada fila es un participante numerado, sin identidad ni demográficos";
};

/** The cell one answer prints as: colored by its band, gray on an opt-out. */
const answerCell = (answer: RespondentAnswer | undefined): XmlCell => {
  if (!answer || answer.skipped) return { value: "" };
  if (answer.nsnr) return { value: "NS/NR", style: "bx" };
  if (answer.bandIndex !== null && answer.value !== null) {
    return { value: answer.value, style: bandStyle(answer.bandIndex + 1) };
  }
  return { value: answer.value ?? answer.display };
};

/**
 * Excel caps a tab name at 31 characters, rejects `[]:*?/\` and refuses two
 * tabs with the same name — a survey can ask two sections the same question,
 * so the collision has to be resolved rather than trusted away.
 */
const sheetNamer = () => {
  const used = new Set<string>();
  return (base: string): string => {
    const clean =
      base
        .replace(/[[\]:*?/\\]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 31)
        .trim() || "Hoja";
    let name = clean;
    let attempt = 2;
    while (used.has(name.toLowerCase())) {
      const tail = ` (${attempt})`;
      name = `${clean.slice(0, 31 - tail.length).trim()}${tail}`;
      attempt += 1;
    }
    used.add(name.toLowerCase());
    return name;
  };
};

/** One question's own tab: its distribution, then every answer it received. */
function questionResponsesSheet(
  name: string,
  position: number,
  question: FlatQuestion,
  data: ResponseData,
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[]
): SheetSpec {
  const breakdown = data.breakdowns.get(question.id);
  const isOpen = breakdown?.type === "open";

  const answered = data.respondents
    .map((person) => ({ person, answer: data.answers.get(person.id)?.get(question.id) }))
    .filter(
      (entry): entry is { person: Respondent; answer: RespondentAnswer } =>
        entry.answer !== undefined && !entry.answer.skipped
    );

  // Counted over the rows this very sheet lists, never copied from the
  // aggregate: a tab whose table and list disagree is worse than one that
  // only claims what it prints.
  const counts = new Map<string, number>();
  for (const entry of answered) {
    const labels = entry.answer.selected.length > 0 ? entry.answer.selected : [entry.answer.display];
    for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const distributionRows: RowSpec[] =
    isOpen || !breakdown || breakdown.tallies.length === 0
      ? []
      : [
          headRow(["Opción", "Respuestas", "% de las respuestas"]),
          ...breakdown.tallies.map((tally, index) => {
            const count = counts.get(tally.label) ?? 0;
            return dataRow(index, [
              {
                value: tally.label,
                style: tally.bandIndex !== null ? bandStyle(tally.bandIndex + 1) : tally.isNsNr ? "bx" : undefined,
              },
              { value: count },
              { value: share(count, answered.length) },
            ]);
          }),
          blankRow,
        ];

  // No "Valor" twin of the answer and no submission date: both live one column
  // wide in the "Respuestas" workbook, and a tab repeated once per question
  // pays for every extra column 24.000 times over.
  const responseHead = [
    "Respuesta #",
    "Participante",
    ...data.facets.map((facet) => facet.label),
    "Respuesta",
  ];

  const responseRows: RowSpec[] =
    answered.length === 0
      ? [dataRow(0, [{ value: "Sin respuestas con esta configuración", style: "hint" }])]
      : answered.map(({ person, answer }, index) =>
          dataRow(
            index,
            [
              { value: index + 1 },
              { value: person.name },
              ...data.facets.map((facet) => ({
                value: RESPONDENT_FACETS[facet.key](person) ?? "",
              })),
              {
                value: answer.nsnr ? "No sabe / No responde" : answer.display,
                style: isOpen
                  ? "wrap"
                  : answer.nsnr
                    ? "bx"
                    : answer.bandIndex !== null
                      ? bandStyle(answer.bandIndex + 1)
                      : undefined,
              },
            ],
            { autoFitHeight: isOpen }
          )
        );

  const scope = [
    breakdown?.formatLabel ?? "Pregunta",
    `${answered.length} respuestas`,
    ...(question.score !== null ? [`Puntaje ${question.score}`] : []),
    ...(question.favorability !== null ? [`Favorabilidad ${question.favorability}%`] : []),
  ].join("  ·  ");

  return {
    name,
    columns: [70, 160, ...data.facets.map(() => 110), isOpen ? 420 : 280],
    rows: [
      ...sheetIntro(
        `P${position}. ${question.statement}`,
        draft,
        results,
        filters,
        `${question.sectionNumbering} ${question.sectionTitle}  ·  ${scope}  ·  ${identityHint(
          data.anonymous,
          filters
        )}`
      ),
      ...distributionRows,
      headRow(responseHead),
      ...responseRows,
    ],
  };
}

/**
 * Preguntas: una hoja por pregunta, con todas las respuestas que recibió.
 *
 * The file used to be a single table of aggregates — the same numbers the
 * "Resultados generales" workbook already carries in its "Preguntas" sheet,
 * which made this report a duplicate rather than a report of its own. It now
 * opens on that summary and then gives every question its own tab: its
 * distribution counted over the rows below it, and one row per person who
 * answered it.
 */
export function buildQuestionsWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const { filters } = request;
  const data = buildResponseData(draft, results, filters);
  const questions = flattenQuestions(results, filters);
  const overview = questionSheet(results, filters);
  const nameFor = sheetNamer();

  const sheets: SheetSpec[] = [
    {
      name: nameFor("Resumen"),
      columns: overview.columns,
      rows: [
        ...sheetIntro(
          "Resultados por pregunta",
          draft,
          results,
          filters,
          `${questions.length} preguntas · cada una con su propia hoja de respuestas`
        ),
        ...overview.rows,
      ],
    },
    ...questions.map((question, index) =>
      questionResponsesSheet(
        nameFor(`P${index + 1} ${question.statement}`),
        index + 1,
        question,
        data,
        draft,
        results,
        filters
      )
    ),
  ];

  return workbook(sheets);
}

/**
 * Respuestas: una fila por participante con todo lo que respondió.
 *
 * Read off the same allocation the individual sheets show — not re-sampled —
 * so the file re-sums into exactly the distributions the screen reports. What
 * identifies the row is the survey's own privacy setting, not a rule of the
 * export: a public measurement carries the name and the correo it already
 * shows on screen, and an anonymous one carries the stable pseudonym and no
 * demographic at all, because "Marketing, Colombia, 18–24" identifies a person
 * as reliably as a name does.
 */
export function buildAnswersWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const { filters } = request;
  const data = buildResponseData(draft, results, filters);
  const questions = flattenQuestions(results, filters);

  const rows: RowSpec[] =
    data.respondents.length === 0
      ? [dataRow(0, [{ value: "Sin respuestas con esta configuración", style: "hint" }])]
      : data.respondents.map((person, index) => {
          const answers = data.answers.get(person.id);
          return dataRow(index, [
            { value: index + 1 },
            { value: person.name },
            ...(data.anonymous ? [] : [{ value: person.email ?? "" }]),
            ...data.facets.map((facet) => ({
              value: RESPONDENT_FACETS[facet.key](person) ?? "",
            })),
            { value: person.status === "complete" ? "Completa" : "Parcial" },
            { value: person.submittedLabel },
            ...questions.map((question) => answerCell(answers?.get(question.id))),
          ]);
        });

  return workbook([
    {
      name: "Respuestas",
      columns: [
        70,
        160,
        ...(data.anonymous ? [] : [180]),
        ...data.facets.map(() => 110),
        80,
        90,
        ...questions.map(() => 60),
      ],
      rows: [
        ...sheetIntro(
          "Respuestas individuales",
          draft,
          results,
          filters,
          identityHint(data.anonymous, filters)
        ),
        headRow([
          "Respuesta #",
          "Participante",
          ...(data.anonymous ? [] : ["Correo"]),
          ...data.facets.map((facet) => facet.label),
          "Estado",
          "Enviado",
          ...questions.map((question) => `${question.sectionNumbering} ${question.statement}`),
        ]),
        ...rows,
      ],
    },
  ]);
}
