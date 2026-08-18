import * as React from "react";

/**
 * Autosave status for a document that persists itself on every change.
 *
 * `idle` is the state before anything has been touched — nothing has been
 * saved *in this session*, which is not the same as unsaved work.
 */
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveState {
  status: AutosaveStatus;
  /** When the last successful save landed, or null if none yet this session. */
  savedAt: Date | null;
}

interface UseAutosaveOptions {
  /** How long the write is assumed to take, in ms. */
  duration?: number;
}

/**
 * Reports the autosave state of `value`: every change flips to "saving" and
 * settles on "saved".
 *
 * NOTE: there is no backend here. This models the timing so the indicator can
 * be designed and reviewed; swap the timer for the real request and surface
 * "error" from its rejection when persistence exists.
 */
export function useAutosave(value: unknown, { duration = 700 }: UseAutosaveOptions = {}): AutosaveState {
  const [status, setStatus] = React.useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  // Compared by identity rather than counting runs: StrictMode fires the effect
  // twice on mount, and a run counter would read the second one as a real edit
  // and claim a save the author never made.
  const baseline = React.useRef(value);

  React.useEffect(() => {
    if (Object.is(baseline.current, value)) return;

    setStatus("saving");
    const timer = window.setTimeout(() => {
      setStatus("saved");
      setSavedAt(new Date());
    }, duration);

    return () => window.clearTimeout(timer);
  }, [value, duration]);

  return { status, savedAt };
}
