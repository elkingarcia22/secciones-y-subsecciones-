import * as React from "react";
import { createPortal } from "react-dom";

/**
 * The header's crumb area, exposed to whichever screen is mounted.
 *
 * A detail screen often owns identity the shell cannot know statically — a name
 * being typed, an autosave state, a lifecycle chip. Rather than lift that state
 * up to the router just so the header can read it, the screen renders it here
 * and keeps owning it.
 */
const ShellHeaderSlotContext = React.createContext<HTMLElement | null>(null);

export const ShellHeaderSlotProvider = ShellHeaderSlotContext.Provider;

/**
 * Renders its children into the shell header, beside the breadcrumb. Renders
 * nothing when there is no shell (the host is not mounted yet on first paint,
 * which is why this reads the element from state rather than a ref).
 */
export function ShellHeaderSlot({ children }: { children: React.ReactNode }) {
  const host = React.useContext(ShellHeaderSlotContext);
  if (!host) return null;
  return createPortal(children, host);
}
