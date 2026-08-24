import { LIBRARY_DEMOGRAPHICS, SYSTEM_DEMOGRAPHICS } from "@/components/survey-builder/demographics";
import type {
  DemographicField,
  DemographicsConfig,
  NpsFollowUps,
  QuestionOption,
  QuestionType,
  RatingType,
  ScaleType,
  SurveyQuestion,
  SurveySection,
} from "@/components/survey-builder/surveyBuilderTypes";

/**
 * Survey seeds — the compact way mock survey content is written.
 *
 * A `SurveyDraft` is verbose by design: every question carries a full scale
 * config whether or not it uses one, and every option needs an id. Writing
 * forty questions that way buries the content in boilerplate, so mock surveys
 * are authored as *seeds* — statement plus the one or two things that differ —
 * and expanded here.
 *
 * Ids are derived from a prefix and the seed's position, never generated, so
 * re-opening the same survey produces the same object and any answers already
 * given stay keyed to the same questions.
 */

const emptyScale = (): SurveyQuestion["scale"] => ({
  kind: null,
  ratingType: null,
  minLabel: "",
  maxLabel: "",
  allowDontKnow: false,
  followUpEnabled: false,
  followUps: { detractors: "", neutrals: "", promoters: "" },
});

export interface QuestionSeed {
  statement: string;
  /** Defaults to `"scale"` — the common case in a climate survey. */
  type?: QuestionType;
  /** Scale questions only. Defaults to `"likert"`. */
  scale?: ScaleType;
  /** Plain Likert only. Defaults to `"agreement"`. */
  rating?: RatingType;
  /** Choice types only: the answer options, in order. */
  options?: readonly string[];
  /** Ends of a stars, emoji, linear or NPS scale. */
  minLabel?: string;
  maxLabel?: string;
  /** Likert only: offer an explicit "no sabe / no responde" step. */
  allowDontKnow?: boolean;
  /** NPS only: the wording each band gets after answering. */
  followUps?: NpsFollowUps;
  /** Overrides the default, which is required for everything but open text. */
  optional?: boolean;
}

function buildSeedQuestion(prefix: string, index: number, seed: QuestionSeed): SurveyQuestion {
  const id = `${prefix}-q${index + 1}`;
  const type = seed.type ?? "scale";
  const required = seed.optional === undefined ? type !== "open" : !seed.optional;

  const options: readonly QuestionOption[] = (seed.options ?? []).map((label, position) => ({
    id: `${id}-o${position + 1}`,
    label,
  }));

  if (type !== "scale") {
    return { id, statement: seed.statement, type, required, scale: emptyScale(), options };
  }

  const kind = seed.scale ?? "likert";

  return {
    id,
    statement: seed.statement,
    type,
    required,
    scale: {
      kind,
      ratingType: kind === "likert" ? seed.rating ?? "agreement" : null,
      minLabel: seed.minLabel ?? "",
      maxLabel: seed.maxLabel ?? "",
      allowDontKnow: Boolean(seed.allowDontKnow),
      followUpEnabled: Boolean(seed.followUps),
      followUps: seed.followUps ?? { detractors: "", neutrals: "", promoters: "" },
    },
    options: [],
  };
}

export interface SectionSeed {
  title: string;
  description?: string;
  questions?: readonly QuestionSeed[];
  children?: readonly SectionSeed[];
}

function buildSeedSection(prefix: string, index: number, seed: SectionSeed): SurveySection {
  const id = `${prefix}-s${index + 1}`;
  return {
    id,
    title: seed.title,
    description: seed.description ?? "",
    questions: (seed.questions ?? []).map((question, position) =>
      buildSeedQuestion(id, position, question)
    ),
    children: (seed.children ?? []).map((child, position) => buildSeedSection(id, position, child)),
  };
}

/** Expands a survey's section seeds into the tree a draft holds. */
export const buildSeedSections = (
  prefix: string,
  seeds: readonly SectionSeed[]
): readonly SurveySection[] => seeds.map((seed, index) => buildSeedSection(prefix, index, seed));

export interface DemographicSeed {
  /** Catalog key, from either the system or the library list. */
  key: string;
  /** Asked to the participant. Hidden fields are filters only. Default true. */
  visible?: boolean;
  /** Default true, matching what the catalog builders do. */
  required?: boolean;
  /** Overrides the catalog label — for demo-only fields that don't ship in
   * either catalog ("Área" instead of "Departamento o área de trabajo"). */
  label?: string;
  /** Full option list, replacing the catalog's. Required when `key` is not a
   * catalog key at all — the platform-built fields (Líder, Colaborador) carry
   * their own directory-backed values instead of a fixed catalog. */
  options?: readonly string[];
  /** True when each option is a person (e.g. Colaborador): one row per
   * respondent instead of one row per group. Default false. */
  perPerson?: boolean;
}

function buildSeedDemographic(prefix: string, seed: DemographicSeed): DemographicField | null {
  const system = SYSTEM_DEMOGRAPHICS.find((entry) => entry.key === seed.key);
  const library = system ? null : LIBRARY_DEMOGRAPHICS.find((entry) => entry.key === seed.key);
  const entry = system ?? library;
  const hasOwnOptions = seed.options !== undefined && seed.options.length > 0;
  if (!entry && !hasOwnOptions) return null;

  const id = `${prefix}-dem-${seed.key}`;
  const optionLabels = seed.options ?? entry?.optionLabels ?? [];

  return {
    id,
    label: seed.label ?? entry?.label ?? "",
    source: entry ? (system ? "system" : "library") : "custom",
    catalogKey: entry?.key ?? null,
    preloadable: entry ? system?.preloadable ?? false : true,
    perPerson: seed.perPerson ?? false,
    visible: seed.visible ?? true,
    type: entry?.type ?? "dropdown",
    required: seed.required ?? true,
    options: optionLabels.map((label, position) => ({
      id: `${id}-o${position + 1}`,
      label,
    })),
  };
}

/**
 * Expands demographic seeds into the block a draft holds. Unlike the catalog
 * builders, ids come from the catalog key rather than a fresh UUID — a mock has
 * to rebuild to the same field every time it is opened.
 */
export function buildSeedDemographics(
  prefix: string,
  seeds: readonly DemographicSeed[]
): DemographicsConfig {
  return {
    enabled: true,
    fields: seeds
      .map((seed) => buildSeedDemographic(prefix, seed))
      .filter((field): field is DemographicField => field !== null),
  };
}
