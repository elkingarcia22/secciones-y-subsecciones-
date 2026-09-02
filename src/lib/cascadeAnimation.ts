import type { Variants } from "framer-motion";

/**
 * Shared cascade reveal for accordion content: each line comes in on its own,
 * not the whole block at once. A list's rows stagger in one by one; a row's
 * own nested content (its questions, its own subsections) starts right as
 * that row settles in — not after every sibling has finished — so the reveal
 * reads as one continuous flow instead of a row appearing, a pause, then its
 * content.
 *
 * Usage: a container (`<motion.ul>`/`<motion.tbody>`/...) gets
 * `initial="hidden" animate="show" variants={cascadeContainer} custom={baseDelay}`,
 * and each row inside gets `variants={cascadeItem}`. When a row's own content
 * is itself a nested cascade, pass it
 * `cascadeItemSettleTime(baseDelay, index) + CASCADE_CONTENT_GAP` as its
 * `baseDelay`/`revealDelay`.
 */
export const CASCADE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const CASCADE_ITEM_DURATION = 0.25;
export const CASCADE_STAGGER = 0.04;
export const CASCADE_DELAY_CHILDREN = 0.02;
/** Small breathing room between a row settling in and its own content
 * starting — enough to read as sequential, not long enough to feel blank. */
export const CASCADE_CONTENT_GAP = 0.02;

export const cascadeContainer: Variants = {
  hidden: {},
  show: (baseDelay: number = 0) => ({
    transition: {
      staggerChildren: CASCADE_STAGGER,
      delayChildren: baseDelay + CASCADE_DELAY_CHILDREN,
    },
  }),
};

export const cascadeItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: CASCADE_ITEM_DURATION, ease: CASCADE_EASE },
  },
};

/** When the row at `index` within a `baseDelay`-shifted stagger finishes
 * appearing — the point its own nested content is free to start revealing. */
export function cascadeItemSettleTime(baseDelay: number, index: number): number {
  return baseDelay + CASCADE_DELAY_CHILDREN + index * CASCADE_STAGGER + (CASCADE_ITEM_DURATION * 0.4);
}
