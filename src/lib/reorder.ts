/**
 * Immutable list reordering helpers shared by drag-and-drop surfaces.
 */

/** Returns a new array with the item at `from` moved to `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items];
  }

  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Returns a new array with the item identified by `fromId` moved before/after `toId`. */
export function moveItemById<T extends { id: string }>(
  items: readonly T[],
  fromId: string,
  toId: string
): T[] {
  const from = items.findIndex((item) => item.id === fromId);
  const to = items.findIndex((item) => item.id === toId);

  if (from === -1 || to === -1) return [...items];
  return moveItem(items, from, to);
}
