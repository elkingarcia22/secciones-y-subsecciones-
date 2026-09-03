import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRailIsVertical, useRailPopoutSide } from "./railOrientation";

/**
 * One icon action inside a floating rail.
 *
 * Shared by every rail in the app so a button in the survey list, the results
 * screen and the demographics list are the same object — an action that looks
 * or disables differently depending on which rail holds it is a bug the eye
 * catches before the code does.
 */
export function RailButton({
  icon,
  label,
  onClick,
  blockedReason = null,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  /** Explains why the action is unavailable; when set, the button disables. */
  blockedReason?: string | null;
  tone?: "default" | "danger";
}) {
  const disabled = blockedReason !== null;
  const side = useRailPopoutSide();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            "dock-item hover-icon-pop relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
            tone === "danger"
              ? "text-status-negative hover:bg-status-negative/15 focus-visible:ring-status-negative/40 disabled:hover:text-status-negative"
              : "text-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-white/30 disabled:hover:text-white/60"
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[220px]">
        {blockedReason ?? label}
      </TooltipContent>
    </Tooltip>
  );
}

/** One entry of a rail's creation popover: icon, title and a line of why. */
export function RailCreateOption({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover-icon-pop group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-colors group-hover:bg-white/10 group-hover:text-white">
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[14px] font-bold tracking-tight text-white">{title}</span>
        <span className="text-[11px] font-medium text-white/45">{description}</span>
      </span>
    </button>
  );
}

/**
 * Staggered slide-in for a contextual action, re-fired whenever `animKey`
 * changes. `skipColorFlash` is for dividers and labels, which should not glow
 * indigo on arrival.
 */
export function AnimatedActionItem({
  animKey,
  staggerIndex,
  skipColorFlash = false,
  children,
}: {
  animKey: number;
  staggerIndex: number;
  skipColorFlash?: boolean;
  children: React.ReactNode;
}) {
  const delay = staggerIndex * 100;
  const animations = [
    `railActionAppear 550ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`,
  ];
  if (!skipColorFlash) {
    animations.push(`railActionColorFlash 1100ms ease-out ${delay + 150}ms both`);
  }
  return (
    <div key={animKey} className="rounded-xl" style={{ animation: animations.join(", ") }}>
      {children}
    </div>
  );
}

/**
 * The one filled call-to-action a rail is allowed: "Crear encuesta", "Crear
 * demográfico".
 *
 * Upright, the bar is one icon wide and the words have nowhere to go, so the
 * label steps back into a tooltip and the button becomes the same square as
 * its neighbours. It stays the primary colour either way — losing the label
 * should not also lose which button the screen is pointing at.
 *
 * Forwards its ref and spare props so it can sit inside a `PopoverTrigger
 * asChild` the way the plain markup it replaces did.
 */
export const RailPrimaryAction = React.forwardRef<
  HTMLButtonElement,
  { icon: React.ReactNode; label: string } & React.ComponentPropsWithoutRef<"button">
>(function RailPrimaryAction({ icon, label, className, ...props }, ref) {
  const isVertical = useRailIsVertical();
  const side = useRailPopoutSide();

  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "hover-icon-pop relative flex h-10 items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-semibold text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95",
        isVertical ? "w-10 px-0" : "px-4",
        className
      )}
      {...props}
    >
      {icon}
      {!isVertical && label}
    </button>
  );

  if (!isVertical) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
});
