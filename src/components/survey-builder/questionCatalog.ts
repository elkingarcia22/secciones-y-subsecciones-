import {
  AlignLeft,
  ChevronDownCircle,
  CircleDot,
  ListOrdered,
  ListChecks,
  MoveHorizontal,
  Smile,
  SlidersHorizontal,
  Star,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import type {
  NpsFollowUps,
  QuestionOption,
  QuestionType,
  RatingType,
  ScaleType,
  SurveyQuestion,
} from "./surveyBuilderTypes";

/**
 * Catalog of question and scale types, plus the factories that keep a question
 * consistent when the author switches type.
 *
 * Everything the editor renders is driven from here — which extra selects to
 * show, which preview to draw, which footer toggles apply — so adding a type is
 * a data change rather than a new branch in the component.
 */

export interface CatalogEntry<T> {
  value: T;
  label: string;
  icon: LucideIcon;
}

export const QUESTION_TYPES: readonly CatalogEntry<QuestionType>[] = [
  { value: "scale", label: "Escala de valoración", icon: SlidersHorizontal },
  { value: "open", label: "Pregunta abierta", icon: AlignLeft },
  { value: "single", label: "Opción única", icon: CircleDot },
  { value: "multiple", label: "Múltiples respuestas", icon: ListChecks },
  { value: "dropdown", label: "Desplegable", icon: ChevronDownCircle },
];

export const SCALE_TYPES: readonly CatalogEntry<ScaleType>[] = [
  { value: "likert", label: "Likert (escala de preferencias)", icon: ListOrdered },
  { value: "nps", label: "NPS (recomendabilidad)", icon: Gauge },
  { value: "stars", label: "Visual por estrellas", icon: Star },
  { value: "emoji", label: "Visual por emociones", icon: Smile },
  { value: "linear", label: "Escala lineal", icon: MoveHorizontal },
  { value: "likert-nom035", label: "Likert (NOM 035)", icon: ListOrdered },
];

export const RATING_TYPES: readonly CatalogEntry<RatingType>[] = [
  { value: "agreement", label: "Grado de acuerdo", icon: ListOrdered },
  { value: "frequency", label: "Frecuencia", icon: ListOrdered },
  { value: "satisfaction", label: "Satisfacción", icon: ListOrdered },
  { value: "importance", label: "Importancia", icon: ListOrdered },
];

/** Steps a respondent sees, per rating type. Drives the Likert preview. */
export const RATING_STEPS: Readonly<Record<RatingType, readonly string[]>> = {
  agreement: [
    "Totalmente en desacuerdo",
    "En desacuerdo",
    "Ni de acuerdo ni en desacuerdo",
    "De acuerdo",
    "Totalmente de acuerdo",
  ],
  frequency: ["Nunca", "Casi nunca", "A veces", "Casi siempre", "Siempre"],
  satisfaction: [
    "Muy insatisfecho",
    "Insatisfecho",
    "Neutral",
    "Satisfecho",
    "Muy satisfecho",
  ],
  importance: [
    "Nada importante",
    "Poco importante",
    "Moderadamente importante",
    "Importante",
    "Muy importante",
  ],
};

/** NOM 035 uses a fixed frequency scale that authors cannot reword. */
export const NOM_035_STEPS: readonly string[] = [
  "Siempre",
  "Casi siempre",
  "Algunas veces",
  "Casi nunca",
  "Nunca",
];

export const LINEAR_STEPS = 5;
export const STAR_STEPS = 5;
export const EMOJI_STEPS = 5;
export const NPS_MIN = 0;
export const NPS_MAX = 10;

export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 200;

const labelOf = <T extends string>(entries: readonly CatalogEntry<T>[], value: T | null): string =>
  entries.find((entry) => entry.value === value)?.label ?? "";

export const questionTypeLabel = (type: QuestionType): string => labelOf(QUESTION_TYPES, type);
export const scaleTypeLabel = (kind: ScaleType | null): string => labelOf(SCALE_TYPES, kind);
export const ratingTypeLabel = (type: RatingType | null): string => labelOf(RATING_TYPES, type);

/** Choice types render an editable list of answer options. */
export const hasOptions = (type: QuestionType): boolean =>
  type === "single" || type === "multiple" || type === "dropdown";

/** Scales whose ends the author labels ("Etiqueta mínima" / "máxima"). */
export const hasEndLabels = (kind: ScaleType | null): boolean =>
  kind === "stars" || kind === "emoji" || kind === "linear";

/** Likert variants ask what the scale measures. */
export const needsRatingType = (kind: ScaleType | null): boolean => kind === "likert";

/** Scales that can chain a follow-up question after the rating. */
export const supportsFollowUps = (kind: ScaleType | null): boolean =>
  kind === "nps" || kind === "stars" || kind === "emoji" || kind === "linear";

/** Only Likert offers an explicit "no sabe / no responde" step. */
export const supportsDontKnow = (kind: ScaleType | null): boolean =>
  kind === "likert" || kind === "likert-nom035";

const emptyFollowUps = (): NpsFollowUps => ({ detractors: "", neutrals: "", promoters: "" });

export const buildOption = (label = ""): QuestionOption => ({
  id: `opt-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
  label,
});

/** A brand-new question: an unconfigured Likert, the most common case. */
export const buildQuestion = (overrides: Partial<SurveyQuestion> = {}): SurveyQuestion => ({
  id: `q-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
  statement: "",
  type: "scale",
  required: true,
  scale: {
    kind: "likert",
    ratingType: "agreement",
    minLabel: "",
    maxLabel: "",
    allowDontKnow: false,
    followUpEnabled: false,
    followUps: emptyFollowUps(),
  },
  options: [],
  ...overrides,
});

/**
 * Switches a question's type, filling in whatever the new type needs and
 * leaving the rest untouched so nothing is lost on a round trip.
 */
export function changeQuestionType(question: SurveyQuestion, type: QuestionType): SurveyQuestion {
  const needsSeedOptions = hasOptions(type) && question.options.length < MIN_OPTIONS;

  return {
    ...question,
    type,
    scale:
      type === "scale" && question.scale.kind === null
        ? { ...question.scale, kind: "likert", ratingType: "agreement" }
        : question.scale,
    options: needsSeedOptions
      ? [...question.options, ...Array.from({ length: MIN_OPTIONS - question.options.length }, () => buildOption())]
      : question.options,
  };
}

/** Switches the scale, resetting the settings that do not apply to it. */
export function changeScaleType(question: SurveyQuestion, kind: ScaleType): SurveyQuestion {
  return {
    ...question,
    scale: {
      ...question.scale,
      kind,
      ratingType: needsRatingType(kind) ? (question.scale.ratingType ?? "agreement") : null,
      followUpEnabled: supportsFollowUps(kind) ? question.scale.followUpEnabled : false,
      allowDontKnow: supportsDontKnow(kind) ? question.scale.allowDontKnow : false,
    },
  };
}

/** A copy of `question` with fresh ids, ready to append next to the original. */
export function duplicateQuestion(question: SurveyQuestion): SurveyQuestion {
  return {
    ...question,
    id: `q-${(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15))}`,
    scale: { ...question.scale, followUps: { ...question.scale.followUps } },
    options: question.options.map((option) => ({ ...option, id: buildOption().id })),
  };
}

/**
 * Whether two questions carry the same content. Used to tell an untouched
 * editor from one with unsaved changes, so options are compared by label and
 * position — a reordered list counts as a change, a re-keyed id does not.
 */
export function isSameQuestion(a: SurveyQuestion, b: SurveyQuestion): boolean {
  if (a.statement !== b.statement || a.type !== b.type || a.required !== b.required) {
    return false;
  }

  if (
    a.scale.kind !== b.scale.kind ||
    a.scale.ratingType !== b.scale.ratingType ||
    a.scale.minLabel !== b.scale.minLabel ||
    a.scale.maxLabel !== b.scale.maxLabel ||
    a.scale.allowDontKnow !== b.scale.allowDontKnow ||
    a.scale.followUpEnabled !== b.scale.followUpEnabled ||
    a.scale.followUps.detractors !== b.scale.followUps.detractors ||
    a.scale.followUps.neutrals !== b.scale.followUps.neutrals ||
    a.scale.followUps.promoters !== b.scale.followUps.promoters
  ) {
    return false;
  }

  return (
    a.options.length === b.options.length &&
    a.options.every((option, index) => option.label === b.options[index].label)
  );
}

/** Steps previewed for a Likert question, by rating type. */
export function likertSteps(question: SurveyQuestion): readonly string[] {
  if (question.scale.kind === "likert-nom035") return NOM_035_STEPS;
  return RATING_STEPS[question.scale.ratingType ?? "agreement"];
}

/**
 * Whether a question has everything it needs to be a real, answerable
 * question — not just a row that exists. Drives whether the sections step can
 * be left: a section "with a question" that is actually blank wording, an
 * unset scale, or empty answer options isn't a question anyone could answer.
 */
export function isQuestionComplete(question: SurveyQuestion): boolean {
  if (question.statement.trim() === "") return false;

  if (question.type === "scale") {
    if (question.scale.kind === null) return false;
    if (needsRatingType(question.scale.kind) && question.scale.ratingType === null) return false;
  }

  if (hasOptions(question.type)) {
    if (question.options.length < MIN_OPTIONS) return false;
    if (question.options.some((option) => option.label.trim() === "")) return false;
  }

  return true;
}
