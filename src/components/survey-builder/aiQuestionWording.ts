/**
 * Redacción de una pregunta con IA.
 *
 * No hay modelo detrás todavía: el contrato es lo que importa. Entra una
 * frase —lo que el autor tenga escrito, o una línea de contexto cuando no
 * tiene nada— y sale un enunciado válido para el catálogo. Cuando haya un
 * endpoint real, se cambia el cuerpo de estas dos funciones y nada más:
 * quien las llama ya trata la respuesta como asíncrona.
 *
 * El resto del archivo es el banco de atajos. Son textos deliberadamente
 * cortos: el autor los lee de un vistazo mientras mira su pregunta, no son
 * instrucciones que haya que estudiar.
 */

import { buildQuestion, changeQuestionType } from "./questionCatalog";
import type { QuestionType, SurveyQuestion } from "./surveyBuilderTypes";

/** Cuánto tarda la IA en responder. Lo justo para que el trabajo se note. */
export const AI_WORDING_MS = 1100;

/**
 * Los atajos de "mejorar", en una palabra o dos.
 *
 * Cada uno es una intención distinta sobre el mismo texto, no un grado de la
 * misma: acortar y neutralizar no compiten, así que el autor puede pedir uno,
 * ver el resultado y pedir otro encima.
 */
export interface WordingShortcut {
  id: RefineIntent;
  label: string;
}

export type RefineIntent = "shorter" | "clearer" | "neutral" | "closer";

export const WORDING_SHORTCUTS: readonly WordingShortcut[] = [
  { id: "shorter", label: "Más corta" },
  { id: "clearer", label: "Más clara" },
  { id: "neutral", label: "Más neutral" },
  { id: "closer", label: "Tono cercano" },
];

/** Muletillas que alargan la pregunta sin decir nada. */
const FILLERS: readonly RegExp[] = [
  /\bpor favor\b/gi,
  /\ben general\b/gi,
  /\bde alguna manera\b/gi,
  /\ben tu opinión,?\s*/gi,
  /\bconsideras que\b/gi,
  /\bcrees que\b/gi,
  /\bdirías que\b/gi,
  /\bun poco\b/gi,
  /\brealmente\b/gi,
  /\bbastante\b/gi,
];

/**
 * Jerga corporativa y su equivalente en palabras que cualquiera entiende.
 *
 * El patrón se come el artículo que venga delante y la traducción trae el
 * suyo: el género no se conserva al traducir —"el feedback" es "la
 * retroalimentación"— así que dejar el original produciría "el la
 * retroalimentación".
 */
const ARTICLE = String.raw`(?:\b(?:el|la|los|las)\s+)?`;
const plain = (term: string): RegExp => new RegExp(`${ARTICLE}\\b${term}\\b`, "gi");

const PLAIN_WORDS: readonly [RegExp, string][] = [
  [plain("stakeholders?"), "las personas involucradas"],
  [plain("onboarding"), "el proceso de ingreso"],
  [plain("feedback"), "la retroalimentación"],
  [plain("engagement"), "el compromiso"],
  [plain("performance"), "el desempeño"],
  [plain("workflows?"), "los procesos"],
  [plain("empowerment"), "la autonomía"],
  [plain("skills?"), "las habilidades"],
  [plain("mindset"), "la forma de pensar"],
  [plain("leadership"), "el liderazgo"],
  [/\b(?:nuestra|esta)\s+organización\b/gi, "la empresa"],
];

/**
 * Lo que mete la respuesta dentro de la pregunta.
 *
 * Dos casos distintos: el encuadre que da por hecha la respuesta se borra
 * entero, y el adjetivo con carga se cambia por uno neutro en vez de
 * quitarse —"es excelente" sin adjetivo dejaría "es", que no es una frase—.
 */
const LOADED_WORDS: readonly [RegExp, string][] = [
  [/\bobviamente\b/gi, ""],
  [/\bclaramente\b/gi, ""],
  [/\bsin duda\b/gi, ""],
  [/\bno crees que\b/gi, ""],
  [/\bverdad que\b/gi, ""],
  // Los reemplazos son adjetivos sin género a propósito: "excelente" vale
  // para masculino y femenino, y cambiarlo por "adecuado" rompería la
  // concordancia en cuanto el sujeto sea femenino.
  [/\b(?:excelentes|magníficos|magníficas)\b/gi, "aceptables"],
  [/\b(?:excelente|magnífico|magnífica)\b/gi, "aceptable"],
  [/\b(?:terribles|pésimos|pésimas)\b/gi, "insuficientes"],
  [/\b(?:terrible|pésimo|pésima)\b/gi, "insuficiente"],
];

/**
 * Formas de "usted" que el producto no usa: aquí se habla de tú.
 *
 * "Usted" arrastra el verbo: cambiarlo solo a él deja "tú recibe". El patrón
 * se lleva por delante el verbo que venga detrás y lo conjuga en la función
 * de abajo, porque la terminación depende de la palabra y no se puede
 * escribir como reemplazo fijo.
 */
const CLOSER_FORMS: readonly [RegExp, string][] = [
  [/\bse\s+siente\b/gi, "te sientes"],
  [/\ble\s+parece\b/gi, "te parece"],
  [/\bel\s+colaborador\b/gi, "tú"],
  [/\bsus\s+/gi, "tus "],
  [/\bsu\s+/gi, "tu "],
];

/**
 * Los verbos que acompañan a "usted" en una pregunta de encuesta.
 *
 * Es una lista cerrada y no una regla de conjugación porque el español no se
 * conjuga con una expresión regular: añadir una "s" al final acierta con
 * "recibe→recibes" y destroza todo lo demás —"sobre" se convertiría en
 * "sobres" y "acuerdo" en "acuerdos"—. Lo que no esté aquí se queda como
 * está, que es el único error que no empeora la frase.
 */
const SECOND_PERSON_VERBS: Readonly<Record<string, string>> = {
  esta: "estas",
  está: "estás",
  recibe: "recibes",
  siente: "sientes",
  tiene: "tienes",
  considera: "consideras",
  valora: "valoras",
  percibe: "percibes",
  cree: "crees",
  piensa: "piensas",
  puede: "puedes",
  sabe: "sabes",
  conoce: "conoces",
  trabaja: "trabajas",
  participa: "participas",
  recomienda: "recomiendas",
  dispone: "dispones",
  cuenta: "cuentas",
  necesita: "necesitas",
  hace: "haces",
};

const conjugated = (verb: string): string | null =>
  SECOND_PERSON_VERBS[verb.toLowerCase()] ?? null;

/**
 * Pasa el trato de usted a tú.
 *
 * El pronombre solo no basta: "usted" arrastra su verbo, y cambiar uno sin el
 * otro deja "tú recibe". Se resuelven los dos órdenes en que aparece —"usted
 * recibe" y la pregunta invertida "¿…está usted…?"— y en la invertida el
 * pronombre desaparece, porque el verbo conjugado ya dice de quién se habla y
 * "¿estás tú…?" suena forzado.
 */
function toSecondPerson(text: string): string {
  return (
    text
      .replace(/\b([a-záéíóúñ]+)\s+usted\b/gi, (match, verb: string) => {
        const next = conjugated(verb);
        return next === null ? match : next;
      })
      .replace(/\busted\s+([a-záéíóúñ]+)\b/gi, (match, verb: string) => {
        const next = conjugated(verb);
        return next === null ? match : `tú ${next}`;
      })
      // "con usted" tiene su propia forma en español y no es "con tú".
      .replace(/\bcon\s+usted\b/gi, "contigo")
      // Lo que quede suelto, sin verbo reconocible al lado, se cae: en
      // español el sujeto se omite, y "de acuerdo tú" no es una frase
      // mientras "de acuerdo con las decisiones" sí.
      .replace(/\busted\b/gi, "")
  );
}

/** Deja un solo espacio entre palabras y ninguno antes de la puntuación. */
function tidy(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/([¿¡])\s+/g, "$1")
    .trim();
}

/** Mayúscula inicial respetando la apertura de interrogación. */
function capitalize(text: string): string {
  if (text === "") return text;
  const opensQuestion = text.startsWith("¿") || text.startsWith("¡");
  const at = opensQuestion ? 1 : 0;
  return text.slice(0, at) + text.charAt(at).toUpperCase() + text.slice(at + 1);
}

/** Palabras con las que arranca una pregunta de verdad. */
const INTERROGATIVES =
  /^(qué|que|cómo|como|cuál|cual|cuándo|cuando|cuánto|cuanto|cuántos|cuantos|dónde|donde|por qué|porque|quién|quien|para qué|con qué|en qué|hasta qué punto|te |tú |tienes|sientes|recomendarías|consideras)/i;

/**
 * Cierra la puntuación según lo que el texto sea.
 *
 * Un enunciado de escala ("Mi jefe me da retroalimentación útil") no lleva
 * interrogación: no es una pregunta, es una afirmación con la que el
 * participante dice cuánto está de acuerdo. Poner "?" a la fuerza convertiría
 * media encuesta Likert en preguntas mal escritas.
 */
function punctuate(text: string): string {
  // La coma final entra también: quitar una muletilla de cierre ("…, por
  // favor?") deja la coma que la introducía colgando.
  const body = text
    .replace(/^[¿¡]+/, "")
    .replace(/[?!.]+$/, "")
    .replace(/[,;]+$/, "")
    .trim();
  if (body === "") return "";
  if (INTERROGATIVES.test(body)) return `¿${capitalize(body)}?`;
  return capitalize(body);
}

function applyPairs(text: string, pairs: readonly [RegExp, string][]): string {
  return pairs.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

/** Recorta a la oración principal: fuera lo que venga tras coma o "y además". */
function toCore(text: string): string {
  const withoutTail = text
    // La coma es opcional: "…es adecuado y además le ayuda" añade lo mismo
    // que "…es adecuado, y además le ayuda", y sobra igual.
    .replace(
      /\s*(?:[,;]\s*)?\b(?:y\s+)?(?:además|también|asimismo|por otro lado)\b[^.?]*/gi,
      ""
    )
    .replace(/\s*\([^)]*\)/g, "");
  const firstClause = withoutTail.split(/\s*[,;]\s+/)[0] ?? withoutTail;
  // Solo se corta si lo que queda sigue siendo una frase, no un muñón.
  return firstClause.split(/\s+/).length >= 4 ? firstClause : withoutTail;
}

/**
 * Mejora la redacción de un enunciado que ya existe.
 *
 * Nunca cambia qué se pregunta —eso lo decidió el autor— solo cómo está
 * dicho. Sin `intent` hace la limpieza de base: muletillas fuera, jerga
 * traducida, puntuación correcta.
 */
export async function refineQuestionWording(
  statement: string,
  intent?: RefineIntent
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, AI_WORDING_MS));

  let text = tidy(statement);
  if (text === "") return statement;

  // La limpieza de base va siempre: es lo que el autor espera de "mejorar"
  // aunque no haya pedido nada más concreto.
  text = FILLERS.reduce((acc, filler) => acc.replace(filler, " "), text);
  text = applyPairs(text, PLAIN_WORDS);

  switch (intent) {
    case "shorter":
      text = toCore(text);
      break;
    case "clearer":
      text = applyPairs(text, PLAIN_WORDS);
      text = text.replace(/\bno\s+(?:es|está)\s+in([a-záéíóúñ]+)/gi, "es $1");
      break;
    case "neutral":
      text = applyPairs(text, LOADED_WORDS);
      break;
    case "closer":
      // El verbo primero: una vez "usted" es "tú", ya no hay con qué saber
      // qué palabra había que conjugar.
      text = applyPairs(toSecondPerson(text), CLOSER_FORMS);
      break;
    default:
      break;
  }

  const result = punctuate(tidy(text));
  // Si la limpieza no dejó nada usable, mejor devolver lo que había que
  // vaciarle el campo al autor.
  return result === "" ? statement : result;
}

/** Lo que sale de una frase de contexto: una pregunta entera, no solo texto. */
export interface GeneratedQuestion {
  statement: string;
  type: QuestionType;
}

/** Pistas de que lo que se quiere medir es una opinión graduable. */
const SCALE_HINTS =
  /\b(satisfac|acuerdo|clima|ambiente|percep|opinión|conform|valorac|liderazgo|carga|estrés|bienestar|reconocimiento|comunicación|confianza)/i;
/** Pistas de que lo que se quiere es que cuenten algo con sus palabras. */
const OPEN_HINTS = /\b(por qué|sugerenc|comentar|propon|idea|mejorar|explic|cuéntanos|abierta)/i;
/** Pistas de que lo que se quiere es elegir de una lista. */
const CHOICE_HINTS = /\b(elegir|escoger|opcion|cuál de|lista|prefier|canal|modalidad|área)/i;

/**
 * Preámbulos que la plantilla ya dice por su cuenta.
 *
 * El autor escribe "la satisfacción con el liderazgo de su jefe" y la
 * plantilla de escala arranca con "Estoy satisfecho con": dejar el tema tal
 * cual produciría "Estoy satisfecho con la satisfacción con el liderazgo…".
 * Lo que hay que conservar es el asunto, no cómo pensaba medirlo.
 */
const TOPIC_PREAMBLES: readonly RegExp[] = [
  // El artículo se quita solo aquí, delante del sustantivo de medida: el que
  // acompaña al asunto en sí se queda, porque la plantilla lo necesita
  // ("con el liderazgo", no "con liderazgo").
  /^(?:la|el|los|las)\s+(?=(?:satisfacci[oó]n|percepci[oó]n|opini[oó]n|valoraci[oó]n|nivel|grado)\b)/i,
  /^(?:satisfacci[oó]n|percepci[oó]n|opini[oó]n|valoraci[oó]n)\s+(?:con|de|sobre|acerca de)\s+/i,
  // "sugerencias para mejorar X" dice qué tipo de pregunta quiere, no de qué
  // va: el asunto es X, y la plantilla de pregunta abierta ya pide la idea.
  /^(?:sugerencias?|ideas?|comentarios?|propuestas?)\s+(?:para|sobre|de)\s+(?:mejorar\s+)?/i,
  /^(?:nivel|grado)\s+de\s+(?:satisfacci[oó]n\s+(?:con|de)\s+)?/i,
  /^(?:qu[eé]\s+tan\s+\w+\s+(?:est[aá]n?|es|son)\s+)/i,
  /^(?:c[oó]mo\s+(?:se\s+)?(?:siente|perciben?|ven)\s+)/i,
];

/** Cómo se dirige la encuesta al participante: de tú, nunca en tercera persona. */
const TOPIC_PERSON: readonly [RegExp, string][] = [
  [/\bsu\s+/gi, "tu "],
  [/\bsus\s+/gi, "tus "],
  [/\bdel colaborador\b/gi, "tuyo"],
  [/\blos colaboradores\b/gi, "el equipo"],
];

/**
 * Reduce la frase de contexto al asunto que la plantilla va a envolver.
 *
 * Los preámbulos se quitan en cadena y no de una vez porque se encadenan:
 * "la satisfacción con el liderazgo" pierde primero el artículo, después el
 * "satisfacción con", y solo entonces queda "el liderazgo".
 */
function toTopic(context: string): string {
  let topic = tidy(context)
    .replace(
      /^(sobre|acerca de|una pregunta (?:sobre|de)|quiero (?:preguntar|medir|saber)( sobre| si| qu[eé])?)\s+/i,
      ""
    )
    .replace(/[.?!¿¡]+/g, "")
    .toLowerCase();

  for (const preamble of TOPIC_PREAMBLES) {
    topic = topic.replace(preamble, "");
  }

  return tidy(applyPairs(topic, TOPIC_PERSON));
}

/** Plantillas por tipo. La frase de contexto entra como el tema. */
function statementFor(type: QuestionType, topic: string): string {
  switch (type) {
    case "scale":
      return `Estoy satisfecho con ${topic}`;
    case "open":
      return `¿Qué cambiarías de ${topic}?`;
    case "single":
      return `¿Qué describe mejor ${topic}?`;
    case "multiple":
      return `¿Qué aspectos de ${topic} funcionan bien?`;
    case "dropdown":
      return `¿Con qué relacionas ${topic}?`;
  }
}

/**
 * Escribe una pregunta entera a partir de una frase de contexto.
 *
 * Es el caso de "no hay nada que mejorar": el campo está vacío, así que en
 * lugar de pulir texto se le pregunta al autor de qué va la pregunta y de esa
 * frase sale el enunciado y el tipo de respuesta que le corresponde.
 */
export async function generateQuestionFromContext(context: string): Promise<GeneratedQuestion> {
  await new Promise((resolve) => setTimeout(resolve, AI_WORDING_MS));

  const type: QuestionType = OPEN_HINTS.test(context)
    ? "open"
    : CHOICE_HINTS.test(context)
      ? "single"
      : SCALE_HINTS.test(context)
        ? "scale"
        : "scale";

  const topic = toTopic(context);
  return { statement: punctuate(statementFor(type, topic || "este tema")), type };
}

/**
 * La pregunta completa, ya válida para el catálogo.
 *
 * Pasa por `buildQuestion` y `changeQuestionType` en vez de armarse a mano
 * para que una pregunta generada nazca con la misma forma que una creada por
 * el autor: el cambio de tipo es lo que siembra las opciones vacías de una
 * pregunta de selección y lo que deja la escala configurada en una de escala.
 */
export function questionFromGenerated(generated: GeneratedQuestion): SurveyQuestion {
  const base = buildQuestion({ statement: generated.statement });
  return changeQuestionType(base, generated.type);
}
