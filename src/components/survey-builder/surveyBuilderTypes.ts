/**
 * Survey Builder — domain types.
 *
 * A survey is composed of three fixed blocks (welcome, demographics, closing)
 * plus a tree of content sections, up to MAX_SECTION_DEPTH levels deep.
 *
 * Questions are allowed by DEPTH, not by being a leaf: level 1 sections are
 * pure containers, while levels 2 and 3 may hold questions — a level 2 can
 * carry its own questions *and* nest level 3 subsections at the same time.
 */

/** How the respondent answers. */
export type QuestionType = "scale" | "open" | "single" | "multiple" | "dropdown";

/** Which scale a `scale` question uses. */
export type ScaleType = "likert" | "nps" | "stars" | "emoji" | "linear" | "likert-nom035";

/** What a Likert scale measures — it decides the wording of its steps. */
export type RatingType = "agreement" | "frequency" | "satisfaction" | "importance";

export interface QuestionOption {
  id: string;
  label: string;
}

/** Wording shown to each NPS band when follow-up questions are on. */
export interface NpsFollowUps {
  detractors: string;
  neutrals: string;
  promoters: string;
}

/**
 * Scale settings. Only meaningful when `type === "scale"`; kept on every
 * question so switching type back and forth never loses what was configured.
 */
export interface ScaleConfig {
  kind: ScaleType | null;
  /** Likert only. */
  ratingType: RatingType | null;
  minLabel: string;
  maxLabel: string;
  /** Likert only: offer an explicit opt-out step. */
  allowDontKnow: boolean;
  followUpEnabled: boolean;
  followUps: NpsFollowUps;
}

export interface SurveyQuestion {
  id: string;
  /** Question wording. Empty string renders the placeholder copy. */
  statement: string;
  type: QuestionType;
  required: boolean;
  scale: ScaleConfig;
  /** Choice types only (single, multiple, dropdown). */
  options: readonly QuestionOption[];
  /** Indicates if this question was imported from the UBITS question bank. */
  isBankQuestion?: boolean;
}

export interface SurveySection {
  id: string;
  /** Editable section title. */
  title: string;
  description: string;
  /** Always empty at depth 1; may coexist with `children` at deeper levels. */
  questions: readonly SurveyQuestion[];
  /** Nested subsections. Several siblings are allowed at every level. */
  children: readonly SurveySection[];
}

/**
 * Panel entries that exist in every survey and cannot be reordered or removed.
 * `general` and `participants` are the survey's own setup; the rest are
 * respondent-facing blocks, two of which can be switched off.
 */
export type FixedBlockId =
  | "general"
  | "demographics"
  | "participants"
  | "pages";

/** What the survey measures. Drives reporting benchmarks downstream. */
export type SurveyKind = "cultura" | "clima" | "enps" | "otros" | "ia";

export const SURVEY_KIND_LABELS: Readonly<Record<SurveyKind, string>> = {
  cultura: "Cultura",
  clima: "Clima",
  enps: "eNPS",
  ia: "Evaluación y adopción de IA",
  otros: "Otros",
};

/**
 * How much of a response is traceable back to the person who gave it.
 *
 * Only two options, and they are opposites: either every answer is attributable
 * or none is. A middle tier would be a promise the product cannot keep — it
 * either stores the link between person and answer, or it does not.
 */
export type SurveyVisibility = "public" | "anonymous";

export const SURVEY_VISIBILITY_LABELS: Readonly<Record<SurveyVisibility, string>> = {
  public: "Público",
  anonymous: "Anónimo",
};

/** Headline of the note under the visibility select. */
export const SURVEY_VISIBILITY_HEADLINES: Readonly<Record<SurveyVisibility, string>> = {
  public: "Hazlo público si quieres transparencia.",
  anonymous: "Protege la identidad de quienes respondan.",
};

/** The promise each visibility makes to the participant, in their terms. */
export const SURVEY_VISIBILITY_NOTES: Readonly<Record<SurveyVisibility, string>> = {
  public:
    "Al marcar esta opción, tu encuesta será pública. Esto quiere decir que se podrá ver quién respondió y qué respondió cada participante.",
  anonymous:
    "Ninguna respuesta se muestra de forma individual. Los resultados de un grupo (por ejemplo, un área o una sede) solo se muestran una vez que alcanza el número mínimo de respuestas que definas abajo.",
};

/**
 * Floor for the anonymity threshold. Below 3 the threshold stops protecting
 * anyone — with two responses, each participant can deduce the other one's
 * answer — so the author can't set it any lower.
 */
export const ANONYMITY_THRESHOLD_MIN = 3;

export const DEFAULT_ANONYMITY_THRESHOLD = 5;

/** Longest description accepted by the general-data form. */
export const MAX_DESCRIPTION_LENGTH = 450;

/** Lifecycle of a survey. Only a draft is editable in the builder. */
export type SurveyStatus = "draft" | "scheduled" | "live" | "closed";

export const SURVEY_STATUS_LABELS: Readonly<Record<SurveyStatus, string>> = {
  draft: "Borrador",
  scheduled: "Programada",
  live: "En curso",
  closed: "Finalizada",
};

/**
 * How the audience is put together. The three are mutually exclusive: each
 * answers "who receives this" in a different way, so mixing them would leave
 * the real recipient list ambiguous.
 */
export type ParticipantMode = "company" | "individual" | "import";

/**
 * One row read from an imported file, before it is resolved against the
 * directory. Only `name` or `username` is required for the row to count; the
 * rest enrich the preview when present.
 */
export interface ImportedUser {
  username: string;
  name: string;
  email: string;
  area: string;
  leader: string;
}

/**
 * A demographic column read from an imported file. The file is the source for
 * the field's values, so those become its answer options — everything else
 * about the field (wording, type, visibility) stays editable once activated.
 */
export interface ImportedDemographic {
  /** Raw column name, used as the catalog key. */
  key: string;
  /** Humanized column name, the wording the participant will read. */
  label: string;
  /** Distinct non-empty values found in that column, in file order. */
  optionLabels: readonly string[];
}

export interface ParticipantsSelection {
  mode: ParticipantMode;
  /** Ids picked by hand. Kept when switching modes so going away and coming
   * back doesn't silently throw the selection away. */
  selectedIds: readonly string[];
  /** Name of the loaded file, or null while none has been uploaded. */
  importedFileName: string | null;
  /** Rows read from that file, kept so the preview survives leaving the
   * participants step and coming back. */
  importedUsers: readonly ImportedUser[];
  /** How many rows that file resolved to. */
  importedCount: number;
  /** How many of those rows matched no directory entry — the people the file
   * itself brings in, the only ones the detected demographics can belong to. */
  importedNewCount: number;
  /** Demographic columns the last imported file carried on top of the known
   * user fields (username, name, email, area, leader), each with the distinct
   * values found in the file. Persisted so the demographics step can offer
   * them as filterable fields for the newly imported users. */
  importedDemographics: readonly ImportedDemographic[];
  /** The uploaded bytes could not be read as a spreadsheet. Separate from an
   * empty parse so "corrupt file" and "valid file with no users" stay two
   * distinguishable messages. */
  importedFailed: boolean;
}

/**
 * New surveys start aimed at the whole company: it is the common case for a
 * climate or culture survey, and it is a valid audience on its own, so the
 * step opens already answered rather than blocking on a click that just
 * confirms the obvious. Narrowing it is the deliberate act.
 */
export const DEFAULT_PARTICIPANTS: ParticipantsSelection = {
  mode: "company",
  selectedIds: [],
  importedFileName: null,
  importedUsers: [],
  importedCount: 0,
  importedNewCount: 0,
  importedDemographics: [],
  importedFailed: false,
};

/**
 * Where a demographic comes from — the cases the builder lays out as
 * accordions:
 *
 *   system   one of the variables the platform already models (área, nivel,
 *            antigüedad…). Its answer options are fixed, because the whole
 *            point is that a response lines up with what the platform stores.
 *   library  a question already created in some other survey, reused here.
 *            Its wording came pre-filled, but nothing about it is locked — a
 *            reused question is still just a question.
 *   custom   written from scratch, for this survey only.
 *   import   a column detected in the file that brought the new participants.
 *            The file supplies each value, so like a system variable it is
 *            preloadable — but unlike one, its wording and options are ours.
 */
export type DemographicSource = "system" | "library" | "custom" | "import";

/**
 * Closed answer types only. A demographic exists to group results, and free
 * text groups nothing: "Bogotá", "bogota" and "Bogota D.C." would each become
 * their own segment.
 */
export type DemographicType = Extract<QuestionType, "single" | "multiple" | "dropdown">;

/**
 * A demographic that exists in `fields` is, by definition, in use — that is
 * what being on the list means, whether it came from "Crear dato demográfico"
 * or from turning on a system variable. Every field carries the same
 * mostrar/ocultar decision that a `preloadable` one does:
 *
 *   visible   show the question to the participant so they can confirm or
 *             correct it, or keep it out of the survey and use it only to
 *             filter results afterwards.
 *
 * A `preloadable` one has a value already waiting (platform record or imported
 * file), so hiding it never loses data; a plain question that is hidden simply
 * stops being asked.
 */
export interface DemographicField {
  id: string;
  /** Wording the participant reads. Editable even on system fields. */
  label: string;
  source: DemographicSource;
  /** Catalog key for system or library fields, null for ad-hoc custom ones. */
  catalogKey: string | null;
  /** Whether the platform supplies this value. A catalog fact, not a choice. */
  preloadable: boolean;
  /** True when each option is one person. Set by the collaborator field. */
  perPerson?: boolean;
  /** Shown to the participant. Also settable on non-preloadable fields — they
   * can be hidden and used only as a filter. */
  visible: boolean;
  type: DemographicType;
  /** Ignored while `visible` is false — nothing is being asked. */
  required: boolean;
  /** Locked on system fields: the options are the platform's own values. */
  options: readonly QuestionOption[];
}

export interface DemographicsConfig {
  /**
   * Master switch. Off means the survey asks for no demographics and stores
   * none, so its results cannot be broken down by them. The fields stay in the
   * draft while it is off, so switching it back on doesn't start from zero.
   */
  enabled: boolean;
  fields: readonly DemographicField[];
}

export interface SurveyDraft {
  /** Editable survey name, shown as the title of the builder. */
  name: string;
  status: SurveyStatus;
  /** Optional internal description, up to MAX_DESCRIPTION_LENGTH characters. */
  description: string;
  /** ISO `yyyy-mm-dd`, the format a native date input reads and writes. */
  startDate: string;
  endDate: string;
  /** Null until the author picks one — new surveys don't start pre-assigned
   * to a kind. */
  kind: SurveyKind | null;
  visibility: SurveyVisibility;
  /** Only meaningful while `visibility` is "anonymous". */
  anonymityThreshold: number;
  sections: readonly SurveySection[];
  /** Who receives the survey. */
  participants: ParticipantsSelection;
  /** What is asked about the participant, and what is taken from the platform. */
  demographics: DemographicsConfig;
  /** Enabled state for the toggleable fixed blocks. */
  welcomeEnabled: boolean;
  closingEnabled: boolean;
  /** Rich-text HTML shown on each page while its block is enabled. */
  welcomeDescription: string;
  closingDescription: string;
}

/** Identifies whichever panel entry is currently being edited. */
export type BuilderSelection =
  | { kind: "fixed"; id: FixedBlockId }
  | { kind: "section"; id: string };

/** Average minutes a respondent spends per question, used for the estimate. */
export const MINUTES_PER_QUESTION = 0.5;

/**
 * Deepest nesting allowed: nivel 1 (sección) → 2 (subsección) → 3 (sub-subsección).
 * Raise this single constant to allow deeper trees.
 */
export const MAX_SECTION_DEPTH = 3;

/** Human label per depth, used in the editor header and menus. */
export const DEPTH_LABELS: Readonly<Record<number, string>> = {
  1: "Sección",
  2: "Subsección",
  3: "Sub-subsección",
};

export const depthLabel = (depth: number): string => DEPTH_LABELS[depth] ?? `Nivel ${depth}`;

/** Shallowest level that may hold questions. */
export const MIN_QUESTION_DEPTH = 1;

/** Whether a section at this depth can hold questions of its own. */
export const canHaveQuestions = (depth: number): boolean => depth >= MIN_QUESTION_DEPTH;
