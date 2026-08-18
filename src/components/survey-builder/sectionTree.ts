import { moveItemById } from "@/lib/reorder";
import { MAX_SECTION_DEPTH, canHaveQuestions, type SurveySection } from "./surveyBuilderTypes";

/**
 * Pure, immutable operations over the section tree.
 * Every function returns new arrays/objects — nothing is mutated in place.
 */

export interface SectionTreeEntry {
  section: SurveySection;
  /** 1-based nesting level. */
  depth: number;
  /** Hierarchical position label, e.g. "2", "2.1", "2.1.3". */
  numbering: string;
  /** Id of the containing section, or null for root sections. */
  parentId: string | null;
  /** Index among its siblings. */
  index: number;
}

/** True when the section holds subsections (and therefore no questions). */
export const isBranch = (section: SurveySection): boolean => section.children.length > 0;

/**
 * Walks the tree in visual order, descending into a branch only when
 * `shouldDescend` allows it.
 */
function walkTree(
  sections: readonly SurveySection[],
  shouldDescend: (section: SurveySection) => boolean
): SectionTreeEntry[] {
  const entries: SectionTreeEntry[] = [];

  const walk = (
    nodes: readonly SurveySection[],
    depth: number,
    prefix: string,
    parentId: string | null
  ): void => {
    nodes.forEach((section, index) => {
      const numbering = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
      entries.push({ section, depth, numbering, parentId, index });

      if (isBranch(section) && shouldDescend(section)) {
        walk(section.children, depth + 1, numbering, section.id);
      }
    });
  };

  walk(sections, 1, "", null);
  return entries;
}

/** Every section in the tree, regardless of what is open. */
export function flattenSections(sections: readonly SurveySection[]): SectionTreeEntry[] {
  return walkTree(sections, () => true);
}

/**
 * The rows the navigation tree shows: a branch is walked only when it is open.
 * Shares `expandedIds` with the main panel, so both sides always agree on which
 * single branch is open.
 */
export function expandedEntries(
  sections: readonly SurveySection[],
  expandedIds: ReadonlySet<string>
): SectionTreeEntry[] {
  return walkTree(sections, (section) => expandedIds.has(section.id));
}

/** Locates a section anywhere in the tree, ignoring collapsed state. */
export function findSection(
  sections: readonly SurveySection[],
  id: string
): SectionTreeEntry | null {
  return flattenSections(sections).find((entry) => entry.section.id === id) ?? null;
}

/**
 * Ids from the root down to `id`, inclusive — the branch that has to be open
 * for `id` to be on screen. Both panels keep exactly one row expanded per
 * level, so this chain *is* the set of expanded rows.
 */
export function pathIds(sections: readonly SurveySection[], id: string): string[] {
  const chain: string[] = [];
  let current = findSection(sections, id);

  while (current) {
    chain.unshift(current.section.id);
    current = current.parentId === null ? null : findSection(sections, current.parentId);
  }

  return chain;
}

/** Returns a new tree with `patch` applied to the section matching `id`. */
export function patchSection(
  sections: readonly SurveySection[],
  id: string,
  patch: Partial<Omit<SurveySection, "id">>
): SurveySection[] {
  return sections.map((section) => {
    if (section.id === id) return { ...section, ...patch };
    if (!isBranch(section)) return section;
    return { ...section, children: patchSection(section.children, id, patch) };
  });
}

/** Returns a new tree with `child` appended to `parentId`'s children. */
export function appendChild(
  sections: readonly SurveySection[],
  parentId: string,
  child: SurveySection
): SurveySection[] {
  return sections.map((section) => {
    if (section.id === parentId) {
      return { ...section, children: [...section.children, child] };
    }
    if (!isBranch(section)) return section;
    return { ...section, children: appendChild(section.children, parentId, child) };
  });
}

/**
 * Returns a new tree with `section` inserted as the sibling right after
 * `targetId` — same parent, placed directly below it. Works at any depth,
 * including the root level, where the insert lands in the top-level list.
 */
function insertAfterSection(
  sections: readonly SurveySection[],
  targetId: string,
  section: SurveySection
): SurveySection[] {
  const target = findSection(sections, targetId);
  if (!target) return [...sections];

  if (target.parentId === null) {
    const index = sections.findIndex((item) => item.id === targetId);
    if (index === -1) return [...sections];
    const next = [...sections];
    next.splice(index + 1, 0, section);
    return next;
  }

  const parent = findSection(sections, target.parentId);
  if (!parent) return [...sections];

  const siblings = parent.section.children;
  const index = siblings.findIndex((item) => item.id === targetId);
  if (index === -1) return [...sections];

  const nextChildren = [...siblings];
  nextChildren.splice(index + 1, 0, section);
  return patchSection(sections, parent.section.id, { children: nextChildren });
}

/**
 * Returns a new tree with `child` inserted as the sibling right after
 * `siblingId` — same parent, placed directly below it. Used by the rail's
 * "crear subsección hermana" option while standing on a level-2 subsection,
 * where the sibling is never a root row.
 */
export function insertAfterSibling(
  sections: readonly SurveySection[],
  siblingId: string,
  child: SurveySection
): SurveySection[] {
  const sibling = findSection(sections, siblingId);
  if (!sibling || sibling.parentId === null) return [...sections];
  return insertAfterSection(sections, siblingId, child);
}

/** Returns a new tree without the section matching `id` (and its subtree). */
export function removeSection(
  sections: readonly SurveySection[],
  id: string
): SurveySection[] {
  return sections
    .filter((section) => section.id !== id)
    .map((section) =>
      isBranch(section) ? { ...section, children: removeSection(section.children, id) } : section
    );
}

/**
 * Reorders two sections that share the same parent, moving each one's whole
 * subtree with it. Works at any depth — root sections reorder the same way
 * their subsections do. A drop between sections with different parents (or
 * different depths) is rejected rather than silently reparenting anything.
 */
export function reorderSiblings(
  sections: readonly SurveySection[],
  fromId: string,
  toId: string
): SurveySection[] {
  const from = findSection(sections, fromId);
  const to = findSection(sections, toId);

  if (!from || !to || from.parentId !== to.parentId) return [...sections];

  if (from.parentId === null) {
    return moveItemById(sections, fromId, toId);
  }

  const parent = findSection(sections, from.parentId);
  if (!parent) return [...sections];

  return patchSection(sections, from.parentId, {
    children: moveItemById(parent.section.children, fromId, toId),
  });
}

/**
 * Direct children of `entry` as tree entries, carrying absolute numbering.
 * Used by the main panel to render one nested accordion per subsection.
 */
export function childEntries(entry: SectionTreeEntry): SectionTreeEntry[] {
  return entry.section.children.map((child, index) => ({
    section: child,
    depth: entry.depth + 1,
    numbering: `${entry.numbering}.${index + 1}`,
    parentId: entry.section.id,
    index,
  }));
}

/** Locates the section that owns a given question. */
export function findQuestionOwner(
  sections: readonly SurveySection[],
  questionId: string
): SectionTreeEntry | null {
  return (
    flattenSections(sections).find((entry) =>
      entry.section.questions.some((question) => question.id === questionId)
    ) ?? null
  );
}

/** Total questions across the whole tree. */
export function countQuestions(sections: readonly SurveySection[]): number {
  return sections.reduce(
    (total, section) => total + section.questions.length + countQuestions(section.children),
    0
  );
}

/** Number of sections in the subtree rooted at `section`, excluding itself. */
export function countDescendants(section: SurveySection): number {
  return section.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}

/** Levels `section`'s own subtree reaches below it: 0 for a leaf, 1 when it
 * holds direct children, and so on down the deepest branch. Used to decide
 * whether a subtree still fits under a shallower destination. */
function maxSubtreeDepth(section: SurveySection): number {
  if (section.children.length === 0) return 0;
  return 1 + Math.max(...section.children.map(maxSubtreeDepth));
}

/** Whether `id` names `section` itself or anything nested under it. */
function isInSubtree(section: SurveySection, id: string): boolean {
  if (section.id === id) return true;
  return section.children.some((child) => isInSubtree(child, id));
}

/**
 * The sections a subsection could be moved next to, in tree order: every other
 * section/subsection that can host the moved subtree as a sibling. The moved
 * section lands directly below the chosen destination at the same depth, so it
 * takes on that destination's level — a subsección 2 moved next to a level-3
 * destination becomes level 3, and a level 3 moved next to a level-2 one
 * becomes level 2.
 *
 * A level-1 destination would promote the subtree into a root without a
 * container, which can only be legal while the subtree carries no questions
 * (level 1 never renders questions). Excludes itself, its own descendants (a
 * cycle) and its current parent.
 */
export function moveDestinationsForSection(
  sections: readonly SurveySection[],
  entry: SectionTreeEntry
): SectionTreeEntry[] {
  const below = maxSubtreeDepth(entry.section);
  const carriesQuestions = countQuestions([entry.section]) > 0;

  return flattenSections(sections).filter((candidate) => {
    if (candidate.section.id === entry.section.id) return false;
    if (candidate.section.id === entry.parentId) return false;
    if (isInSubtree(entry.section, candidate.section.id)) return false;
    // Level 1 cannot hold questions, so only a question-free subtree may be
    // promoted low enough to sit beside a root section.
    if (candidate.depth === 1 && carriesQuestions) return false;
    return candidate.depth + below <= MAX_SECTION_DEPTH;
  });
}

/**
 * The sections a question could be moved into, in tree order: any section
 * that can hold questions (level 2 or 3) except the one already owning it.
 */
export function moveDestinationsForQuestion(
  sections: readonly SurveySection[],
  ownerId: string
): SectionTreeEntry[] {
  return flattenSections(sections).filter(
    (candidate) => candidate.section.id !== ownerId && canHaveQuestions(candidate.depth)
  );
}

/**
 * Returns a new tree with the section `id` (its whole subtree included) moved
 * to sit as the next sibling right below `targetId`. The move is a reparenting
 * onto the target's parent, so the moved section adopts the target's depth —
 * moving a level-2 next to a level-3 destination turns it into a level 3, and
 * the reverse turns a level 3 into a level 2. The target is assumed to have
 * been validated by `moveDestinationsForSection`.
 */
export function moveSectionTo(
  sections: readonly SurveySection[],
  id: string,
  targetId: string
): SurveySection[] {
  const source = findSection(sections, id);
  if (!source) return [...sections];
  const detached = removeSection(sections, id);
  return insertAfterSection(detached, targetId, source.section);
}

/**
 * Returns a new tree with the question `questionId` moved to the end of
 * `targetSectionId`'s question list. The target is assumed to have been
 * validated by `moveDestinationsForQuestion`.
 */
export function moveQuestionTo(
  sections: readonly SurveySection[],
  questionId: string,
  targetSectionId: string
): SurveySection[] {
  const owner = findQuestionOwner(sections, questionId);
  if (!owner) return [...sections];

  const question = owner.section.questions.find((item) => item.id === questionId);
  if (!question) return [...sections];

  const without = patchSection(sections, owner.section.id, {
    questions: owner.section.questions.filter((item) => item.id !== questionId),
  });
  const target = findSection(without, targetSectionId);
  if (!target) return [...sections];

  return patchSection(without, targetSectionId, {
    questions: [...target.section.questions, question],
  });
}

/**
 * Whether a subsection may be added under this entry. Several siblings are
 * allowed per level, so depth is the only limit.
 */
export function canAddSubsection(entry: SectionTreeEntry): boolean {
  return entry.depth < MAX_SECTION_DEPTH;
}

/** Explains why "add subsection" is unavailable, or null when it is available. */
export function subsectionBlockedReason(entry: SectionTreeEntry): string | null {
  if (entry.depth >= MAX_SECTION_DEPTH) {
    return `Alcanzaste el máximo de ${MAX_SECTION_DEPTH} niveles`;
  }
  return null;
}

/** Explains why questions cannot be added to this entry, or null when they can. */
export function questionBlockedReason(entry: SectionTreeEntry): string | null {
  if (!canHaveQuestions(entry.depth)) {
    return "Las secciones de primer nivel no llevan preguntas; añádelas en una subsección";
  }
  return null;
}

/**
 * Picks the section that should be selected after `removedId` disappears:
 * the row that takes its place, or the last remaining row.
 */
export function nextSelectionAfterRemoval(
  sections: readonly SurveySection[],
  removedId: string
): string | null {
  const before = flattenSections(sections);
  const removedIndex = before.findIndex((entry) => entry.section.id === removedId);
  const remaining = flattenSections(removeSection(sections, removedId));

  if (remaining.length === 0) return null;
  return remaining[Math.min(Math.max(removedIndex, 0), remaining.length - 1)].section.id;
}
