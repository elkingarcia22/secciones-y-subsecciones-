import * as React from "react";

/** Marks the element a floating rail should line up with. */
export const ANCHOR_ATTRIBUTE = "data-builder-anchor";

/**
 * How long after the last scroll event the rail is still considered
 * "scrolling" — long enough to cover the gap between two scroll events during
 * a continuous gesture, short enough that a real pause reads as settled.
 */
const SCROLL_SETTLE_MS = 120;

export interface AnchorOffset {
  /** Vertical distance from the top of `columnRef` to the clamped target. */
  offset: number;
  /**
   * True from the first scroll event of a gesture until it settles. The rail
   * uses this to drop its transition while scrolling — animating a value that
   * is already being recomputed every frame is what reads as the rail
   * "fighting" to resettle instead of just holding still.
   */
  isScrolling: boolean;
}

/**
 * Vertical distance from the top of `columnRef` to the element inside
 * `scopeRef` marked with `[data-builder-anchor]` — clamped so the result never
 * pushes `elementRef` above or below the part of `scopeRef` actually visible
 * on screen.
 *
 * Lets a rail of actions sit beside whatever the author has active instead of
 * pinned to the top of the page, without threading a ref through every layer of
 * the section tree: the active component tags itself and the rail finds it.
 * The clamp is what keeps that rail on screen once the anchor scrolls out of
 * view — without it, tracking the anchor exactly would carry the rail off with
 * it, which defeats the point of a rail of actions the author can always reach.
 *
 * No padding is added on top of `scopeRef`'s own box: `scopeRef` is expected to
 * sit flush against the same padding every other column already shares, so
 * clamping to its edges exactly lines the rail up with them — adding a second
 * margin here would just offset it from its neighbours instead.
 *
 * Returns offset 0 when nothing is marked, which parks the rail at the top of
 * the column — itself clamped the same way once the column's own top scrolls
 * away.
 */
export function useAnchorOffset(
  columnRef: React.RefObject<HTMLElement | null>,
  scopeRef: React.RefObject<HTMLElement | null>,
  elementRef: React.RefObject<HTMLElement | null>,
  deps: React.DependencyList
): AnchorOffset {
  const [offset, setOffset] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);

  React.useLayoutEffect(() => {
    const column = columnRef.current;
    const scope = scopeRef.current;
    if (!column || !scope) return;

    const measure = () => {
      const anchor = scope.querySelector<HTMLElement>(`[${ANCHOR_ATTRIBUTE}]`);
      const columnRect = column.getBoundingClientRect();
      // scope is the scrolling container itself, so its own box stays put in
      // viewport coordinates no matter how far its content has scrolled — the
      // stable frame the clamp is measured against.
      const scopeRect = scope.getBoundingClientRect();
      const railHeight = elementRef.current?.getBoundingClientRect().height ?? 0;

      const desiredTop = anchor ? anchor.getBoundingClientRect().top : columnRect.top;
      const minTop = scopeRect.top;
      const maxTop = Math.max(minTop, scopeRect.bottom - railHeight);
      const clampedTop = Math.min(Math.max(desiredTop, minTop), maxTop);

      setOffset(Math.max(0, Math.round(clampedTop - columnRect.top)));
    };

    let settleTimeout: number | undefined;
    const handleScroll = () => {
      setIsScrolling(true);
      measure();
      window.clearTimeout(settleTimeout);
      settleTimeout = window.setTimeout(() => setIsScrolling(false), SCROLL_SETTLE_MS);
    };

    measure();

    // Accordions animate open and closed, so the anchor keeps moving for a few
    // hundred ms after the state change. Watching the scope's size re-measures
    // through the whole transition instead of guessing when it ends.
    const observer = new ResizeObserver(measure);
    observer.observe(scope);

    // The clamp range comes from scope's own box, which resize alone won't
    // catch moving — only scrolling `scope` (or the window resizing) shifts
    // the column within it, so both need their own listener.
    scope.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      scope.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measure);
      window.clearTimeout(settleTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { offset, isScrolling };
}
