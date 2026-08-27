import * as XLSX from "xlsx";
import { MIN_OPTIONS, buildOption, buildQuestion, hasOptions } from "./questionCatalog";
import {
  MAX_SECTION_DEPTH,
  type QuestionType,
  type SurveyQuestion,
  type SurveySection,
} from "./surveyBuilderTypes";

/**
 * Importación de secciones y preguntas desde un archivo.
 *
 * Formatos realmente parseados:
 *   - Markdown / texto plano  (.md, .markdown, .txt): los encabezados `#`, `##`
 *     y `###` definen sección, subsección y sub-subsección; las líneas con viñeta
 *     son preguntas; las viñetas indentadas debajo de una pregunta son sus opciones.
 *   - CSV / XLSX (.csv, .xlsx): columnas `seccion`, `subseccion`, `subsubseccion`,
 *     `pregunta`, `tipo` y `opciones` (opciones separadas por `|`).
 *
 * PDF y Word son binarios y se descartan con un mensaje claro antes de llegar al
 * parser — la lista `accept` de la zona de carga los rechaza por extensión.
 *
 * El árbol importado se convierte a `SurveySection[]` respetando las reglas del
 * constructor: nivel 1 es contenedor (las preguntas que lleguen directo bajo un
 * `#` se reagrupan en una subsección automática) y nunca se supera
 * `MAX_SECTION_DEPTH`.
 */

/** Extensiones que la zona de carga acepta para esta importación. */
export const SECTION_IMPORT_ACCEPT = ".md,.markdown,.txt,.csv,.xlsx";

export interface ImportedQuestion {
  statement: string;
  type: QuestionType;
  options: string[];
}

export interface ImportedSection {
  title: string;
  description: string;
  questions: ImportedQuestion[];
  children: ImportedSection[];
}

export interface SectionImportSummary {
  /** Secciones de nivel 1. */
  sections: number;
  /** Subsecciones de nivel 2 y sub-subsecciones de nivel 3. */
  subsections: number;
  questions: number;
}

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const TYPE_BY_LABEL: Readonly<Record<string, QuestionType>> = {
  escala: "scale",
  scale: "scale",
  likert: "scale",
  abierta: "open",
  open: "open",
  texto: "open",
  text: "open",
  "opcion unica": "single",
  unica: "single",
  single: "single",
  multiple: "multiple",
  multi: "multiple",
  desplegable: "dropdown",
  dropdown: "dropdown",
  select: "dropdown",
};

/** Resuelve un tipo desde su etiqueta textual; sin coincidencia → escala. */
function typeFromText(value: string): QuestionType {
  const key = normalize(value);
  return TYPE_BY_LABEL[key] ?? "scale";
}

/** `"A | B | C"` → `["A", "B", "C"]` (también acepta `;`). */
function splitOptions(value: string): string[] {
  return value
    .split(/[|;]/)
    .map((option) => option.trim())
    .filter((option) => option !== "");
}

/**
 * Lee un archivo de secciones y devuelve el árbol importado. Lanza si los bytes
 * no pueden leerse como el formato que su extensión promete (archivo corrupto).
 */
export async function parseSectionFile(file: File): Promise<ImportedSection[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "md" || ext === "markdown" || ext === "txt") {
    return parseMarkdown(await file.text());
  }
  if (ext === "csv" || ext === "xlsx" || ext === "xls") {
    return parseTabular(await file.arrayBuffer());
  }
  throw new Error("Formato no soportado");
}

/**
 * Parser Markdown / texto plano.
 *
 *   - `#`  → sección (nivel 1)
 *   - `##` → subsección (nivel 2)
 *   - `###`→ sub-subsección (nivel 3); encabezados más profundos se clavan en 3
 *   - un párrafo pegado al encabezado es la descripción de la sección
 *   - una viñeta (`-`, `*`, `1.`) es una pregunta
 *   - viñetas indentadas debajo de una pregunta son sus opciones
 *   - el tipo se marca al final con `[escala]`, `[abierta]`, `[opción única]`,
 *     `[múltiple]`, `[desplegable]`; sin etiqueta → escala
 */
export function parseMarkdown(text: string): ImportedSection[] {
  const roots: ImportedSection[] = [];
  /** Ruta de secciones abiertas: index 0 = sección actual, etc. */
  const stack: ImportedSection[] = [];
  let currentQuestion: ImportedQuestion | null = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "") continue;

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const depth = Math.min(heading[1].length, MAX_SECTION_DEPTH);
      const section: ImportedSection = {
        title: heading[2].trim(),
        description: "",
        questions: [],
        children: [],
      };
      while (stack.length >= depth) stack.pop();
      if (stack.length === 0) roots.push(section);
      else stack[stack.length - 1].children.push(section);
      stack.push(section);
      currentQuestion = null;
      continue;
    }

    const list = /^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/.exec(raw);
    if (list) {
      const [, indentRaw, contentRaw] = list;
      const indent = indentRaw.length;
      const content = contentRaw.trim();

      // Viñeta indentada bajo una pregunta → opción de esa pregunta.
      if (currentQuestion !== null && indent > 0) {
        currentQuestion.options.push(content);
        continue;
      }

      const type = trailingType(content);
      currentQuestion = { statement: stripTrailingType(content), type, options: [] };
      const target = stack[stack.length - 1];
      if (target) target.questions.push(currentQuestion);
      continue;
    }

    // Párrafo suelto: primera línea tras el encabezado es la descripción.
    if (stack.length > 0 && stack[stack.length - 1].description === "") {
      stack[stack.length - 1].description = line;
    }
  }

  return roots;
}

/** Tipo declarado por una etiqueta `[...]` al final de la línea, o escala. */
function trailingType(line: string): QuestionType {
  const match = /\[([^\]]+)\]\s*$/.exec(line);
  if (!match) return "scale";
  const key = normalize(match[1]);
  return TYPE_BY_LABEL[key] ?? "scale";
}

/** Quita la etiqueta `[tipo]` final y limpia la puntuación sobrante. */
function stripTrailingType(line: string): string {
  return line.replace(/\s*\[([^\]]+)\]\s*$/, "").trim();
}

/**
 * Parser CSV / XLSX. SheetJS lee ambos igual, por bytes. Se esperan las columnas
 * `seccion`, `subseccion`, `subsubseccion`, `pregunta`, `tipo`, `opciones`;
 * los títulos de sección se reutilizan mientras se repitan, así que cada fila
 * solo declara el nivel que cambia.
 */
export function parseTabular(buffer: ArrayBuffer): ImportedSection[] {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const [header, ...body] = rows;
  if (!header) return [];

  const column = (name: string) => header.findIndex((h) => normalize(String(h)) === name);
  const seccionAt = column("seccion");
  const subAt = column("subseccion");
  const subsubAt = column("subsubseccion");
  const preguntaAt = column("pregunta");
  const tipoAt = column("tipo");
  const opcionesAt = column("opciones");

  const value = (row: unknown[], at: number): string =>
    at >= 0 ? String(row[at] ?? "").trim() : "";

  const roots: ImportedSection[] = [];
  let currentRoot: ImportedSection | null = null;
  let currentSub: ImportedSection | null = null;
  let currentSubsub: ImportedSection | null = null;

  for (const row of body) {
    const seccionTitle = value(row, seccionAt);
    const subTitle = value(row, subAt);
    const subsubTitle = value(row, subsubAt);
    const statement = value(row, preguntaAt);

    if (seccionTitle && (currentRoot === null || currentRoot.title !== seccionTitle)) {
      currentRoot = { title: seccionTitle, description: "", questions: [], children: [] };
      roots.push(currentRoot);
      currentSub = null;
      currentSubsub = null;
    }
    if (currentRoot) {
      if (subTitle) {
        if (!currentSub || currentSub.title !== subTitle) {
          currentSub = { title: subTitle, description: "", questions: [], children: [] };
          currentRoot.children.push(currentSub);
        }
        if (subsubTitle) {
          if (!currentSubsub || currentSubsub.title !== subsubTitle) {
            currentSubsub = { title: subsubTitle, description: "", questions: [], children: [] };
            currentSub.children.push(currentSubsub);
          }
        } else {
          currentSubsub = null;
        }
      } else {
        currentSub = null;
        currentSubsub = null;
      }

      if (statement) {
        const question: ImportedQuestion = {
          statement,
          type: tipoAt >= 0 ? typeFromText(String(row[tipoAt] ?? "")) : "scale",
          options: opcionesAt >= 0 ? splitOptions(String(row[opcionesAt] ?? "")) : [],
        };
        const target = currentSubsub ?? currentSub ?? currentRoot;
        target.questions.push(question);
      }
    }
  }

  return roots;
}

/** Resumen del árbol importado, para el estado de éxito. */
export function summarizeImported(imported: readonly ImportedSection[]): SectionImportSummary {
  let subsections = 0;
  let questions = 0;
  const walk = (nodes: readonly ImportedSection[], depth: number): void => {
    for (const node of nodes) {
      if (depth >= 2) subsections += 1;
      questions += node.questions.length;
      walk(node.children, depth + 1);
    }
  };
  walk(imported, 1);
  return { sections: imported.length, subsections, questions };
}

/**
 * Convierte el árbol importado en secciones del constructor. Nivel 1 no lleva
 * preguntas, así que cualquier pregunta que llegue directo bajo un `#` se
 * reagrupa en una subsección automática, como hace la propia pantalla.
 */
export function importedToSections(imported: readonly ImportedSection[]): SurveySection[] {
  return imported.map((node) => buildImportedSection(node, 1));
}

function buildImportedSection(node: ImportedSection, depth: number): SurveySection {
  const ownQuestions: SurveyQuestion[] =
    depth >= 2 ? node.questions.map(buildImportedQuestion) : [];

  // Nivel 1 no lleva preguntas propias: las que lleguen directo se reagrupan en
  // una subsección automática "Preguntas", como hace la propia pantalla.
  const autoGroup: SurveySection[] =
    depth === 1 && node.questions.length > 0
      ? [
          {
            id: `section-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
            title: "Preguntas",
            description: "",
            questions: node.questions.map(buildImportedQuestion),
            children: [],
          },
        ]
      : [];

  const nested: SurveySection[] =
    depth < MAX_SECTION_DEPTH
      ? node.children.map((child) => buildImportedSection(child, depth + 1))
      : [];

  return {
    id: `section-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
    title: node.title,
    description: node.description,
    questions: ownQuestions,
    children: [...autoGroup, ...nested],
  };
}

function buildImportedQuestion(question: ImportedQuestion): SurveyQuestion {
  const provided = question.options.map((label) => buildOption(label));
  const options =
    hasOptions(question.type) && provided.length < MIN_OPTIONS
      ? [...provided, ...Array.from({ length: MIN_OPTIONS - provided.length }, () => buildOption())]
      : provided;

  return buildQuestion({
    statement: question.statement,
    type: question.type,
    options,
  });
}
