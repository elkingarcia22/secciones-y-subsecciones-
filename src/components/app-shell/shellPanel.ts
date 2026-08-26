/**
 * Shared surface for the shell's floating menus — company, notifications and
 * avatar. Popover's base hairline ring is swapped for the same border plus
 * elevation the shell's own panels use, so a menu reads as a sheet lifted off
 * the layout instead of a tinted overlay that melts into the surface behind
 * it. `shadow-drawer` is the configured utility — `shadow-[var(--shadow-drawer)]`
 * gets read as a shadow *colour* by Tailwind and silently renders nothing.
 */
export const SHELL_MENU_PANEL =
  "rounded-2xl border border-border/60 p-2 shadow-drawer ring-0";
