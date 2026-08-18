import {
  MINUTES_PER_QUESTION,
  countQuestions,
  depthLabel,
  flattenSections,
  likertSteps,
  type DemographicField,
  type SectionTreeEntry,
  type SurveyDraft,
  type SurveyQuestion,
} from "@/components/survey-builder";

/**
 * Survey Preview — page model.
 *
 * The builder edits a *tree*; a respondent walks a *sequence*. This module is
 * the translation between the two: it flattens the draft into the ordered list
 * of pages someone would actually see, and keeps the tree information each page
 * needs to say where it sits (numbering + trail of ancestors), so the preview
 * can always answer "which section and subsection am I in?".
 *
 * Everything here is pure — no React, no state — so the drawer stays a
 * rendering concern.
 */

/** One step of the "Sección 2 › Subsección 2.1" trail above a page title. */
export interface PreviewCrumb {
  numbering: string;
  title: string;
}

export type PreviewPage =
  | { kind: "welcome"; id: string }
  | {
      kind: "demographics";
      id: string;
      title: string;
      description: string;
      fields: readonly DemographicField[];
    }
  | {
      kind: "section";
      id: string;
      title: string;
      description: string;
      numbering: string;
      depth: number;
      /** Ancestors from the root down to the parent. Empty for a root page. */
      trail: readonly PreviewCrumb[];
      questions: readonly SurveyQuestion[];
    }
  | { kind: "closing"; id: string };

/** A row of the preview's navigation tree — every section, page or container. */
export interface PreviewOutlineRow {
  sectionId: string;
  label: string;
  numbering: string;
  depth: number;
  questionCount: number;
  /** Page this row jumps to, or null when the section is a pure container. */
  pageId: string | null;
}

export interface PreviewSummary {
  /** Root sections — what the author calls "secciones". */
  rootSections: number;
  /** Every node in the tree, roots and subsections alike. */
  totalSections: number;
  questionCount: number;
  /** Pages a respondent walks through, welcome and closing included. */
  pageCount: number;
  demographicCount: number;
  estimatedMinutes: number;
}

export const WELCOME_PAGE_ID = "page-welcome";
export const DEMOGRAPHICS_PAGE_ID = "page-demographics";
export const CLOSING_PAGE_ID = "page-closing";

/**
 * A section with no title still has to be nameable in a list of twenty. Its
 * position is the one thing it always has, so that becomes the label instead of
 * repeating "Sección sin título" down the whole tree.
 */
export const sectionLabel = (entry: SectionTreeEntry): string =>
  entry.section.title.trim() || `${depthLabel(entry.depth)} ${entry.numbering}`;

/** Demographic fields the participant is actually asked — hidden ones are
 * filters only, and a disabled block asks nothing at all. */
export const askedDemographics = (draft: SurveyDraft): readonly DemographicField[] =>
  draft.demographics.enabled ? draft.demographics.fields.filter((field) => field.visible) : [];

/**
 * The preview is only worth opening once there is something to answer. Sections
 * and pages of text are structure; a question is the survey.
 */
export const canPreview = (draft: SurveyDraft): boolean => countQuestions(draft.sections) > 0;

/** Ancestors of `entry`, in root-to-parent order, as breadcrumb steps. */
function trailFor(entries: readonly SectionTreeEntry[], entry: SectionTreeEntry): PreviewCrumb[] {
  const byId = new Map(entries.map((item) => [item.section.id, item]));
  const crumbs: PreviewCrumb[] = [];

  let current = entry.parentId === null ? null : byId.get(entry.parentId) ?? null;
  while (current) {
    crumbs.unshift({ numbering: current.numbering, title: sectionLabel(current) });
    current = current.parentId === null ? null : byId.get(current.parentId) ?? null;
  }

  return crumbs;
}

/**
 * The ordered pages of the preview.
 *
 * A section becomes a page when it carries questions of its own, which is why
 * level-1 sections never do: they are containers, and their subsections are the
 * pages. `flattenSections` walks in visual order, so a level-2 page always comes
 * before the level-3 pages nested under it — the same order the author sees in
 * the outline.
 */
export function buildPreviewPages(draft: SurveyDraft): PreviewPage[] {
  const pages: PreviewPage[] = [];

  if (draft.welcomeEnabled) pages.push({ kind: "welcome", id: WELCOME_PAGE_ID });

  const demographics = askedDemographics(draft);
  if (demographics.length > 0) {
    pages.push({
      kind: "demographics",
      id: DEMOGRAPHICS_PAGE_ID,
      title: "Datos demográficos",
      description:
        draft.visibility === "anonymous"
          ? "Nos permiten leer los resultados por grupos. Ninguna respuesta se muestra de forma individual."
          : "Nos permiten leer los resultados por grupos: área, nivel, antigüedad y demás.",
      fields: demographics,
    });
  }

  const entries = flattenSections(draft.sections);
  for (const entry of entries) {
    if (entry.section.questions.length === 0) continue;
    pages.push({
      kind: "section",
      id: entry.section.id,
      title: sectionLabel(entry),
      description: entry.section.description,
      numbering: entry.numbering,
      depth: entry.depth,
      trail: trailFor(entries, entry),
      questions: entry.section.questions,
    });
  }

  if (draft.closingEnabled) pages.push({ kind: "closing", id: CLOSING_PAGE_ID });

  return pages;
}

/**
 * Every section as a navigation row, containers included. A container has no
 * page of its own but still has to appear: it is the level-1 heading that tells
 * you which block the subsection you are answering belongs to.
 */
export function buildPreviewOutline(draft: SurveyDraft): PreviewOutlineRow[] {
  return flattenSections(draft.sections).map((entry) => ({
    sectionId: entry.section.id,
    label: sectionLabel(entry),
    numbering: entry.numbering,
    depth: entry.depth,
    questionCount: entry.section.questions.length,
    pageId: entry.section.questions.length > 0 ? entry.section.id : null,
  }));
}

/**
 * Ids of the sections `sectionId` sits under. The navigation panel marks them
 * as part of the open branch: a level-3 page is only findable if the level-1
 * block above it is visibly the one you are inside.
 */
export function ancestorSectionIds(
  rows: readonly PreviewOutlineRow[],
  sectionId: string
): ReadonlySet<string> {
  const index = rows.findIndex((row) => row.sectionId === sectionId);
  if (index === -1) return new Set();

  const ancestors = new Set<string>();
  let depth = rows[index].depth;

  for (let cursor = index - 1; cursor >= 0 && depth > 1; cursor -= 1) {
    if (rows[cursor].depth < depth) {
      ancestors.add(rows[cursor].sectionId);
      depth = rows[cursor].depth;
    }
  }

  return ancestors;
}

/** A root section with every subsection under it, flattened in visual order. */
export interface PreviewOutlineGroup {
  root: PreviewOutlineRow;
  children: readonly PreviewOutlineRow[];
}

/**
 * The outline as the welcome page reads it: one block per root section. The
 * table of contents answers "what is this survey made of", and that question is
 * answered at the level of blocks, not of every nested row.
 */
export function groupOutline(rows: readonly PreviewOutlineRow[]): PreviewOutlineGroup[] {
  const groups: PreviewOutlineGroup[] = [];

  for (const row of rows) {
    if (row.depth === 1) {
      groups.push({ root: row, children: [] });
      continue;
    }
    const current = groups[groups.length - 1];
    if (current) current.children = [...current.children, row];
  }

  return groups;
}

/**
 * How a page's questions are laid out.
 *
 * A run of statements rated on the same Likert scale is one thing to answer,
 * not five: repeating the same five options under every statement makes the
 * page long and the comparison between statements impossible. Grouped into a
 * matrix, the scale is written once and each statement is a row — which is also
 * how anyone who has filled in a climate survey expects to read it.
 *
 * Anything else — an open question, an NPS, a list of options — keeps its own
 * card, because it has nothing to line up with.
 */
export type PreviewBlock =
  | {
      kind: "matrix";
      id: string;
      steps: readonly string[];
      /** Position of the first question in the page, 1-based. */
      startIndex: number;
      questions: readonly SurveyQuestion[];
    }
  | { kind: "single"; id: string; index: number; question: SurveyQuestion };

/** The steps a question shares with its neighbours, or null when it groups with
 * nothing (only Likert scales line up in a matrix). */
function matrixSignature(question: SurveyQuestion): readonly string[] | null {
  if (question.type !== "scale") return null;
  const { kind, allowDontKnow } = question.scale;
  if (kind !== "likert" && kind !== "likert-nom035") return null;

  const steps = likertSteps(question);
  return allowDontKnow ? [...steps, "No sabe / no responde"] : steps;
}

const sameSteps = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((step, index) => step === b[index]);

/** Groups consecutive same-scale questions; everything else stays on its own. */
export function groupQuestionBlocks(questions: readonly SurveyQuestion[]): PreviewBlock[] {
  const blocks: PreviewBlock[] = [];

  questions.forEach((question, index) => {
    const steps = matrixSignature(question);
    const previous = blocks[blocks.length - 1];

    if (steps && previous?.kind === "matrix" && sameSteps(previous.steps, steps)) {
      blocks[blocks.length - 1] = {
        ...previous,
        questions: [...previous.questions, question],
      };
      return;
    }

    blocks.push(
      steps
        ? { kind: "matrix", id: question.id, steps, startIndex: index + 1, questions: [question] }
        : { kind: "single", id: question.id, index: index + 1, question }
    );
  });

  // A matrix of one is just a question with its options spelled out twice.
  return blocks.map((block) =>
    block.kind === "matrix" && block.questions.length === 1
      ? { kind: "single", id: block.id, index: block.startIndex, question: block.questions[0] }
      : block
  );
}

/** Headline numbers for the welcome page and the navigation panel. */
export function previewSummary(draft: SurveyDraft, pages: readonly PreviewPage[]): PreviewSummary {
  const questionCount = countQuestions(draft.sections);
  const demographicCount = askedDemographics(draft).length;
  const answerable = questionCount + demographicCount;

  return {
    rootSections: draft.sections.length,
    totalSections: flattenSections(draft.sections).length,
    questionCount,
    pageCount: pages.length,
    demographicCount,
    // Zero questions is genuinely zero minutes; the one-minute floor only
    // applies once there is something to answer.
    estimatedMinutes: answerable === 0 ? 0 : Math.max(1, Math.round(answerable * MINUTES_PER_QUESTION)),
  };
}

/**
 * A demographic rendered as what it already is: a small closed question. Doing
 * the mapping here means the preview has one question renderer instead of two
 * that drift apart — and to the respondent, "¿En qué área trabajas?" is a
 * question like any other.
 */
export function toPreviewQuestion(field: DemographicField): SurveyQuestion {
  return {
    id: field.id,
    statement: field.label,
    type: field.type,
    required: field.required,
    scale: {
      kind: null,
      ratingType: null,
      minLabel: "",
      maxLabel: "",
      allowDontKnow: false,
      followUpEnabled: false,
      followUps: { detractors: "", neutrals: "", promoters: "" },
    },
    options: field.options,
  };
}

/** Questions a page asks, whatever kind of page it is. */
export function pageQuestionIds(page: PreviewPage): readonly string[] {
  if (page.kind === "section") return page.questions.map((question) => question.id);
  if (page.kind === "demographics") return page.fields.map((field) => field.id);
  return [];
}

/** `dd/mm/aaaa` from the ISO value the date inputs store, or null while empty. */
export function formatPreviewDate(iso: string): string | null {
  if (!iso) return null;
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return null;
  return `${day}/${month}/${year}`;
}
