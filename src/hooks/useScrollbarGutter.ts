import * as React from "react";

/**
 * Width the scrollbar takes from a scrolling element, in px — 0 when it isn't
 * scrolling or the platform uses overlay scrollbars.
 *
 * Lets a bar outside the scroll area reserve the same gutter, so both line up
 * on the right edge instead of drifting apart the moment content overflows.
 */
export function useScrollbarGutter(ref: React.RefObject<HTMLElement | null>): number {
  const [gutter, setGutter] = React.useState(0);

  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setGutter(element.offsetWidth - element.clientWidth);
    measure();

    // Content growing past the viewport is what makes the scrollbar appear, so
    // the gutter has to be re-read whenever the element resizes.
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return gutter;
}
