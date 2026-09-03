import * as React from "react";

/**
 * Where the floating rail sits once the reader has dragged it off its default
 * bottom-centre dock.
 *
 * Kept outside React, same reasoning as `railAutoHide`: this is one bar as
 * far as the reader is concerned, so a drag on one screen should still hold
 * on the next screen within the same visit. It is deliberately *not*
 * persisted to storage — a reload is a fresh start, and should always land
 * the rail back at its default dock rather than wherever it was last left.
 * `null` means "no drag yet — sit at the default dock".
 */

export interface RailPosition {
  x: number;
  y: number;
}

let position: RailPosition | null = null;
const listeners = new Set<(value: RailPosition | null) => void>();

export function setRailPosition(value: RailPosition | null): void {
  position = value;
  listeners.forEach((listener) => listener(value));
}

/** The shared drag position, and the setter dragging and the reset both call. */
export function useRailPosition(): readonly [
  RailPosition | null,
  (value: RailPosition | null) => void,
] {
  const [value, setValue] = React.useState(position);

  React.useEffect(() => {
    listeners.add(setValue);
    // A rail mounting after another one moved it must not show a stale spot.
    setValue(position);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  return [value, setRailPosition];
}
