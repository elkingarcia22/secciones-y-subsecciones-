import * as React from "react";

/**
 * Lightweight drag-to-reorder built on native HTML5 drag events.
 * Avoids a DnD dependency for the simple vertical-list case.
 */

interface DragHandleProps {
  draggable: true;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

interface DropTargetProps {
  onDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLElement>) => void;
}

interface UseDragReorderResult {
  /** Id of the item currently being dragged, if any. */
  draggingId: string | null;
  /** Id of the item the pointer is hovering as a drop target, if any. */
  overId: string | null;
  getHandleProps: (id: string) => DragHandleProps;
  getDropTargetProps: (id: string) => DropTargetProps;
}

export function useDragReorder(
  onReorder: (fromId: string, toId: string) => void
): UseDragReorderResult {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const reset = React.useCallback(() => {
    setDraggingId(null);
    setOverId(null);
  }, []);

  const getHandleProps = React.useCallback(
    (id: string): DragHandleProps => ({
      draggable: true,
      onDragStart: (event) => {
        setDraggingId(id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", id);
      },
      onDragEnd: reset,
    }),
    [reset]
  );

  const getDropTargetProps = React.useCallback(
    (id: string): DropTargetProps => ({
      onDragOver: (event) => {
        // Preventing default is what marks this element as a valid drop target.
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOverId((current) => (current === id ? current : id));
      },
      onDragLeave: () => {
        setOverId((current) => (current === id ? null : current));
      },
      onDrop: (event) => {
        event.preventDefault();
        const fromId = draggingId ?? event.dataTransfer.getData("text/plain");
        if (fromId && fromId !== id) onReorder(fromId, id);
        reset();
      },
    }),
    [draggingId, onReorder, reset]
  );

  return { draggingId, overId, getHandleProps, getDropTargetProps };
}
