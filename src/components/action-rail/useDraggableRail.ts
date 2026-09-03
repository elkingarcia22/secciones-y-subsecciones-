import * as React from "react";
import { useRailPosition, type RailPosition } from "./railPosition";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Lets a floating rail be picked up by its grip and dropped anywhere on
 * screen. Works whether the rail is pinned open or in auto-hide mode — the
 * caller is responsible for keeping the rail expanded (and its collapse
 * timer suspended) for as long as `isDragging` is true, so the grip doesn't
 * vanish out from under the pointer mid-gesture.
 *
 * `barRef` must land on the element whose box the drag repositions — the same
 * one the caller applies the returned `position` to via `left`/`top` once it
 * is non-null, so the pointer stays glued to the spot it grabbed.
 */
export function useDraggableRail() {
  const [storedPosition, setStoredPosition] = useRailPosition();
  const [dragPosition, setDragPosition] = React.useState<RailPosition | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const barRef = React.useRef<HTMLDivElement>(null);
  const dragOffsetRef = React.useRef<{ x: number; y: number } | null>(null);

  const position = dragPosition ?? storedPosition;

  // Keeps a dragged rail on-screen if the viewport shrinks under it (window
  // resize, device rotation).
  React.useEffect(() => {
    if (!storedPosition) return;
    const clampToViewport = () => {
      const rect = barRef.current?.getBoundingClientRect();
      if (!rect) return;
      const maxX = Math.max(window.innerWidth - rect.width, 0);
      const maxY = Math.max(window.innerHeight - rect.height, 0);
      const next = {
        x: clamp(storedPosition.x, 0, maxX),
        y: clamp(storedPosition.y, 0, maxY),
      };
      if (next.x !== storedPosition.x || next.y !== storedPosition.y) {
        setStoredPosition(next);
      }
    };
    clampToViewport();
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [storedPosition, setStoredPosition]);

  const onGripPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onGripPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const offset = dragOffsetRef.current;
    if (!offset) return;
    const width = barRef.current?.offsetWidth ?? 0;
    const height = barRef.current?.offsetHeight ?? 0;
    const maxX = Math.max(window.innerWidth - width, 0);
    const maxY = Math.max(window.innerHeight - height, 0);
    setDragPosition({
      x: clamp(event.clientX - offset.x, 0, maxX),
      y: clamp(event.clientY - offset.y, 0, maxY),
    });
  };

  const endGripDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragOffsetRef.current) return;
    dragOffsetRef.current = null;
    setIsDragging(false);
    setDragPosition((current) => {
      if (current) setStoredPosition(current);
      return null;
    });
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const resetPosition = React.useCallback(() => {
    dragOffsetRef.current = null;
    setDragPosition(null);
    setStoredPosition(null);
  }, [setStoredPosition]);

  return {
    barRef,
    position,
    isDragging,
    resetPosition,
    gripHandlers: {
      onPointerDown: onGripPointerDown,
      onPointerMove: onGripPointerMove,
      onPointerUp: endGripDrag,
      onPointerCancel: endGripDrag,
      onDoubleClick: resetPosition,
    },
  } as const;
}
