import * as React from "react";

/**
 * Radix overlays portal outside their trigger, to the end of <body>. A press
 * that lands on one of these is a press *inside* the control the author is
 * using — opening a select or holding a tooltip open should not count as a
 * click outside whatever editor is open, or it would slam the editor shut
 * underneath the very control that needs it.
 */
const OVERLAY_SELECTOR = [
  '[data-slot="select-content"]',
  '[data-slot="dropdown-menu-content"]',
  '[data-slot="tooltip-content"]',
  '[data-slot="popover-content"]',
  '[data-slot="hover-card-content"]',
  '[data-slot="dialog-content"]',
  '[data-slot="alert-dialog-content"]',
].join(",");

/**
 * A press on one of these is a press on a control that will replace the open
 * editor itself — the rail's creation buttons repoint the editor to whatever
 * they create, so closing it here on `mousedown` would move the rail (its
 * anchor falls back to the accordion) and swallow the button's own `click`.
 */
const IGNORE_SELECTOR = "[data-click-outside-ignore]";

/**
 * Calls `onClose` when a press lands outside `ref`. Listens on `mousedown`
 * (and `touchstart`), so the close happens on the same gesture that will open
 * or edit whatever was pressed — it never needs a second click.
 *
 * Escape is left to each editor: a form with a confirmation banner wants to
 * dismiss that banner first rather than skip past it.
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled = true
): void {
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      // Radix modals (Select, DropdownMenu) lock scroll and block pointer events
      // outside the portal. Clicking outside them targets `body`, which would trigger
      // a false-positive outside click. We ignore these so dismissing a list doesn't
      // also close the editor.
      if (document.body.hasAttribute("data-scroll-locked")) return;

      const target = event.target;
      if (!(target instanceof Node)) return;
      if (ref.current && ref.current.contains(target)) return;
      if (
        target instanceof Element &&
        (target.closest(OVERLAY_SELECTOR) || target.closest(IGNORE_SELECTOR))
      )
        return;
      onCloseRef.current();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [ref, enabled]);
}