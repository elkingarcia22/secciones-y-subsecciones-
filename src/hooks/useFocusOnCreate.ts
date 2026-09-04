import * as React from "react";

/**
 * Focuses and selects an input/textarea the moment `shouldFocus` turns true —
 * lands the cursor in a freshly created row's field with no extra click.
 * Deferred a frame so it wins any focus restoration already in flight (a
 * dropdown closing, a popover dismissing) from the click that created the row.
 */
export function useFocusOnCreate<T extends HTMLInputElement | HTMLTextAreaElement>(
  ref: React.RefObject<T | null>,
  shouldFocus: boolean
) {
  React.useEffect(() => {
    if (!shouldFocus) return;
    const frame = requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, [shouldFocus]);
}
