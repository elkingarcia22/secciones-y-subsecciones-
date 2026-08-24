import type { SurveyDraft } from "@/components/survey-builder";
import { SURVEY_KIND_LABELS } from "@/components/survey-builder";
import {
  flattenResultSections,
  heatmapBySegment,
  participationBySegment,
  sectionResultsForFilters,
  unitFromSeed,
  type NpsBand,
  type SegmentDefinition,
  type SegmentFilter,
  type SurveyResults,
} from "@/mocks/surveyResults";
import type { ReportRequest } from "./downloadTypes";

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
  filter: SegmentFilter | null
): string => {
  if (!filter) return "Toda la empresa";
  const segment = results.segments.find((candidate) => candidate.key === filter.key);
  const option = segment?.options.find((candidate) => candidate.id === filter.optionId);
  return option ? `${segment?.label}: ${option.label}` : "Toda la empresa";
};

/** The "title + context + blank" block every sheet opens with. */
const sheetIntro = (
  title: string,
  draft: SurveyDraft,
  results: SurveyResults,
  filter: SegmentFilter | null,
  extra?: string
): RowSpec[] => [
  titleRow(title),
  hintRow(
    [
      draft.name,
      `Generado el ${new Date().toLocaleDateString("es-CO")}`,
      `Población: ${filterLabelFor(results, filter)}`,
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
  filter: SegmentFilter | null
): FlatQuestion[] => {
  const sections = sectionResultsForFilters(results, filter ? [filter] : []);
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
  filter: SegmentFilter | null
): Pick<SheetSpec, "columns" | "rows"> => {
  const rows = flattenQuestions(results, filter).map((question, index) =>
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

// --- Reportes ---------------------------------------------------------------------

/** Resultados generales: todos los niveles de análisis, una hoja por nivel. */
export function buildResultsWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const filter = request.filter;
  const filters = filter ? [filter] : [];
  const sections = sectionResultsForFilters(results, filters);
  const sheets: SheetSpec[] = [];

  const summaryPairs: readonly [string, string | number][] = [
    ["Encuesta", draft.name],
    ["Tipo", draft.kind ? SURVEY_KIND_LABELS[draft.kind] : "—"],
    ["Población", filterLabelFor(results, filter)],
    ["Invitados", results.participation.invited],
    ["Completadas", results.participation.completed],
    ["Tasa de participación (%)", results.participation.rate],
    ["Favorabilidad (%)", results.favorability],
    ["Favorabilidad anterior (%)", results.previousFavorability],
    ...(results.nps ? ([["eNPS", results.nps.score]] as const) : []),
    ["Mínimo por grupo (anonimato)", results.threshold],
  ];

  sheets.push({
    name: "Resumen",
    columns: [210, 330],
    rows: [
      ...sheetIntro("Resumen de la medición", draft, results, filter),
      ...summaryPairs.map(([label, value], index) =>
        dataRow(index, [
          { value: label, style: "label" },
          { value },
        ])
      ),
    ],
  });

  sheets.push({
    name: "Secciones",
    columns: [70, 340, 80, 110, 90, 60],
    rows: [
      ...sheetIntro("Favorabilidad por secciones", draft, results, filter),
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

  const questions = questionSheet(results, filter);
  sheets.push({
    name: "Preguntas",
    columns: questions.columns,
    rows: [...sheetIntro("Resultados por pregunta", draft, results, filter), ...questions.rows],
  });

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
        ...sheetIntro(`Participación por ${segment.label.toLowerCase()}`, draft, results, filter),
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
          filter,
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

  return workbook(sheets);
}

/** Comentarios: las respuestas abiertas, filtradas por sentimiento y población. */
export function buildCommentsWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const bands = new Set<NpsBand>(request.commentSentiments);
  const filterOption = request.filter
    ? results.segments
        .find((segment) => segment.key === request.filter?.key)
        ?.options.find((option) => option.id === request.filter?.optionId)
    : undefined;

  const sentiment: Readonly<Record<NpsBand, { label: string; style: StyleId }>> = {
    promoter: { label: "Positivo", style: "pos" },
    passive: { label: "Neutral", style: "neu" },
    detractor: { label: "Negativo", style: "neg" },
  };

  const verbatims = results.verbatims.filter(
    (verbatim) =>
      bands.has(verbatim.band) &&
      (!filterOption || verbatim.segment.toLowerCase().includes(filterOption.label.toLowerCase()))
  );

  const sentimentHint =
    bands.size === 3
      ? "Todos los sentimientos"
      : `Sentimientos: ${[...bands].map((band) => sentiment[band].label).join(", ")}`;

  const rows: RowSpec[] =
    verbatims.length === 0
      ? [dataRow(0, [{ value: "Sin comentarios con esta configuración", style: "hint" }])]
      : verbatims.map((verbatim, index) =>
          dataRow(
            index,
            [
              { value: verbatim.question },
              { value: verbatim.text, style: "wrap" },
              { value: sentiment[verbatim.band].label, style: sentiment[verbatim.band].style },
              { value: verbatim.segment },
            ],
            { autoFitHeight: true }
          )
        );

  return workbook([
    {
      name: "Comentarios",
      columns: [260, 380, 80, 170],
      rows: [
        ...sheetIntro("Comentarios de los colaboradores", draft, results, request.filter, sentimentHint),
        headRow(["Pregunta", "Comentario", "Sentimiento", "Segmento"]),
        ...rows,
      ],
    },
  ]);
}

/** Preguntas: una fila por pregunta con la distribución completa. */
export function buildQuestionsWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const questions = questionSheet(results, request.filter);
  return workbook([
    {
      name: "Preguntas",
      columns: questions.columns,
      rows: [
        ...sheetIntro("Resultados por pregunta", draft, results, request.filter),
        ...questions.rows,
      ],
    },
  ]);
}

/**
 * Respuestas: una fila por respuesta individual.
 *
 * The aggregate never stored individual answers, so each row is drawn from the
 * question's own distribution with a seed per (respondent, question): the file
 * re-sums into exactly the distributions the screen shows, and regenerating it
 * yields the same rows. A population filter keeps only the respondents whose
 * sampled demographic matches, so the file and its own demographic column can
 * never contradict each other. Identities stay out on purpose — an anonymous
 * survey's export carries a running number and demographics, never a name.
 */
export function buildAnswersWorkbook(
  draft: SurveyDraft,
  results: SurveyResults,
  request: ReportRequest
): string {
  const segments = results.segments.filter((segment) => !segment.perPerson);
  const questions = flattenQuestions(results, null).filter((question) => question.scored);
  const respondents = Math.min(results.participation.completed, 1000);

  const pick = (seed: string, weights: readonly number[]): number => {
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) return 0;
    let remaining = unitFromSeed(seed) * total;
    for (let index = 0; index < weights.length; index += 1) {
      remaining -= weights[index];
      if (remaining <= 0) return index;
    }
    return weights.length - 1;
  };

  const rows: RowSpec[] = [];
  for (let person = 0; person < respondents; person += 1) {
    const sampled = segments.map((segment) => {
      const option = segment.options[
        Math.floor(unitFromSeed(`resp:${person}:${segment.key}`) * segment.options.length)
      ];
      return { key: segment.key, option };
    });

    if (request.filter) {
      const match = sampled.find((entry) => entry.key === request.filter?.key);
      if (match && match.option?.id !== request.filter.optionId) continue;
    }

    const answers = questions.map((question): XmlCell => {
      if (!question.distribution) return { value: null };
      const boxes = [...question.distribution, question.nsnr];
      const box = pick(`resp:${person}:${question.id}`, boxes);
      return box === 5
        ? { value: "NS/NR", style: "bx" }
        : { value: box + 1, style: bandStyle(box + 1) };
    });

    rows.push(
      dataRow(rows.length, [
        { value: rows.length + 1 },
        ...sampled.map((entry) => ({ value: entry.option?.label ?? "" })),
        ...answers,
      ])
    );
  }

  if (rows.length === 0) {
    rows.push(dataRow(0, [{ value: "Sin respuestas con esta configuración", style: "hint" }]));
  }

  return workbook([
    {
      name: "Respuestas",
      columns: [70, ...segments.map(() => 110), ...questions.map(() => 55)],
      rows: [
        ...sheetIntro(
          "Respuestas individuales",
          draft,
          results,
          request.filter,
          "Anonimizadas: número de fila, nunca identidad"
        ),
        headRow([
          "Respuesta #",
          ...segments.map((segment) => segment.label),
          ...questions.map((question) => `${question.sectionNumbering} ${question.statement}`),
        ]),
        ...rows,
      ],
    },
  ]);
}
