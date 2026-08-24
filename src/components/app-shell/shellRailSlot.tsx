import * as React from "react";
import { createPortal } from "react-dom";

/**
 * The floating-rail anchor at the bottom of the shell's content area.
 *
 * A screen's action rail has to stay pinned above the fold, but the home's
 * content column is what scrolls — a rail rendered inside it would scroll away
 * with the table. This host lives in the shell's non-scrolling `main`, so a
 * screen can own its rail while the shell owns where it floats.
 */
const ShellRailSlotContext = React.createContext<HTMLElement | null>(null);

export const ShellRailSlotProvider = ShellRailSlotContext.Provider;

/** Renders its children into the shell's bottom-centred rail anchor. */
export function ShellRailSlot({ children }: { children: React.ReactNode }) {
  const host = React.useContext(ShellRailSlotContext);
  if (!host) return null;
  return createPortal(children, host);
}
