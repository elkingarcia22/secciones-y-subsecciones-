import * as React from "react";

/**
 * Resets local state when the thing it belongs to changes.
 *
 * A list's paging, a panel's selection, which branch is open — all of it is
 * state *about* a particular input, and it has to start over when that input
 * changes. The obvious way to write that is an effect, which is wrong: the
 * component first paints the stale value (page 3 of a list that now has one
 * page) and only then corrects itself. Adjusting during render, React's own
 * recommendation for this case, skips the wrong frame entirely.
 *
 * `key` is whatever identifies the input — a query string, an id, a joined
 * signature. `reset` runs during render, so it may only set state.
 */
export function useResetOnChange(key: string, reset: () => void): void {
  const [previous, setPrevious] = React.useState(key);

  if (previous !== key) {
    setPrevious(key);
    reset();
  }
}
