import type { LucideIcon } from "lucide-react";
import { FileSpreadsheet, FileText, FileType2, MessageSquareText, Table2 } from "lucide-react";
import type { NpsBand, SegmentFilter } from "@/mocks/surveyResults";

/** Every report the download center can produce. */
export type ReportKind = "pdf" | "xlsx" | "comments" | "questions-csv" | "answers-csv";

/** Blocks the visual PDF can include or drop, in the order they print. */
export type PdfBlockId =
  | "summary"
  | "participation"
  | "favorability"
  | "heatmap"
  | "questions"
  | "nps"
  | "comments";

export interface PdfBlockDefinition {
  id: PdfBlockId;
  label: string;
  description: string;
  /** Blocks that only make sense when the survey collected demographics. */
  needsSegments?: boolean;
  /** Blocks that only make sense when the survey asked an NPS question. */
  needsNps?: boolean;
}

export const PDF_BLOCKS: readonly PdfBlockDefinition[] = [
  { id: "summary", label: "Resumen ejecutivo", description: "Indicadores principales y escala de lectura" },
  { id: "participation", label: "Participación", description: "Tasa de respuesta y desglose por grupo", needsSegments: true },
  { id: "favorability", label: "Favorabilidad por secciones", description: "Puntaje y distribución de cada sección" },
  { id: "heatmap", label: "Heatmap demográfico", description: "Mapa de calor de secciones por grupo", needsSegments: true },
  { id: "questions", label: "Preguntas a priorizar", description: "Las preguntas con menor favorabilidad" },
  { id: "nps", label: "eNPS", description: "Puntaje y mezcla de promotores y detractores", needsNps: true },
  { id: "comments", label: "Comentarios destacados", description: "Respuestas abiertas representativas" },
];

/**
 * Everything a "Descargar" click carries: what to produce and how the reader
 * configured it. Kinds ignore the knobs that don't apply to them — a CSV of
 * preguntas has nothing demographic to break down.
 */
export interface ReportRequest {
  kind: ReportKind;
  /** XLSX: demographics to expand into "Participación por …" sheets. */
  participationSegments: readonly string[];
  /** XLSX: demographics to expand into "Heatmap por …" sheets. */
  heatmapSegments: readonly string[];
  /** PDF: which blocks print, in `PDF_BLOCKS` order. */
  pdfBlocks: readonly PdfBlockId[];
  /** PDF: demographic used by the participación and heatmap blocks. */
  pdfSegmentKey: string | null;
  /** Comentarios: which sentiments make it into the file. All three = todos. */
  commentSentiments: readonly NpsBand[];
  /** Narrow the population to one demographic value, or null for everyone. */
  filter: SegmentFilter | null;
}

export interface ReportTypeDefinition {
  kind: ReportKind;
  title: string;
  description: string;
  /** Short format chip and the word the footer CTA uses: "Descargar PDF". */
  format: "PDF" | "XLSX";
  icon: LucideIcon;
  /** Slug the generated file name starts with. */
  fileSlug: string;
  /** Rough size of the simulated preparation, in milliseconds. */
  prepareMs: number;
}

export const REPORT_TYPES: readonly ReportTypeDefinition[] = [
  {
    kind: "pdf",
    title: "Reporte visual (PDF)",
    description: "Documento con gráficos, heatmaps y resultados listos para presentar",
    format: "PDF",
    icon: FileText,
    fileSlug: "reporte-visual",
    prepareMs: 7000,
  },
  {
    kind: "xlsx",
    title: "Resultados generales (XLSX)",
    description: "Data completa de resultados con todos los niveles de análisis",
    format: "XLSX",
    icon: FileSpreadsheet,
    fileSlug: "resultados-generales",
    prepareMs: 5500,
  },
  {
    kind: "comments",
    title: "Comentarios (XLSX)",
    description: "Respuestas abiertas con su pregunta, sentimiento y segmento",
    format: "XLSX",
    icon: MessageSquareText,
    fileSlug: "comentarios",
    prepareMs: 3000,
  },
  {
    kind: "questions-csv",
    title: "Preguntas (XLSX)",
    description: "Resultados por pregunta: n, puntaje, favorabilidad y distribución",
    format: "XLSX",
    icon: Table2,
    fileSlug: "preguntas",
    prepareMs: 2500,
  },
  {
    kind: "answers-csv",
    title: "Respuestas (XLSX)",
    description: "Una fila por respuesta individual, siempre anonimizada",
    format: "XLSX",
    icon: FileType2,
    fileSlug: "respuestas",
    prepareMs: 4000,
  },
];

export const reportTypeFor = (kind: ReportKind): ReportTypeDefinition =>
  REPORT_TYPES.find((candidate) => candidate.kind === kind) ?? REPORT_TYPES[0];

/** One entry of the "Descargas" list and the floating widget. */
export interface DownloadEntry {
  id: string;
  kind: ReportKind;
  fileName: string;
  format: "PDF" | "XLSX";
  status: "preparing" | "ready";
  /** 0–100 while `preparing`; pinned at 100 once `ready`. */
  progress: number;
  startedAt: number;
  /**
   * True once the file actually reached the browser. Delivery is automatic when
   * the preparation ends, so this is normally `true` the moment `status` turns
   * `ready` — it only stays `false` when the browser refused the handoff (a
   * blocked popup for the PDF print view), which is what surfaces "Reintentar".
   */
  delivered: boolean;
  /** Generates and hands the actual file to the browser. `false` when it failed. */
  deliver: () => boolean;
}
