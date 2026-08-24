import * as React from "react";

/**
 * Whether the floating rail tucks itself away when the pointer leaves.
 *
 * Kept outside React on purpose: each screen mounts its own rail, so a
 * preference living in one of them would reset the moment the reader switched
 * tabs — the bar would forget it had been told to hide. This is one bar as far
 * as the reader is concerned, so it gets one piece of state, persisted so it
 * also survives a reload.
 */

const STORAGE_KEY = "ubits.actionRail.autoHide.v1";

function read(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

let autoHide = read();
const listeners = new Set<(value: boolean) => void>();

export function setRailAutoHide(value: boolean): void {
  if (value === autoHide) return;
  autoHide = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Storage blocked — the session still works, just without persistence.
  }
  listeners.forEach((listener) => listener(value));
}

/** The shared preference, and the setter every rail's toggle calls. */
export function useRailAutoHide(): readonly [boolean, (value: boolean) => void] {
  const [value, setValue] = React.useState(autoHide);

  React.useEffect(() => {
    listeners.add(setValue);
    // A rail mounting after another one changed it must not show a stale value.
    setValue(autoHide);
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  return [value, setRailAutoHide];
}
