import * as React from "react";

/**
 * Whether the floating rail lies along the bottom of the screen or stands on
 * its right edge.
 *
 * Same reasoning as `railAutoHide`: this is one bar as far as the reader is
 * concerned, so the choice can't live inside whichever screen happens to be
 * mounted — turning the bar vertical on the survey list and finding it flat
 * again on demographics would read as two different bars. Persisted, so it
 * also survives a reload.
 */

export type RailOrientation = "horizontal" | "vertical";

const STORAGE_KEY = "ubits.actionRail.orientation.v1";

function read(): RailOrientation {
  if (typeof window === "undefined") return "horizontal";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "vertical" ? "vertical" : "horizontal";
  } catch {
    return "horizontal";
  }
}

let orientation: RailOrientation = read();
const listeners = new Set<(value: RailOrientation) => void>();

export function setRailOrientation(value: RailOrientation): void {
  if (value === orientation) return;
  orientation = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage blocked — the session still works, just without persistence.
  }
  listeners.forEach((listener) => listener(value));
}

/** The shared orientation, and the setter the rail's settings menu calls. */
export function useRailOrientation(): readonly [RailOrientation, (value: RailOrientation) => void] {
  const [value, setValue] = React.useState(orientation);

  React.useEffect(() => {
    listeners.add(setValue);
    // A rail mounting after another one turned it must not show a stale axis.
    setValue(orientation);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  return [value, setRailOrientation];
}

/**
 * The axis the surrounding rail is drawn on, for the pieces inside it.
 *
 * Buttons, chips and dividers all need the same answer — which way to lay a
 * rule, which side to pop a tooltip out on — and none of them should have to
 * be passed it by every screen that builds a rail. The shell provides it once.
 */
export const RailOrientationContext = React.createContext<RailOrientation | null>(null);

/**
 * The axis to draw against: the surrounding shell's, or — for a screen
 * building rail contents from *outside* that shell, which is where the two
 * slots are assembled — the shared preference itself. Both answers are the
 * same value; the context just saves a subscription for the common case.
 */
export function useRailAxis(): RailOrientation {
  const fromShell = React.useContext(RailOrientationContext);
  const [preference] = useRailOrientation();
  return fromShell ?? preference;
}

export function useRailIsVertical(): boolean {
  return useRailAxis() === "vertical";
}

/**
 * Where a tooltip or popover belonging to a rail item should open: above the
 * bar when it lies flat, beside it when it stands on the right edge — in both
 * cases, away from the bar rather than on top of it.
 */
export function useRailPopoutSide(): "top" | "left" {
  return useRailIsVertical() ? "left" : "top";
}
