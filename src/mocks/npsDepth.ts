import { flattenSections, type SurveyDraft, type SurveyQuestion } from "@/components/survey-builder";
import { buildQuestionBreakdowns, type OptionTally } from "./questionResponses";
import {
  jitter,
  sectionResultsForFilters,
  unitFromSeed,
  type NpsBand,
  type SectionResult,
  type SegmentFilter,
  type SurveyResults,
} from "./surveyResults";

/**
 * Preguntas de profundidad — the follow-up a recommendability question asks
 * back, and what people wrote in it.
 *
 * A depth question is not a section of the survey: it is a property of one
 * scale question, configured in the builder as `scale.followUpEnabled` plus the
 * wording each band reads. So this model does not invent a tree of its own — it
 * walks the sections and subsections the author actually wrote, keeps the
 * branches that hold a question with depth on, and hangs the three band
 * questions under each one. What the report shows is therefore what the survey
 * asked, in the place the author put it.
 *
 * Every count is read off the same tallies the Preguntas tab renders, never
 * sampled again here: the band split of an NPS question is its own 0–10 spread
 * (0–6, 7–8, 9–10), and of a 1–5 scale its own five boxes (1–2, 3, 4–5). Two
 * screens that disagree about how many detractors a question has is exactly the
 * failure this shared derivation exists to prevent.
 */

export const NPS_BAND_ORDER: readonly NpsBand[] = ["detractor", "passive", "promoter"];

export const NPS_BAND_LABELS: Readonly<Record<NpsBand, string>> = {
  detractor: "Detractores",
  passive: "Neutros",
  promoter: "Promotores",
};

/** One written answer to a depth question. */
export interface NpsDepthAnswer {
  id: string;
  band: NpsBand;
  text: string;
  /** Demographics of the person, as the comments views state them. */
  segment: string;
}

/** One band of one depth question: who was asked, who answered, what they said. */
export interface NpsDepthBand {
  band: NpsBand;
  /** The wording the author configured for this band. Empty when unwritten. */
  question: string;
  /** People whose score put them in this band — the ones who saw the question. */
  people: number;
  /** How many of them wrote something back. */
  answered: number;
  /** `answered` over `people`, 0–100. */
  coverage: number;
  answers: readonly NpsDepthAnswer[];
}

/** A scale question that asks a follow-up, with its three bands. */
export interface NpsDepthQuestion {
  id: string;
  statement: string;
  /** The section it hangs from, so a question row still says where it lives. */
  sectionNumbering: string;
  sectionTitle: string;
  /** "NPS 0 a 10", "Estrellas 1 a 5" — the scale the bands were cut from. */
  formatLabel: string;
  /** Responses to the scale question itself. */
  n: number;
  bands: readonly NpsDepthBand[];
}

/** A branch of the survey that holds at least one depth question. */
export interface NpsDepthSection {
  id: string;
  numbering: string;
  title: string;
  depth: number;
  questions: readonly NpsDepthQuestion[];
  children: readonly NpsDepthSection[];
}

export interface NpsDepthTotals {
  /** Scale questions asking a follow-up. */
  questions: number;
  /** Depth questions actually configured — three per question at most. */
  bandQuestions: number;
  people: number;
  answered: number;
  /** `answered` over `people`, 0–100. Null with nobody asked. */
  coverage: number | null;
  byBand: Readonly<Record<NpsBand, { people: number; answered: number }>>;
}

/* -------------------------------------------------------------- seed pools */

/**
 * What people write back, by band.
 *
 * Deliberately band-shaped: a detractor's follow-up reads like a complaint with
 * a subject, a promoter's like a reason to stay. A pool that ignored the band
 * would produce a screen where the three groups say the same thing, which is
 * the one reading this view exists to disprove.
 */
const ANSWER_SEEDS: Readonly<Record<NpsBand, readonly string[]>> = {
  detractor: [
    "El salario se quedó atrás frente al mercado y eso pesa más que cualquier beneficio.",
    "La carga de trabajo creció mucho más rápido que el equipo. Llevo tres trimestres cubriendo dos roles.",
    "Falta claridad sobre cómo se decide un ascenso. He visto promociones sin criterio visible.",
    "Mi jefe directo no da seguimiento a nada de lo que acordamos.",
    "Se prometió una revisión salarial en enero y todavía no hay noticias.",
    "Hay mucha rotación en el equipo y eso nos deja siempre empezando de cero.",
    "No sé a quién acudir cuando algo se sale de lo normal. La estructura no es clara.",
    "Las reuniones consumen el día entero y no queda tiempo para el trabajo real.",
    "El reconocimiento existe, aunque siempre recae en las mismas personas.",
  ],
  passive: [
    "El equipo es excelente, pero no veo un camino claro de crecimiento para los próximos dos años.",
    "Se comunican los cambios, aunque casi siempre cuando ya están decididos.",
    "Depende mucho del equipo en el que estés. En el mío funciona, en otros he escuchado lo contrario.",
    "Las herramientas cumplen, pero llevamos dos años pidiendo una actualización.",
    "Todo bien en general, aunque hay cosas que se pueden pulir.",
    "Recomendaría la empresa con matices: hay que saber en qué área se entra.",
    "El onboarding fue correcto: ni malo ni memorable.",
  ],
  promoter: [
    "La flexibilidad real y la confianza de mi líder son lo que me mantiene aquí.",
    "Aprendo más en un trimestre aquí que en dos años en mi trabajo anterior.",
    "Se puede decir lo que se piensa sin que te pase nada. Eso no es común.",
    "Mi líder me da retroalimentación cada semana y eso ha cambiado por completo cómo trabajo.",
    "El plan de formación del año pasado me sirvió para cambiar de rol internamente.",
    "Me gusta el propósito de la compañía, se nota en las decisiones del día a día.",
    "Se escucha a la gente y se actúa. Es lo que más valoro de este año.",
  ],
};

/** Demographic pairs the answers are attributed to, same shape as verbatims. */
const SEGMENT_SEEDS: readonly string[] = [
  "Tecnología · 3 a 5 años",
  "Producto · 1 a 3 años",
  "Comercial · 3 a 5 años",
  "Operaciones · Más de 10 años",
  "Gente y Cultura · 5 a 10 años",
  "Marketing · 5 a 10 años",
  "Servicio al cliente · Menos de 1 año",
  "Finanzas · 1 a 3 años",
  "Legal · 5 a 10 años",
  "Logística · Menos de 1 año",
];

const pickFrom = <T,>(pool: readonly T[], seed: string): T =>
  pool[Math.floor(unitFromSeed(seed) * pool.length) % pool.length];

/* ------------------------------------------------------------------ bandas */

/** How the eleven NPS points and the five scale boxes split into bands. */
const bandOfNpsPoint = (point: number): NpsBand =>
  point >= 9 ? "promoter" : point >= 7 ? "passive" : "detractor";

const bandOfScaleBox = (box: number): NpsBand =>
  box >= 4 ? "promoter" : box === 3 ? "passive" : "detractor";

/**
 * People per band, read off the question's own tallies.
 *
 * The tally is what the Preguntas tab draws, so the three bands here always sum
 * back to the same `n` that view shows. NS/NR never counts as a band: somebody
 * who opted out of the scale was never routed to a follow-up.
 */
function peopleByBand(
  tallies: readonly OptionTally[],
  isNps: boolean
): Record<NpsBand, number> {
  const totals: Record<NpsBand, number> = { detractor: 0, passive: 0, promoter: 0 };

  tallies.forEach((tally, index) => {
    if (tally.isNsNr) return;
    const band = isNps
      ? bandOfNpsPoint(Number(tally.shortLabel) || index)
      : bandOfScaleBox((tally.bandIndex ?? index) + 1);
    totals[band] += tally.count;
  });

  return totals;
}

/**
 * Written answers for one band.
 *
 * One row per person who answered, not a sample — the band row promises "78
 * respondieron" and a list holding six of them would make that number a lie.
 * The view is what decides how many to draw; the file carries all of them.
 */
function buildAnswers(
  questionId: string,
  band: NpsBand,
  answered: number
): readonly NpsDepthAnswer[] {
  const pool = ANSWER_SEEDS[band];
  return Array.from({ length: answered }, (_, index) => {
    const seed = `${questionId}:${band}:${index}`;
    return {
      id: `${questionId}-${band}-${index + 1}`,
      band,
      text: pickFrom(pool, seed),
      segment: pickFrom(SEGMENT_SEEDS, `${seed}:seg`),
    };
  });
}

/** Share of a band that bothers to write something back. */
const coverageFor = (questionId: string, band: NpsBand, filterSeed: string): number =>
  Math.min(
    1,
    Math.max(0.2, jitter(`${questionId}:${band}:${filterSeed}:coverage`, 0.62, 0.22))
  );

/* -------------------------------------------------------------- entry point */

/**
 * The depth questions of the survey, in the author's own outline.
 *
 * Branches with nothing to say are dropped rather than rendered empty: a
 * section that asked no follow-up is not a section of this view.
 */
export function npsDepthBySection(
  draft: SurveyDraft,
  results: SurveyResults,
  filters: readonly SegmentFilter[] = []
): readonly NpsDepthSection[] {
  const sections = sectionResultsForFilters(results, filters);
  const breakdowns = buildQuestionBreakdowns(draft, { ...results, sections });
  const filterSeed = filters.map((filter) => `${filter.key}:${filter.optionId}`).join("|");

  const configured = new Map<string, SurveyQuestion>();
  for (const entry of flattenSections(draft.sections)) {
    for (const question of entry.section.questions) {
      if (question.type === "scale" && question.scale.followUpEnabled) {
        configured.set(question.id, question);
      }
    }
  }

  const mapSection = (section: SectionResult): NpsDepthSection | null => {
    const questions: NpsDepthQuestion[] = [];

    for (const result of section.questions) {
      const question = configured.get(result.id);
      const breakdown = breakdowns.get(result.id);
      if (!question || !breakdown) continue;

      const isNps = question.scale.kind === "nps";
      const people = peopleByBand(breakdown.tallies, isNps);
      const wording: Readonly<Record<NpsBand, string>> = {
        detractor: question.scale.followUps.detractors,
        passive: question.scale.followUps.neutrals,
        promoter: question.scale.followUps.promoters,
      };

      const bands: NpsDepthBand[] = NPS_BAND_ORDER.map((band) => {
        const asked = people[band];
        const answered = Math.round(asked * coverageFor(result.id, band, filterSeed));
        return {
          band,
          question: wording[band],
          people: asked,
          answered,
          coverage: asked === 0 ? 0 : Math.round((answered / asked) * 1000) / 10,
          answers: buildAnswers(result.id, band, answered),
        };
      });

      questions.push({
        id: result.id,
        statement: result.statement || "Pregunta sin enunciado",
        sectionNumbering: section.numbering,
        sectionTitle: section.title,
        formatLabel: breakdown.formatLabel,
        n: result.n,
        bands,
      });
    }

    const children = section.children
      .map(mapSection)
      .filter((child): child is NpsDepthSection => child !== null);

    if (questions.length === 0 && children.length === 0) return null;

    return {
      id: section.id,
      numbering: section.numbering,
      title: section.title,
      depth: section.depth,
      questions,
      children,
    };
  };

  return sections
    .map(mapSection)
    .filter((section): section is NpsDepthSection => section !== null);
}

/** Whether any question of the survey asks a follow-up at all. */
export function hasNpsDepthQuestions(draft: SurveyDraft): boolean {
  return flattenSections(draft.sections).some((entry) =>
    entry.section.questions.some(
      (question) => question.type === "scale" && question.scale.followUpEnabled
    )
  );
}

/** Every depth question of the tree, in reading order. */
export function flattenNpsDepth(
  sections: readonly NpsDepthSection[]
): readonly NpsDepthQuestion[] {
  return sections.flatMap((section) => [
    ...section.questions,
    ...flattenNpsDepth(section.children),
  ]);
}

export function npsDepthTotals(sections: readonly NpsDepthSection[]): NpsDepthTotals {
  const questions = flattenNpsDepth(sections);
  const byBand: Record<NpsBand, { people: number; answered: number }> = {
    detractor: { people: 0, answered: 0 },
    passive: { people: 0, answered: 0 },
    promoter: { people: 0, answered: 0 },
  };

  let bandQuestions = 0;

  for (const question of questions) {
    for (const band of question.bands) {
      if (band.question.trim().length > 0) bandQuestions += 1;
      byBand[band.band].people += band.people;
      byBand[band.band].answered += band.answered;
    }
  }

  const people = NPS_BAND_ORDER.reduce((sum, band) => sum + byBand[band].people, 0);
  const answered = NPS_BAND_ORDER.reduce((sum, band) => sum + byBand[band].answered, 0);

  return {
    questions: questions.length,
    bandQuestions,
    people,
    answered,
    coverage: people === 0 ? null : Math.round((answered / people) * 1000) / 10,
    byBand,
  };
}
