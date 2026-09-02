import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The secondary "create the first one yourself" action inside an empty
 * state — an outline pill instead of a filled button, so it reads as an
 * invitation rather than competing with a page's real primary action.
 * Shares its border-then-primary-tint hover with the AI alternative next to
 * it, so the two read as one pair of equally-weighted options.
 */
export interface EmptyStateActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

export function EmptyStateActionButton({
  icon,
  children,
  className,
  ...props
}: EmptyStateActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "group flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-[13px] font-semibold text-text-secondary transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
