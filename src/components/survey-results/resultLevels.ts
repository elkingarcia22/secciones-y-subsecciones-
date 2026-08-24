/**
 * The hierarchy levels a result view can show or hide, one toggle each.
 *
 * Shared by the heatmap and the questions view: both walk the same section
 * tree — root sections, their subsections, and questions as leaves — so
 * "Niveles" means the same four things and hides the same rows in either
 * view.
 */
export type ResultLevel = "section" | "subsection2" | "subsection3" | "question";

export const RESULT_LEVELS: readonly { id: ResultLevel; label: string }[] = [
  { id: "section", label: "Secciones" },
  { id: "subsection2", label: "Subsecciones" },
  { id: "subsection3", label: "Sub-subsecciones" },
  { id: "question", label: "Preguntas" },
];

/** A section's level from its depth in the tree — 1 is a root section. */
export const levelForDepth = (depth: number): ResultLevel =>
  depth === 1 ? "section" : depth === 2 ? "subsection2" : "subsection3";
