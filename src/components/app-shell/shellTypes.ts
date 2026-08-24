/** Which surface the shell is presenting: the product workspace or the AI agent (visual only). */
export type ShellMode = "workspace" | "agent";

/** Status pill rendered next to the breadcrumb (e.g. a survey's "Finalizada"). */
export interface ShellBreadcrumbBadge {
  label: string;
  tone: "positive" | "neutral" | "warning";
}

/** Breadcrumb shown in the header: optional parent trail + current label. */
export interface ShellBreadcrumb {
  parent?: string;
  /**
   * The current crumb. Optional: a screen that owns a live title (one being
   * typed) renders it into the header slot instead — see `ShellHeaderSlot`.
   */
  label?: string;
  badge?: ShellBreadcrumbBadge;
  /**
   * Makes the parent crumb the way back out of a detail screen. Without it the
   * parent is plain text.
   */
  onParentClick?: () => void;
}
