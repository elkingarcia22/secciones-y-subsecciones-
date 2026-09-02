import { buildQuestion } from "./questionCatalog";
import { AI_FOCUSES, findFocus, type AiTheme } from "./aiSectionThemes";
import type { SurveyKind, SurveyQuestion, SurveySection } from "./surveyBuilderTypes";

/**
 * Composes the section tree the AI drawer proposes.
 *
 * There is no model behind this yet: the brief the author fills in is turned
 * into a tree by picking from `aiSectionThemes`. What matters for the rest of
 * the app is the contract — a brief goes in, a valid `SurveySection[]` comes
 * out, respecting the same depth rules the manual editor enforces — so the day
 * a real endpoint replaces `generateSections`, nothing above it changes.
 */

/** Where the generated tree lands. */
export type AiScope = "section" | "survey";

/** How the generated questions are worded. */
export type AiQuestionStyle = "scale" | "open" | "single" | "multiple" | "dropdown" | "mixed";

/**
 * Lo que el autor le cuenta al generador antes de que construya nada.
 *
 * Las tres decisiones —dónde, qué temas, cómo se responden— nacen sin
 * respuesta, y eso es a propósito: el brief se presenta como una conversación
 * que abre las preguntas de a una, y una pregunta que ya viene contestada no
 * puede abrir la siguiente. Los tamaños sí traen valor porque no son una
 * decisión que haya que tomar para empezar, solo un ajuste.
 */
export interface AiSectionsBrief {
  /** `null` hasta que el autor elige: es lo que abre la siguiente pregunta. */
  scope: AiScope | null;
  /** Level-1 sections to create. Only meaningful when scope is "survey". */
  sectionCount: number;
  /** Subsections per section. */
  subsectionCount: number;
  /** Sub-subsections per subsection. */
  subsubsectionCount: number;
  /** Questions per subsection. */
  questionCount: number;
  /** Focus ids from `AI_FOCUSES`, in the order they should be used. */
  focuses: readonly string[];
  /** `null` hasta que el autor elige. */
  questionStyle: AiQuestionStyle | null;
  /** Free-form context the author adds. Recorded, not parsed. */
  notes: string;
}

/**
 * El alcance y el estilo ya resueltos.
 *
 * Existen porque el brief guarda `null` mientras la pregunta está sin
 * contestar, pero todo lo que lee el brief —el generador, la barra de espera,
 * las etiquetas de los contadores— necesita un valor. La generación solo
 * arranca con el brief completo (`isBriefReady`), así que el respaldo es una
 * red y no el camino normal.
 */
export const briefScope = (brief: AiSectionsBrief): AiScope => brief.scope ?? "survey";
export const briefStyle = (brief: AiSectionsBrief): AiQuestionStyle =>
  brief.questionStyle ?? "likert";

/** Si ya se puede generar: las tres decisiones contestadas y algún tamaño fijado. */
export function isBriefReady(brief: AiSectionsBrief): boolean {
  const hasSize =
    brief.sectionCount > 0 ||
    brief.subsectionCount > 0 ||
    brief.subsubsectionCount > 0 ||
    brief.questionCount > 0;
  return (
    brief.scope !== null && brief.focuses.length > 0 && brief.questionStyle !== null && hasSize
  );
}

export const AI_BRIEF_LIMITS = {
  sectionCount: { min: 1, max: 6 },
  subsectionCount: { min: 1, max: 6 },
  subsubsectionCount: { min: 0, max: 4 },
  questionCount: { min: 1, max: 10 },
} as const;

export const MAX_AI_NOTES_LENGTH = 400;

/**
 * El brief con el que se abre el panel.
 *
 * `scope` llega como sugerencia y no como respuesta: cuando solo hay un
 * alcance posible se da por contestado —no hay nada que preguntar— y cuando
 * hay dos se deja en `null` para que la primera pregunta sea real.
 */
export function defaultBrief(
  _kind: SurveyKind | null,
  scope: AiScope,
  canChooseScope = true
): AiSectionsBrief {
  return {
    scope: canChooseScope ? null : scope,
    // Every count starts unset (0), not at the smallest valid size: a
    // pre-filled "1" reads as an answer nobody gave. Touching any of them is
    // also what reveals the next step — see `AiSectionsBriefForm`.
    sectionCount: 0,
    subsectionCount: 0,
    subsubsectionCount: 0,
    questionCount: 0,
    focuses: [],
    questionStyle: null,
    notes: "",
  };
}

const newId = (prefix: string): string =>
  `${prefix}-${
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 15)
  }`;

/**
 * Seeded generator, so "Regenerar" produces a genuinely different proposal
 * while a given seed always rebuilds the same one — a plain `Math.random()`
 * would make the preview impossible to reason about while debugging.
 */
function rotate<T>(items: readonly T[], seed: number): readonly T[] {
  if (items.length === 0) return items;
  const offset = ((seed % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

/** Takes `count` items, cycling when the source is shorter than asked. */
function take<T>(items: readonly T[], count: number): T[] {
  if (items.length === 0) return [];
  return Array.from({ length: count }, (_, index) => items[index % items.length]);
}

/** An agreement-scale question — the default shape for every statement. */
function likert(statement: string): SurveyQuestion {
  return buildQuestion({
    statement,
    type: "scale",
    isAiGenerated: true,
    scale: {
      kind: "likert",
      ratingType: "agreement",
      minLabel: "Totalmente en desacuerdo",
      maxLabel: "Totalmente de acuerdo",
      allowDontKnow: false,
      followUpEnabled: false,
      followUps: { detractors: "", neutrals: "", promoters: "" },
    },
  });
}

function open(statement: string): SurveyQuestion {
  return buildQuestion({ statement, type: "open", required: false, isAiGenerated: true });
}

/**
 * The questions one theme contributes.
 *
 * "Mixta" closes each subsection with an open question instead of scattering
 * them: a block of comparable statements followed by one place to elaborate is
 * how a section is normally read, and it keeps the scale block intact for
 * reporting.
 */
function themeQuestions(theme: AiTheme, count: number, style: AiQuestionStyle, seed: number): SurveyQuestion[] {
  const statements = rotate(theme.statements, seed);
  const prompts = rotate(theme.openPrompts, seed);

  if (style === "open") {
    return take(prompts, count).map(open);
  }

  if (style === "mixed" && count > 1) {
    const openCount = Math.max(1, Math.round(count / 4));
    const scaleCount = count - openCount;
    return [
      ...take(statements, scaleCount).map(likert),
      ...take(prompts, openCount).map(open),
    ];
  }

  return take(statements, count).map(likert);
}

/** One subsection built from a theme. */
function themeSection(theme: AiTheme, brief: AiSectionsBrief, seed: number): SurveySection {
  const hasSubsubs = brief.subsubsectionCount > 0;
  
  const children = hasSubsubs 
    ? Array.from({ length: brief.subsubsectionCount }).map((_, i) => {
        const subTheme = rotate(theme.themes || AI_FOCUSES[0].themes, seed + i)[0] || theme;
        return {
          id: newId("section"),
          title: `Sub-subsección ${i + 1} (${theme.title})`,
          description: `Detalle de ${theme.title.toLowerCase()}`,
          questions: themeQuestions(subTheme, brief.questionCount, briefStyle(brief), seed + i + 100),
          children: [],
          isAiGenerated: true
        };
      })
    : [];

  return {
    id: newId("section"),
    title: theme.title,
    description: theme.description,
    questions: hasSubsubs ? [] : themeQuestions(theme, brief.questionCount, briefStyle(brief), seed),
    children,
    isAiGenerated: true
  };
}

/**
 * Focuses to build from, padded from the catalog when the author selected
 * fewer than the number of sections asked for — an empty section would be
 * worse than one on a related subject.
 */
function resolveFocuses(brief: AiSectionsBrief, needed: number, seed: number) {
  const selected = brief.focuses.map((id) => {
    const found = findFocus(id);
    if (found) return found;
    // Create a mock focus for custom strings so they actually show up in the preview
    return {
      id,
      label: id,
      hint: "Tema personalizado añadido por ti",
      sectionDescription: `Aspectos relacionados con ${id.toLowerCase()}.`,
      themes: [
        {
          title: `Tema principal: ${id}`,
          description: `Exploración de los elementos clave de ${id.toLowerCase()}.`,
          statements: [
            `Considero que el manejo de ${id.toLowerCase()} es adecuado.`,
            `Me siento satisfecho con cómo abordamos ${id.toLowerCase()}.`,
            `Tenemos claridad sobre los procesos de ${id.toLowerCase()}.`
          ],
          openPrompts: [
            `¿Qué aspecto de ${id.toLowerCase()} requiere más atención?`,
            `¿Qué sugerirías para mejorar ${id.toLowerCase()}?`
          ]
        }
      ]
    } as AiTheme | any; // Type hack for the mock
  });
  const rest = rotate(
    AI_FOCUSES.filter((focus) => !brief.focuses.includes(focus.id)),
    seed
  );
  const pool = [...selected, ...rest];
  return take(pool.length > 0 ? pool : AI_FOCUSES, needed);
}

/**
 * The proposal itself: the sections to add, plus the counts the preview shows.
 *
 * When the scope is "section" the returned sections ARE the subsections to nest
 * inside the target — level 1 holds no questions of its own, so a proposal for
 * one section is a proposal for its children.
 */
export interface AiProposal {
  sections: readonly SurveySection[];
  scope: AiScope;
}

export function generateSections(brief: AiSectionsBrief, seed: number): AiProposal {
  if (brief.scope === "section") {
    // One focus, several of its themes: a single section should read as one
    // subject seen from a few angles, not as three unrelated subjects.
    const [focus] = resolveFocuses(brief, 1, seed);
    const themes = take(rotate(focus.themes, seed), brief.subsectionCount);
    return {
      scope: "section",
      sections: themes.map((theme, index) => ({ ...themeSection(theme, brief, seed + index), isAiGenerated: true })),
    };
  }

  const focuses = resolveFocuses(brief, brief.sectionCount, seed);

  return {
    scope: "survey",
    sections: focuses.map((focus, index) => ({
      id: newId("section"),
      title: focus.label,
      isAiGenerated: true,
      description: focus.sectionDescription,
      questions: [],
      children: take(rotate(focus.themes, seed + index), brief.subsectionCount).map(
        (theme, childIndex) => themeSection(theme, brief, seed + index + childIndex)
      ),
    })),
  };
}

const QUESTION_STYLE_LOADER_LABELS: Readonly<Record<AiQuestionStyle, string>> = {
  likert: "en escala de acuerdo",
  mixed: "mixtas: escala con una abierta al cierre",
  open: "abiertas",
};

/** "Liderazgo, Comunicación y Bienestar" — a natural join, not a comma list. */
function joinNatural(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;

/**
 * The loader's stepping text, built from the brief actually filled in instead
 * of fixed copy — the temas marked, the tamaño chosen, the tipo de respuesta —
 * so the wait shows that what the author asked for was read, the same way the
 * proposal itself is built from it.
 */
export function describeBriefForLoader(brief: AiSectionsBrief): string[] {
  const focusLabels = brief.focuses
    .map(findFocus)
    .filter((focus): focus is NonNullable<typeof focus> => focus !== undefined)
    .map((focus) => focus.label);
  const temas =
    focusLabels.length > 0
      ? joinNatural(focusLabels)
      : "los temas más comunes para este tipo de encuesta";

  const scopeLabel = brief.scope === "section" ? "esta sección" : "toda la encuesta";

  const treeLabel =
    brief.scope === "survey"
      ? `${pluralize(brief.sectionCount, "sección", "secciones")} con ${pluralize(
          brief.subsectionCount,
          "subsección",
          "subsecciones"
        )} cada una`
      : pluralize(brief.subsectionCount, "subsección", "subsecciones");

  return [
    `Leyendo el contexto de ${scopeLabel}`,
    `Cubriendo ${temas}`,
    `Redactando ${pluralize(brief.questionCount, "pregunta", "preguntas")} por subsección, ${
      QUESTION_STYLE_LOADER_LABELS[briefStyle(brief)]
    }`,
    `Organizando ${treeLabel}`,
  ];
}
