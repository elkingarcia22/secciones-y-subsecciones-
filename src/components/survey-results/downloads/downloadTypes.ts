import type { LucideIcon } from "lucide-react";
import { FileSpreadsheet, FileText, FileType2, MessageSquareText, Table2 } from "lucide-react";
import type { Sentiment } from "@/mocks/questionResponses";
import type { SegmentFilter } from "@/mocks/surveyResults";

/** Every report the download center can produce. */
export type ReportKind = "pdf" | "xlsx" | "comments" | "questions-csv" | "answers-csv";

/**
 * Las secciones del reporte general, en el orden en que se imprimen.
 *
 * El orden es fijo — responde la secuencia de preguntas que se hace quien lee —
 * pero cada sección se puede apagar. Lo que no cambia es la numeración relativa:
 * las que sobreviven se renumeran, así que un reporte de siete secciones nunca
 * salta del 3 al 5.
 *
 * El documento alterna dos clases de sección. Las generales — verificación,
 * favorabilidad por secciones, análisis IA — son la lectura de la encuesta
 * completa y salen iguales para todo lector: es contra ellas que se leen los
 * cortes. Las configurables despliegan los demográficos que el lector eligió, y
 * cada una elige los suyos: el comité de gente corta por área y el de operación
 * por sede sin pelearse por un único selector.
 */
export type PdfSectionId =
  | "verification"
  | "participation"
  | "sections"
  | "heatmap"
  | "questions"
  | "nps"
  | "gaps"
  | "ai";

/** Los bloques que despliegan demográficos, cada uno con su propia selección. */
export type PdfSegmentSlot = "participation" | "heatmap" | "nps" | "gaps";

export interface PdfSectionDefinition {
  id: PdfSectionId;
  label: string;
  description: string;
  /** El bloque abre un multi-select de demográficos con esta llave. */
  segmentSlot?: PdfSegmentSlot;
  /** El bloque abre un multi-select de secciones de la encuesta. */
  picksSections?: boolean;
  /** Rótulo sobre el selector, cuando el bloque tiene uno. */
  pickerLabel?: string;
  /**
   * Qué pasa si el lector deja el selector vacío. No es el mismo destino para
   * todos: participación y eNPS conservan su lectura general, mientras que
   * heatmap y brechas no existen sin un corte, así que el panel tiene que decir
   * cuál de los dos es antes de que el lector descargue.
   */
  pickerEmptyHint?: string;
  needsSegments?: boolean;
  needsNps?: boolean;
}

export const PDF_SECTIONS: readonly PdfSectionDefinition[] = [
  {
    id: "verification",
    label: "Verificación de la medición",
    description: "Las cuatro cifras que dicen si la medición se sostiene",
  },
  {
    id: "participation",
    label: "Participación",
    description: "Cobertura general y, si eliges demográficos, grupo por grupo",
    segmentSlot: "participation",
    pickerLabel: "Desglosar por",
    pickerEmptyHint: "Sin demográficos solo se imprime la cobertura general.",
  },
  {
    id: "sections",
    label: "Favorabilidad por secciones",
    description: "Todas las secciones y subsecciones, con su mezcla y su porcentaje",
  },
  {
    id: "heatmap",
    label: "Heatmap por demográficos",
    description: "La misma grilla de la herramienta, por los demográficos que elijas",
    segmentSlot: "heatmap",
    pickerLabel: "Una grilla por cada",
    pickerEmptyHint: "Elige al menos un demográfico o este bloque no se imprime.",
    needsSegments: true,
  },
  {
    id: "questions",
    label: "Detalle de preguntas",
    description: "Pregunta por pregunta de las secciones que elijas",
    picksSections: true,
    pickerLabel: "Secciones a incluir",
    pickerEmptyHint: "Elige al menos una sección o este bloque no se imprime.",
  },
  {
    id: "nps",
    label: "eNPS",
    description: "Puntaje, mezcla, desglose por secciones y por los demográficos que elijas",
    segmentSlot: "nps",
    pickerLabel: "Desglosar además por",
    pickerEmptyHint: "Sin demográficos solo se imprime el puntaje y el desglose por secciones.",
    needsNps: true,
  },
  {
    id: "gaps",
    label: "Brechas entre grupos",
    description: "Mayor polarización y grupos rezagados, por demográfico",
    segmentSlot: "gaps",
    pickerLabel: "Buscar brechas por",
    pickerEmptyHint: "Elige al menos un demográfico o este bloque no se imprime.",
    needsSegments: true,
  },
  {
    id: "ai",
    label: "Análisis de IA",
    description: "Resumen, hallazgos, riesgos y recomendaciones con su evidencia",
  },
];

/**
 * Demográficos cuyos grupos son personas con nombre.
 *
 * Un PDF viaja por correo y no tiene control de acceso: desplegar resultados
 * por líder en un archivo expone a personas identificables en grupos pequeños.
 * El corte existe — vive en la herramienta y en el XLSX, con su umbral — pero no
 * viaja en el ejecutivo.
 */
export const PERSON_NAMED_SEGMENT_KEYS: readonly string[] = ["leader"];

/**
 * La clave de catálogo detrás de la clave del segmento.
 *
 * Un demográfico del catálogo viaja con su clave tal cual ("area"); uno que la
 * plataforma construye contra el directorio — Líder, Colaborador — no tiene
 * entrada de catálogo y termina identificado por el id del campo
 * ("cultura-2026-dem-leader"). Ambos nombran lo mismo, así que la comparación
 * se hace sobre el último tramo.
 */
const catalogKeyOf = (key: string): string => key.split("-dem-").pop() ?? key;

/** Los demográficos que el reporte ejecutivo puede leer y desplegar. */
export const reportableSegments = <T extends { key: string; perPerson: boolean }>(
  segments: readonly T[]
): readonly T[] =>
  segments.filter(
    (segment) =>
      !segment.perPerson && !PERSON_NAMED_SEGMENT_KEYS.includes(catalogKeyOf(segment.key))
  );

/**
 * Hojas que el libro "Resultados generales" puede incluir o dejar fuera.
 *
 * Las tres que terminan en `-by` no son una hoja sino una tanda: producen una
 * hoja por cada demográfico elegido. Están en la lista igual que las demás
 * porque para quien configura son lo mismo — contenido que entra o no entra —
 * y porque así el panel puede enumerarlas en el orden real de las pestañas.
 */
export type XlsxSheetId =
  | "summary"
  | "demographics"
  | "sections"
  | "questions"
  | "question-detail"
  | "nps"
  | "participation-by"
  | "heatmap-by"
  | "nps-by"
  | "depth"
  | "ai";

/** Las tandas del libro que se despliegan por demográfico. */
export type XlsxSegmentSlot = "participation" | "heatmap" | "nps";

export interface XlsxSheetDefinition {
  id: XlsxSheetId;
  label: string;
  description: string;
  /** La hoja abre un multi-select de demográficos con esta llave. */
  segmentSlot?: XlsxSegmentSlot;
  /** Rótulo sobre el selector, cuando la hoja tiene uno. */
  pickerLabel?: string;
  /** Qué pasa si el lector deja el selector vacío. */
  pickerEmptyHint?: string;
  /** Sheets that only make sense when the survey collected demographics. */
  needsSegments?: boolean;
  /** Sheets that only make sense when the survey asked an NPS question. */
  needsNps?: boolean;
  /** Sheets that only make sense when some question asks a follow-up. */
  needsDepth?: boolean;
}

export const XLSX_SHEETS: readonly XlsxSheetDefinition[] = [
  {
    id: "summary",
    label: "Resumen",
    description: "La pestaña Resumen completa: indicadores, lectura ejecutiva, prioridades, fortalezas, brechas y voz",
  },
  {
    id: "demographics",
    label: "Demográficos",
    description: "Los demográficos que usó la encuesta, con sus grupos y participación",
    needsSegments: true,
  },
  { id: "sections", label: "Secciones", description: "Puntaje y favorabilidad de cada sección" },
  { id: "questions", label: "Preguntas", description: "Una fila por pregunta con su distribución 1 a 5" },
  {
    id: "question-detail",
    label: "Detalle de preguntas",
    description: "Conteo y porcentaje de cada opción de respuesta, en todos los formatos",
  },
  { id: "nps", label: "eNPS", description: "Puntaje, mezcla y detalle por dimensión y pregunta", needsNps: true },
  {
    id: "participation-by",
    label: "Participación por demográficos",
    description: "Una hoja de participación por cada demográfico elegido",
    segmentSlot: "participation",
    pickerLabel: "Una hoja por cada",
    pickerEmptyHint: "Elige al menos un demográfico o estas hojas no se generan.",
    needsSegments: true,
  },
  {
    id: "heatmap-by",
    label: "Heatmaps por demográficos",
    description: "Una hoja de heatmap por cada demográfico elegido",
    segmentSlot: "heatmap",
    pickerLabel: "Una hoja por cada",
    pickerEmptyHint: "Elige al menos un demográfico o estas hojas no se generan.",
    needsSegments: true,
  },
  {
    id: "nps-by",
    label: "eNPS por demográficos",
    description: "Una hoja de eNPS por cada demográfico elegido",
    segmentSlot: "nps",
    pickerLabel: "Una hoja por cada",
    pickerEmptyHint: "Elige al menos un demográfico o estas hojas no se generan.",
    needsSegments: true,
    needsNps: true,
  },
  {
    id: "depth",
    label: "Preguntas de profundidad",
    description: "Las respuestas abiertas de cada banda, con su cobertura y su sección",
    needsDepth: true,
  },
  { id: "ai", label: "Análisis IA", description: "Resumen, hallazgos, riesgos y acciones sugeridas" },
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
  /** XLSX: demographics to expand into "eNPS por …" sheets. */
  npsSegments: readonly string[];
  /** XLSX: which sheets print, in `XLSX_SHEETS` order. */
  xlsxSheets: readonly XlsxSheetId[];
  /** PDF: las secciones que se imprimen, en el orden de `PDF_SECTIONS`. */
  pdfSections: readonly PdfSectionId[];
  /**
   * PDF: los demográficos que despliega cada bloque configurable.
   *
   * Uno por bloque y no uno global: participación se lee por la unidad que
   * convoca — sede, contrato — y el heatmap por la unidad donde se actúa, y
   * obligarlas al mismo corte convierte una de las dos en relleno.
   */
  pdfSegments: Readonly<Record<PdfSegmentSlot, readonly string[]>>;
  /**
   * PDF: las secciones de la encuesta cuyo detalle de preguntas se imprime.
   * Vacío significa ninguna, y entonces el bloque no sale: el panel arranca con
   * todas marcadas, así que llegar aquí sin ninguna es una decisión del lector.
   */
  pdfQuestionSections: readonly string[];
  /** Comentarios: which sentiments make it into the file. All three = todos. */
  commentSentiments: readonly Sentiment[];
  /**
   * Comentarios: the themes that make it into the file. Empty means every
   * theme — a survey can pick up a new one between measurements, and a report
   * that silently dropped it would be worse than one that grew a row.
   */
  commentTopics: readonly string[];
  /**
   * Narrow the population to one or more values of a single demographic —
   * every entry shares the same `key`. Empty means everyone.
   */
  filters: readonly SegmentFilter[];
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
    title: "Reporte general (PDF)",
    description: "Reporte visual con favorabilidad, heatmaps, eNPS, brechas y análisis IA",
    format: "PDF",
    icon: FileText,
    fileSlug: "reporte-general",
    prepareMs: 7000,
  },
  {
    kind: "xlsx",
    title: "Resultados generales (XLSX)",
    description: "Data completa: secciones, preguntas, eNPS, heatmaps y análisis IA",
    format: "XLSX",
    icon: FileSpreadsheet,
    fileSlug: "resultados-generales",
    prepareMs: 5500,
  },
  {
    kind: "comments",
    title: "Comentarios (XLSX)",
    description: "Respuestas abiertas con su pregunta, tema, sentimiento y segmento",
    format: "XLSX",
    icon: MessageSquareText,
    fileSlug: "comentarios",
    prepareMs: 3000,
  },
  {
    kind: "questions-csv",
    title: "Preguntas (XLSX)",
    description: "Una hoja por pregunta con todas las respuestas que recibió",
    format: "XLSX",
    icon: Table2,
    fileSlug: "preguntas",
    prepareMs: 2500,
  },
  {
    kind: "answers-csv",
    title: "Respuestas (XLSX)",
    description: "Una fila por participante con todo lo que respondió",
    format: "XLSX",
    icon: FileType2,
    fileSlug: "respuestas",
    prepareMs: 4000,
  },
];

export const reportTypeFor = (kind: ReportKind): ReportTypeDefinition =>
  REPORT_TYPES.find((candidate) => candidate.kind === kind) ?? REPORT_TYPES[0];

/**
 * What a report card promises, read off the survey rather than fixed in the
 * catalogue. Anonymity is a setting of the measurement, not a property of the
 * file: the same "Respuestas" export carries names on a public survey and a
 * numbered participant on an anonymous one, so the copy that promises either
 * has to follow the draft.
 */
export const reportDescriptionFor = (kind: ReportKind, isAnonymous: boolean): string => {
  if (kind === "answers-csv") {
    return isAnonymous
      ? "Una fila por participante con todo lo que respondió, sin identidad"
      : "Una fila por participante con su identidad y todo lo que respondió";
  }
  return reportTypeFor(kind).description;
};

/** The long explanation the configuration panel shows for a report. */
export const reportDetailFor = (kind: ReportKind, isAnonymous: boolean): string => {
  if (kind === "questions-csv") {
    return isAnonymous
      ? "Una hoja de resumen y, después, una hoja por pregunta: su distribución y una fila por cada respuesta que recibió, con la escala de colores del reporte. Los participantes van numerados: la encuesta es anónima."
      : "Una hoja de resumen y, después, una hoja por pregunta: su distribución y una fila por cada respuesta que recibió, con quién la dio y sus demográficos.";
  }
  return isAnonymous
    ? "Una hoja con una fila por participante y una columna por pregunta, coloreada por la escala 1 a 5. Sin identidad ni demográficos: la encuesta es anónima."
    : "Una hoja con una fila por participante y una columna por pregunta, coloreada por la escala 1 a 5, con su identidad y sus demográficos: la encuesta no es anónima.";
};

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
  /** The configuration used to build the file, so it can be shown in details. */
  request: ReportRequest;
}
