/**
 * Visual language for nesting depth.
 *
 * Earlier iterations nested a panel inside a panel inside a card. Boxes inside
 * boxes fight each other: every level adds a border and a corner radius, and by
 * level 3 nothing reads as belonging to anything.
 *
 * So subsections are not boxes at all. The hierarchy is an *outline*:
 *
 *   nivel 1  la única caja — card blanca con banda de cabecera
 *   nivel 2  fila de encabezado + riel vertical que sostiene su contenido
 *   nivel 3  lo mismo, sangrado bajo el riel del nivel 2, con riel más fino
 *   hermanos separados por una línea divisoria, como los ítems de una lista
 *
 * Only the question list keeps a border, because it *is* the content. Depth is
 * carried by indentation, rail weight, chip weight and title size.
 */

export interface DepthTheme {
  /** Numbering pill in the header row. */
  chip: string;
  /** Border classes for the rail that holds this level's content. */
  rail: string;
  /** Left margin that aligns the rail under the header's chevron. */
  railOffset: string;
  /** Title size for this level. */
  title: string;
}

const LEVEL_2: DepthTheme = {
  chip: "bg-primary/10 text-primary",
  rail: "border-l-2 border-border",
  railOffset: "ml-[7px] pl-[17px]",
  title: "text-[14px]",
};

const LEVEL_3: DepthTheme = {
  chip: "border border-border bg-surface text-text-secondary",
  rail: "border-l border-border/70",
  railOffset: "ml-2 pl-4",
  title: "text-[12.5px]",
};

const THEMES: Readonly<Record<number, DepthTheme>> = {
  2: LEVEL_2,
  3: LEVEL_3,
};

/** Visual treatment for a subsection at `depth`. Deeper levels reuse level 3. */
export const depthTheme = (depth: number): DepthTheme => THEMES[depth] ?? LEVEL_3;

/**
 * Selection ring added on top of a level's own chip. Selection is a state of
 * that row, not a different level — a solid-blue chip read as its own depth
 * tier, competing with the badge reserved for level 1.
 */
export const CHIP_SELECTED_RING = "ring-2 ring-primary/50 ring-offset-1 ring-offset-surface";

/** Rail of the row currently being edited. */
export const RAIL_SELECTED = "border-primary/45";

/**
 * Level-1 card header. It stays on the card's own white so the whole panel
 * reads as one surface; a divider line does the separating, not a fill.
 */
export const SECTION_HEADER_DIVIDER = "border-border/70";

/**
 * Hairline separating sibling rows. Applied to every row but the first, so a
 * level reads as one list rather than a stack of floating blocks.
 */
export const SIBLING_DIVIDER = "[&>li+li]:mt-3 [&>li+li]:border-t [&>li+li]:border-border/50 [&>li+li]:pt-3";
