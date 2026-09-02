/**
 * Redacción con IA para los mensajes de bienvenida y cierre.
 *
 * Mismo contrato que `aiQuestionWording.ts`: no hay modelo detrás todavía,
 * pero entra el HTML que ya esté en el editor y sale HTML mejorado, así que
 * el día que haya un endpoint real solo cambia el cuerpo de esta función.
 *
 * A diferencia del enunciado de una pregunta, esto es un párrafo — no se le
 * fuerza signo de interrogación ni se recorta a la primera frase.
 */

export type PageMessageKind = "welcome" | "closing";

/** Cuánto tarda la IA en responder. Lo justo para que el trabajo se note. */
export const AI_PAGE_WORDING_MS = 1100;

/** Muletillas que alargan el mensaje sin decir nada. */
const FILLERS: readonly RegExp[] = [
  /\bpor favor\b/gi,
  /\ben general\b/gi,
  /\bde alguna manera\b/gi,
  /\brealmente\b/gi,
  /\bbastante\b/gi,
  /\bcomo ya sabes\b/gi,
];

const ARTICLE = String.raw`(?:\b(?:el|la|los|las)\s+)?`;
const plain = (term: string): RegExp => new RegExp(`${ARTICLE}\\b${term}\\b`, "gi");

/** Jerga corporativa y su equivalente en palabras que cualquiera entiende. */
const PLAIN_WORDS: readonly [RegExp, string][] = [
  [plain("stakeholders?"), "las personas involucradas"],
  [plain("feedback"), "la retroalimentación"],
  [plain("engagement"), "el compromiso"],
  [plain("workflows?"), "los procesos"],
  [/\b(?:nuestra|esta)\s+organización\b/gi, "la empresa"],
];

const DEFAULT_MESSAGE: Readonly<Record<PageMessageKind, string>> = {
  welcome:
    "Gracias por tomarte un momento para responder esta encuesta. Tu opinión nos ayuda a mejorar y solo toma unos minutos. Tus respuestas se tratan de forma confidencial.",
  closing:
    "¡Gracias por completar la encuesta! Tus respuestas ya quedaron registradas y nos ayudarán a tomar mejores decisiones. Pronto compartiremos los resultados y los próximos pasos.",
};

/** Quita las etiquetas HTML del editor y deja el texto plano que hay detrás. */
function stripHtml(html: string): string {
  return html
    .replace(/<(p|div|br|li)[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Deja un solo espacio entre palabras y ninguno antes de la puntuación. */
function tidy(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .trim();
}

function capitalizeSentences(text: string): string {
  return text.replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
}

function applyPairs(text: string, pairs: readonly [RegExp, string][]): string {
  return pairs.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

/**
 * Mejora la redacción de un mensaje de bienvenida o cierre.
 *
 * Campo vacío → propone un mensaje base para ese tipo de página. Campo con
 * texto → limpia muletillas y jerga, y deja la puntuación y mayúsculas
 * correctas, sin tocar qué dice.
 */
export async function refinePageMessage(html: string, kind: PageMessageKind): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, AI_PAGE_WORDING_MS));

  const plainText = tidy(stripHtml(html));

  if (plainText === "") {
    return `<p>${DEFAULT_MESSAGE[kind]}</p>`;
  }

  let text = plainText;
  for (const filler of FILLERS) text = text.replace(filler, "");
  text = applyPairs(text, PLAIN_WORDS);
  text = capitalizeSentences(tidy(text));

  return `<p>${escapeHtml(text)}</p>`;
}
