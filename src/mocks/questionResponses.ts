import {
  NOM_035_STEPS,
  RATING_STEPS,
  flattenSections,
  type QuestionType,
  type ScaleType,
  type SurveyDraft,
  type SurveyQuestion,
} from "@/components/survey-builder";
import { COLLABORATORS } from "./collaborators";
import {
  flattenResultSections,
  unitFromSeed,
  type QuestionResult,
  type SurveyResults,
} from "./surveyResults";

/**
 * Response-level detail — the layer under the aggregate.
 *
 * `surveyResults` answers "how did this section do". This module answers the
 * three questions that only the raw responses can: *how many people picked a 4*,
 * *what did this one person answer everywhere*, and *what did they write in the
 * open questions*. Same contract as its sibling: derived from the survey's own
 * `SurveyDraft` and its results, and deterministic — every count, every
 * individual answer and every sentiment is hashed from ids, so nothing moves
 * between renders, tab switches or reloads.
 *
 * Pure. No `Math.random`, no `Date.now`.
 */

// --- Shared helpers ----------------------------------------------------------

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Splits `total` into `weights.length` integers proportional to the weights. */
function splitByWeights(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((acc, weight) => acc + weight, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);

  const counts = weights.map((weight) => Math.floor((weight / sum) * total));
  let drift = total - counts.reduce((acc, count) => acc + count, 0);
  // The remainder goes to the heaviest buckets first, so rounding never
  // invents a response in a bucket that had almost none.
  const order = weights
    .map((weight, index) => ({ weight, index }))
    .sort((a, b) => b.weight - a.weight);
  let cursor = 0;
  while (drift > 0) {
    counts[order[cursor % order.length].index] += 1;
    cursor += 1;
    drift -= 1;
  }
  return counts;
}

// --- Question breakdown ------------------------------------------------------

/** One answer option of one question, with how many people chose it. */
export interface OptionTally {
  id: string;
  /** What the respondent read: "Totalmente de acuerdo", "Bogotá", "8". */
  label: string;
  /** Compact form for a dense axis: "1"…"5", "0"…"10", "A"…. */
  shortLabel: string;
  count: number;
  /** Share of the question's responses, 0–100. */
  percentage: number;
  /** Index in the 1–5 favorability scale, or null when the option isn't on it. */
  bandIndex: number | null;
  /** True for the "No sabe / no responde" opt-out. */
  isNsNr: boolean;
}

export interface QuestionBreakdown {
  questionId: string;
  statement: string;
  type: QuestionType;
  scaleKind: ScaleType | null;
  /** Human name of the format — "Likert (grado de acuerdo)", "Opción única". */
  formatLabel: string;
  n: number;
  nsnr: number;
  score: number | null;
  favorability: number | null;
  /** Empty for open questions: there is nothing to tally. */
  tallies: readonly OptionTally[];
  /** True when a respondent may tick more than one option. */
  multiSelect: boolean;
  /** Number of written answers, for open questions. */
  commentCount: number;
}

const SCALE_KIND_LABELS: Readonly<Record<ScaleType, string>> = {
  likert: "Escala Likert 1 a 5",
  "likert-nom035": "Likert NOM 035",
  nps: "NPS 0 a 10",
  stars: "Estrellas 1 a 5",
  emoji: "Emociones 1 a 5",
  linear: "Escala lineal 1 a 5",
};

const TYPE_LABELS: Readonly<Record<QuestionType, string>> = {
  scale: "Escala",
  open: "Pregunta abierta",
  single: "Opción única",
  multiple: "Múltiples respuestas",
  dropdown: "Desplegable",
};

/** The wording each of the five steps carries for the respondent. */
export function stepLabels(question: SurveyQuestion): readonly string[] {
  if (question.type !== "scale") return [];
  const kind = question.scale.kind;
  if (kind === "likert-nom035") return NOM_035_STEPS;
  if (kind === "likert") return RATING_STEPS[question.scale.ratingType ?? "agreement"];
  if (kind === "stars") return ["1 estrella", "2 estrellas", "3 estrellas", "4 estrellas", "5 estrellas"];
  if (kind === "emoji") return ["Muy mal", "Mal", "Neutral", "Bien", "Muy bien"];
  if (kind === "linear") {
    const min = question.scale.minLabel.trim();
    const max = question.scale.maxLabel.trim();
    return ["1", "2", "3", "4", "5"].map((step, index) =>
      index === 0 && min ? `1 · ${min}` : index === 4 && max ? `5 · ${max}` : step
    );
  }
  return [];
}

/** NPS spreads its 11 points around the question's own average. */
function npsTallies(question: SurveyQuestion, n: number): OptionTally[] {
  const weights = Array.from({ length: 11 }, (_, point) => {
    const unit = unitFromSeed(`${question.id}:nps:${point}`);
    // Detractors thin out, promoters bunch at 9 and 10 — the real shape of an
    // NPS answer, not a flat spread.
    const shape = point >= 9 ? 2.6 : point >= 7 ? 1.5 : 0.55 + point * 0.06;
    return shape * (0.6 + unit * 0.8);
  });
  const counts = splitByWeights(n, weights);
  return counts.map((count, point) => ({
    id: `${question.id}-p${point}`,
    label: `${point}`,
    shortLabel: `${point}`,
    count,
    percentage: n > 0 ? round1((count / n) * 100) : 0,
    bandIndex: null,
    isNsNr: false,
  }));
}

/** Choice questions get a shape of their own: a favourite, then a tail. */
function choiceTallies(question: SurveyQuestion, n: number, multiSelect: boolean): OptionTally[] {
  const weights = question.options.map((option, index) => {
    const unit = unitFromSeed(`${question.id}:${option.id}`);
    return (1 / (1 + index * 0.45)) * (0.55 + unit * 0.9);
  });
  // Multi-select adds up to more than the population: people tick 1.8 options
  // on average, so the tallies are built over an inflated total and the
  // percentages stay relative to the people, not to the ticks.
  const ticks = multiSelect ? Math.round(n * 1.8) : n;
  const counts = splitByWeights(ticks, weights);

  return question.options.map((option, index) => ({
    id: option.id,
    label: option.label || `Opción ${index + 1}`,
    shortLabel: String.fromCharCode(65 + index),
    count: Math.min(counts[index], n),
    percentage: n > 0 ? round1((Math.min(counts[index], n) / n) * 100) : 0,
    bandIndex: null,
    isNsNr: false,
  }));
}

/** A 1–5 scale reads its five boxes straight off the aggregate. */
function scaleTallies(question: SurveyQuestion, result: QuestionResult): OptionTally[] {
  const distribution = result.distribution ?? [0, 0, 0, 0, 0];
  const total = result.n + result.nsnr;
  const labels = stepLabels(question);

  const tallies: OptionTally[] = distribution.map((count, index) => ({
    id: `${question.id}-b${index + 1}`,
    label: labels[index] ? `${index + 1} · ${labels[index]}` : `${index + 1}`,
    shortLabel: `${index + 1}`,
    count,
    percentage: total > 0 ? round1((count / total) * 100) : 0,
    bandIndex: index,
    isNsNr: false,
  }));

  if (question.scale.allowDontKnow || result.nsnr > 0) {
    tallies.push({
      id: `${question.id}-nsnr`,
      label: "No sabe / No responde",
      shortLabel: "NS",
      count: result.nsnr,
      percentage: total > 0 ? round1((result.nsnr / total) * 100) : 0,
      bandIndex: null,
      isNsNr: true,
    });
  }

  return tallies;
}

/** Every question of the survey, keyed by id, with its own answer tally. */
export function buildQuestionBreakdowns(
  draft: SurveyDraft,
  results: SurveyResults
): ReadonlyMap<string, QuestionBreakdown> {
  const questions = new Map<string, SurveyQuestion>();
  for (const entry of flattenSections(draft.sections)) {
    for (const question of entry.section.questions) questions.set(question.id, question);
  }

  const breakdowns = new Map<string, QuestionBreakdown>();

  for (const section of flattenResultSections(results.sections)) {
    for (const result of section.questions) {
      const question = questions.get(result.id);
      if (!question) continue;

      const multiSelect = question.type === "multiple";
      const isNps = question.type === "scale" && question.scale.kind === "nps";
      const tallies = isNps
        ? npsTallies(question, result.n)
        : question.type === "scale"
          ? scaleTallies(question, result)
          : question.type === "open"
            ? []
            : choiceTallies(question, result.n, multiSelect);

      breakdowns.set(result.id, {
        questionId: result.id,
        statement: result.statement,
        type: question.type,
        scaleKind: question.type === "scale" ? question.scale.kind : null,
        formatLabel:
          question.type === "scale" && question.scale.kind
            ? SCALE_KIND_LABELS[question.scale.kind]
            : TYPE_LABELS[question.type],
        n: result.n,
        nsnr: result.nsnr,
        score: result.score,
        favorability: result.favorability,
        tallies,
        multiSelect,
        commentCount: question.type === "open" ? result.n : 0,
      });
    }
  }

  return breakdowns;
}

// --- Respondents -------------------------------------------------------------

export type RespondentStatus = "complete" | "partial";

/**
 * One person who answered.
 *
 * `anonymous` is not decoration: an anonymous survey promised that no answer
 * would ever be shown next to anything that identifies who gave it, and a
 * demographic is an identifier — "Marketing, Colombia, 18–24, mujer" narrows a
 * roster of 450 down to one person as reliably as a name does. So an anonymous
 * response carries a stable pseudonym and nothing else: every demographic is
 * null, not blanked out at the last moment in one view. The individual sheet
 * stays readable — what it is not is attributable.
 */
export interface Respondent {
  id: string;
  /** Real name, or "Participante 128" when the survey was anonymous. */
  name: string;
  initials: string;
  email: string | null;
  /** Null on an anonymous survey — see the note above. Same for the four below. */
  area: string | null;
  leader: string | null;
  country: string | null;
  gender: string | null;
  age: string | null;
  status: RespondentStatus;
  /** Questions they actually answered. */
  answered: number;
  /** Their own average on the 1–5 scales, or null if they skipped them all. */
  score: number | null;
  /** Day of the measurement window they submitted on, e.g. "12 feb". */
  submittedLabel: string;
  anonymous: boolean;
}

const SUBMIT_DAYS = [
  "3 feb", "4 feb", "5 feb", "6 feb", "7 feb", "10 feb", "11 feb", "12 feb",
  "13 feb", "14 feb", "17 feb", "18 feb", "19 feb", "20 feb", "21 feb",
] as const;

const initialsOf = (name: string): string =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/**
 * The roster of people whose answers can be opened, one per completed response.
 *
 * Bounded by the directory: a mock cannot invent 6.000 distinct people, and a
 * roster longer than the invited list would contradict the participation tab.
 */
export function buildRespondents(draft: SurveyDraft, results: SurveyResults): readonly Respondent[] {
  const anonymous = draft.visibility === "anonymous";
  const total = Math.min(results.participation.completed, COLLABORATORS.length);
  const scoredQuestions = results.rankedQuestions.length;

  return COLLABORATORS.slice(0, total).map((person, index) => {
    const seed = `${person.id}:resp`;
    const unit = unitFromSeed(seed);
    // Most people finish; a slice stopped part-way and their sheet says so.
    const status: RespondentStatus = unit > 0.91 ? "partial" : "complete";
    const answered =
      status === "complete"
        ? scoredQuestions
        : Math.max(1, Math.round(scoredQuestions * (0.3 + unitFromSeed(`${seed}:part`) * 0.5)));

    return {
      id: person.id,
      name: anonymous ? `Participante ${index + 1}` : person.name,
      initials: anonymous ? `P${index + 1}` : initialsOf(person.name),
      email: anonymous ? null : person.email,
      area: anonymous ? null : person.area,
      leader: anonymous ? null : person.leader,
      country: anonymous ? null : person.country,
      gender: anonymous ? null : person.gender,
      age: anonymous ? null : person.age,
      status,
      answered,
      score: round1(2.4 + unitFromSeed(`${seed}:score`) * 2.4),
      submittedLabel: SUBMIT_DAYS[Math.floor(unitFromSeed(`${seed}:day`) * SUBMIT_DAYS.length)],
      anonymous,
    };
  });
}

// --- One person's answers ----------------------------------------------------

export interface RespondentAnswer {
  questionId: string;
  type: QuestionType;
  /** The point on the scale (1–5, or 0–10 for NPS). Null when not a scale. */
  value: number | null;
  /** Position in the 1–5 favorability scale, for coloring. Null when not on it. */
  bandIndex: number | null;
  /** What to print: the step wording, the chosen option, or the written text. */
  display: string;
  /** Every option ticked, for multiple-answer questions. */
  selected: readonly string[];
  /** They chose the explicit opt-out. */
  nsnr: boolean;
  /** They left it blank — only possible on optional questions. */
  skipped: boolean;
}

/**
 * Who answered what, allocated exactly.
 *
 * The naive version drew each person's answer from the tally independently, and
 * the two directions then disagreed: a question could say "190 respondieron 4"
 * while the list of those people held 183. A report that contradicts itself one
 * click apart is worse than one that stays vague, so the allocation is done
 * once, for real: respondents are ranked by a per-question hash and sliced into
 * the buckets by the tally's own counts. Exactly 190 people land on the 4, the
 * leftover of the roster is what "sin responder" means, and both directions read
 * off the same slice.
 */
export interface AnswerMatrix {
  /** `questionId|tallyId` → the respondents who gave that answer. */
  byTally: ReadonlyMap<string, readonly string[]>;
  /** `respondentId|questionId` → the tally they landed on. Absent = skipped. */
  pick: ReadonlyMap<string, string>;
}

const tallyKey = (questionId: string, tallyId: string) => `${questionId}|${tallyId}`;
const pickKey = (respondentId: string, questionId: string) => `${respondentId}|${questionId}`;

export function buildAnswerMatrix(
  respondents: readonly Respondent[],
  breakdowns: ReadonlyMap<string, QuestionBreakdown>
): AnswerMatrix {
  const byTally = new Map<string, readonly string[]>();
  const pick = new Map<string, string>();

  for (const breakdown of breakdowns.values()) {
    if (breakdown.type === "open" || breakdown.tallies.length === 0) continue;
    const { questionId } = breakdown;

    // Stable per-question order. Same roster and same question, same order.
    const ranked = [...respondents].sort(
      (a, b) =>
        unitFromSeed(`${a.id}:${questionId}`) - unitFromSeed(`${b.id}:${questionId}`)
    );

    if (breakdown.multiSelect) {
      // Options are independent here: one person can appear under several, so
      // each option gets its own ranking and takes exactly its own count.
      for (const tally of breakdown.tallies) {
        const forOption = [...respondents]
          .sort(
            (a, b) =>
              unitFromSeed(`${a.id}:${questionId}:${tally.id}`) -
              unitFromSeed(`${b.id}:${questionId}:${tally.id}`)
          )
          .slice(0, tally.count)
          .map((person) => person.id);
        byTally.set(tallyKey(questionId, tally.id), forOption);
      }
      continue;
    }

    let cursor = 0;
    for (const tally of breakdown.tallies) {
      const slice = ranked.slice(cursor, cursor + tally.count);
      cursor += tally.count;
      byTally.set(
        tallyKey(questionId, tally.id),
        slice.map((person) => person.id)
      );
      for (const person of slice) pick.set(pickKey(person.id, questionId), tally.id);
    }
    // Whoever is left over past `cursor` simply did not answer this question —
    // which is what the aggregate meant when n came in under the roster.
  }

  return { byTally, pick };
}

/**
 * Everything one person answered, keyed by question id.
 *
 * Read straight off the allocation, so an individual sheet can never contradict
 * the aggregate: if 190 people picked a 4 on a question, exactly 190 of these
 * sheets show a 4 on it.
 */
export function buildRespondentAnswers(
  respondent: Respondent,
  breakdowns: ReadonlyMap<string, QuestionBreakdown>,
  comments: readonly OpenComment[],
  matrix: AnswerMatrix
): ReadonlyMap<string, RespondentAnswer> {
  const answers = new Map<string, RespondentAnswer>();
  const ownComments = new Map(
    comments.filter((c) => c.respondentId === respondent.id).map((c) => [c.questionId, c])
  );

  const blank = (questionId: string, type: QuestionType): RespondentAnswer => ({
    questionId,
    type,
    value: null,
    bandIndex: null,
    display: "",
    selected: [],
    nsnr: false,
    skipped: true,
  });

  for (const breakdown of breakdowns.values()) {
    const { questionId } = breakdown;

    if (breakdown.type === "open") {
      const comment = ownComments.get(questionId);
      answers.set(questionId, {
        ...blank(questionId, "open"),
        display: comment?.text ?? "",
        skipped: comment === undefined,
      });
      continue;
    }

    if (breakdown.multiSelect) {
      const selected = breakdown.tallies
        .filter((tally) =>
          matrix.byTally.get(tallyKey(questionId, tally.id))?.includes(respondent.id)
        )
        .map((tally) => tally.label);

      answers.set(questionId, {
        ...blank(questionId, breakdown.type),
        display: selected.join(" · "),
        selected,
        skipped: selected.length === 0,
      });
      continue;
    }

    const tallyId = matrix.pick.get(pickKey(respondent.id, questionId));
    const tally = breakdown.tallies.find((candidate) => candidate.id === tallyId);
    if (!tally) {
      answers.set(questionId, blank(questionId, breakdown.type));
      continue;
    }

    answers.set(questionId, {
      questionId,
      type: breakdown.type,
      value: tally.isNsNr ? null : Number.parseInt(tally.shortLabel, 10) || null,
      bandIndex: tally.bandIndex,
      display: tally.label,
      selected: [tally.label],
      nsnr: tally.isNsNr,
      skipped: false,
    });
  }

  return answers;
}

/** The people behind one number — the same slice their own sheets show. */
export function respondentsForTally(
  matrix: AnswerMatrix,
  questionId: string,
  tallyId: string
): readonly string[] {
  return matrix.byTally.get(tallyKey(questionId, tallyId)) ?? [];
}

// --- Open comments and sentiment --------------------------------------------

export type Sentiment = "positive" | "neutral" | "negative";

export interface OpenComment {
  id: string;
  questionId: string;
  questionStatement: string;
  sectionTitle: string;
  sectionNumbering: string;
  respondentId: string;
  respondentName: string;
  respondentInitials: string;
  /** Null when the survey was anonymous, like every other demographic. */
  area: string | null;
  country: string | null;
  anonymous: boolean;
  text: string;
  /** What the model read in it. Overridable by a human — see `sentimentOverrides`. */
  aiSentiment: Sentiment;
  /** How sure the model is, 0–100. Below ~70 is where a human should look. */
  aiConfidence: number;
  /** The theme the model tagged it with, for grouping. */
  topic: string;
  submittedLabel: string;
}

/** Seed pool: real-sounding answers with an unambiguous reading. */
const COMMENT_SEEDS: readonly { text: string; sentiment: Sentiment; topic: string }[] = [
  { text: "Mi líder me da retroalimentación cada semana y eso ha cambiado por completo cómo trabajo.", sentiment: "positive", topic: "Liderazgo" },
  { text: "La flexibilidad para organizar mi jornada es lo mejor de trabajar acá.", sentiment: "positive", topic: "Bienestar" },
  { text: "Aprendo muchísimo del equipo. Hay gente muy buena y comparten lo que saben.", sentiment: "positive", topic: "Desarrollo" },
  { text: "Se siente que puedo levantar la mano y decir que algo no está bien sin que me pase nada.", sentiment: "positive", topic: "Confianza" },
  { text: "El plan de formación del año pasado me sirvió para cambiar de rol internamente.", sentiment: "positive", topic: "Desarrollo" },
  { text: "Los procesos mejoraron mucho desde que documentamos todo en un solo lugar.", sentiment: "positive", topic: "Procesos" },
  { text: "Me gusta el propósito de la compañía, se nota en las decisiones del día a día.", sentiment: "positive", topic: "Propósito" },
  { text: "Todo bien en general, aunque hay cosas que se pueden pulir.", sentiment: "neutral", topic: "General" },
  { text: "Depende mucho del equipo en el que estés. En el mío funciona, en otros he escuchado lo contrario.", sentiment: "neutral", topic: "Consistencia" },
  { text: "Se comunican los cambios, aunque casi siempre cuando ya están decididos.", sentiment: "neutral", topic: "Comunicación" },
  { text: "No tengo una opinión fuerte sobre este punto.", sentiment: "neutral", topic: "General" },
  { text: "Las herramientas cumplen, pero llevamos dos años pidiendo una actualización.", sentiment: "neutral", topic: "Herramientas" },
  { text: "El onboarding fue correcto: ni malo ni memorable.", sentiment: "neutral", topic: "Onboarding" },
  { text: "La carga de trabajo creció mucho más rápido que el equipo. Llevo tres trimestres cubriendo dos roles.", sentiment: "negative", topic: "Carga de trabajo" },
  { text: "Falta claridad sobre cómo se decide un ascenso. He visto promociones sin criterio visible.", sentiment: "negative", topic: "Crecimiento" },
  { text: "El salario se quedó atrás frente al mercado y eso pesa más que cualquier beneficio.", sentiment: "negative", topic: "Compensación" },
  { text: "Las reuniones consumen el día entero y no queda tiempo para el trabajo real.", sentiment: "negative", topic: "Procesos" },
  { text: "Mi jefe directo no da seguimiento a nada de lo que acordamos.", sentiment: "negative", topic: "Liderazgo" },
  { text: "Se prometió una revisión salarial en enero y todavía no hay noticias.", sentiment: "negative", topic: "Compensación" },
  { text: "Hay mucha rotación en el equipo y eso nos deja siempre empezando de cero.", sentiment: "negative", topic: "Rotación" },
  { text: "No sé a quién acudir cuando algo se sale de lo normal. La estructura no es clara.", sentiment: "negative", topic: "Estructura" },
  { text: "Agradezco los días de bienestar, pero con esta carga no alcanzo a tomarlos.", sentiment: "negative", topic: "Bienestar" },
  { text: "El reconocimiento existe, aunque siempre recae en las mismas personas.", sentiment: "negative", topic: "Reconocimiento" },
  { text: "Se escucha a la gente y se actúa. Es lo que más valoro de este año.", sentiment: "positive", topic: "Escucha" },
];

/**
 * The written answers to every open question, with the sentiment the model read.
 *
 * One comment per person who answered, not a sample: the question row promises
 * "276 comentarios" and a list holding eighteen of them would make that number a
 * lie. The list itself pages, which is a rendering concern, not a data one.
 *
 * Confidence is deliberately uneven. A report where the AI is 95% sure of
 * everything teaches the reader to stop checking, which is the one failure mode
 * a correctable label exists to prevent.
 */
export function buildOpenComments(
  draft: SurveyDraft,
  results: SurveyResults,
  respondents: readonly Respondent[]
): readonly OpenComment[] {
  const openIds = new Set<string>();
  for (const entry of flattenSections(draft.sections)) {
    for (const question of entry.section.questions) {
      if (question.type === "open") openIds.add(question.id);
    }
  }
  if (openIds.size === 0 || respondents.length === 0) return [];

  const comments: OpenComment[] = [];

  for (const section of flattenResultSections(results.sections)) {
    for (const result of section.questions) {
      if (!openIds.has(result.id)) continue;

      // Distinct people, chosen by a per-question ranking: nobody answers the
      // same open question twice, and the same question always draws the same
      // group.
      const writers = [...respondents]
        .sort(
          (a, b) =>
            unitFromSeed(`${a.id}:${result.id}:wrote`) -
            unitFromSeed(`${b.id}:${result.id}:wrote`)
        )
        .slice(0, Math.min(result.n, respondents.length));

      writers.forEach((respondent, index) => {
        const seed = `${result.id}:${respondent.id}`;
        const seedItem =
          COMMENT_SEEDS[Math.floor(unitFromSeed(`${seed}:text`) * COMMENT_SEEDS.length)];

        comments.push({
          id: `${result.id}-c${index + 1}`,
          questionId: result.id,
          questionStatement: result.statement || "Pregunta abierta",
          sectionTitle: section.title,
          sectionNumbering: section.numbering,
          respondentId: respondent.id,
          respondentName: respondent.name,
          respondentInitials: respondent.initials,
          area: respondent.area,
          country: respondent.country,
          anonymous: respondent.anonymous,
          text: seedItem.text,
          aiSentiment: seedItem.sentiment,
          // Neutral text is the genuinely hard case, so it scores lower.
          aiConfidence: Math.round(
            (seedItem.sentiment === "neutral" ? 58 : 74) + unitFromSeed(`${seed}:conf`) * 24
          ),
          topic: seedItem.topic,
          submittedLabel: respondent.submittedLabel,
        });
      });
    }
  }

  return comments;
}

/** Sentiment as it stands: the model's reading unless a human corrected it. */
export const effectiveSentiment = (
  comment: OpenComment,
  overrides: ReadonlyMap<string, Sentiment>
): Sentiment => overrides.get(comment.id) ?? comment.aiSentiment;

/** Counts per sentiment, honouring the corrections. */
export function sentimentTotals(
  comments: readonly OpenComment[],
  overrides: ReadonlyMap<string, Sentiment>
): Readonly<Record<Sentiment, number>> {
  const totals: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  for (const comment of comments) totals[effectiveSentiment(comment, overrides)] += 1;
  return totals;
}
