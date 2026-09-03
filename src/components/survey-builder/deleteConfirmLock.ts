import * as React from "react";

/**
 * How many inline "¿eliminar esto?" confirmations are open right now, across
 * every question and demographic row and editor. While it's above zero the
 * floating action rail collapses and locks — a bulk action from the rail, or
 * picking it up to drag it, while a delete is one click away would be an
 * easy way to commit to the wrong thing.
 *
 * Kept outside React, same shape as `railAutoHide`/`railPosition`: any card
 * or editor anywhere in the tree can open its own confirmation, and the rail
 * lives in a sibling far up the tree — a context provider would work too,
 * but this needs no wrapping and re-renders only the rail, not everything
 * in between. A counter rather than a boolean, so one row cancelling can't
 * release a lock another row still holds.
 */
let openCount = 0;
const listeners = new Set<(count: number) => void>();

function notify(): void {
  listeners.forEach((listener) => listener(openCount));
}

/**
 * Call when a row or editor opens its inline delete confirmation. Returns
 * the matching release — call it exactly once, whether the confirmation is
 * cancelled, confirmed, or the row unmounts out from under it, so the lock
 * never outlives the confirmation that took it.
 */
export function acquireDeleteConfirmLock(): () => void {
  openCount += 1;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    openCount = Math.max(0, openCount - 1);
    notify();
  };
}

/** Whether at least one inline delete confirmation is open anywhere in the
 *  builder right now. */
export function useDeleteConfirmLock(): boolean {
  const [count, setCount] = React.useState(openCount);

  React.useEffect(() => {
    listeners.add(setCount);
    // A consumer mounting after the count changed must not show a stale value.
    setCount(openCount);
    return () => {
      listeners.delete(setCount);
    };
  }, []);

  return count > 0;
}

/** Holds the lock for as long as `isOpen` is true, releasing it on close or
 *  unmount. Drop into any component with its own `isConfirmingRemove`-style
 *  state instead of calling `acquireDeleteConfirmLock` by hand. */
export function useHoldDeleteConfirmLock(isOpen: boolean): void {
  React.useEffect(() => {
    if (!isOpen) return;
    return acquireDeleteConfirmLock();
  }, [isOpen]);
}
