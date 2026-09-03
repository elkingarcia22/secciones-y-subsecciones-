"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toneAccent, toneSelected, type Tone } from "@/lib/tone";

interface MagicCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  isSelected?: boolean;
  contentClassName?: string;
  variant?: "primary" | "ai";
  /**
   * The accent this card is picked in. Left unset it stays brand blue, which
   * is what a lone card or a yes/no pair wants. Set it when the card is one
   * of a set that already has its own colors — the survey kinds, the ways of
   * choosing participants — so being selected reads in that card's own hue
   * instead of turning every option the same blue.
   */
  tone?: Tone;
}

export function MagicCard({
  className,
  contentClassName,
  children,
  isSelected,
  variant = "primary",
  tone,
  style,
  onClick,
  ...props
}: MagicCardProps) {
  const isAI = variant === "ai";
  // `ai` keeps its own mesh-and-gradient-ring treatment; a tone only ever
  // repaints the plain variant.
  const isToned = !isAI && tone !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      // `--tone` drives the hover wash, outline and shadow from CSS (see
      // `.magic-card-toned` in globals.css); the selected state is painted
      // here, where the three weights come from one call.
      style={
        isToned
          ? ({
              "--tone": toneAccent(tone),
              ...(isSelected ? toneSelected(tone) : null),
              ...style,
            } as React.CSSProperties)
          : style
      }
      className={cn(
        "group relative overflow-hidden rounded-[12px] text-left",
        "magic-card-sweep magic-card-lift",
        isAI && "magic-card-sweep-ai",
        // Backgrounds
        isAI ? "bg-ai-mesh-card" : "bg-surface",
        // Borders & Active State — a constant 1.5px border (transparent when
        // unselected) keeps the selected ring from nudging the content when
        // it toggles on. A toned card gets that same 1.5px, but its color,
        // wash and text arrive from the `style` above.
        isToned && "magic-card-toned",
        isSelected && "magic-card-selected",
        isSelected && isToned ? "border-[1.5px]" : "",
        isSelected && !isToned && !isAI ? "border-[1.5px] border-primary bg-primary/5 text-primary" : "",
        isSelected && isAI ? "border-[1.5px] border-transparent text-ai-gradient-start ai-gradient-ring" : "",
        // The untoned card hovers in brand blue; a toned one takes its own
        // accent from `.magic-card-toned` instead.
        !isSelected && !isAI && !isToned
          ? "border-[1.5px] border-border text-text-secondary hover:border-primary/40 hover:bg-primary/5"
          : "",
        !isSelected && isToned ? "border-[1.5px] border-border text-text-secondary" : "",
        !isSelected && isAI
          ? "border-[1.5px] border-border text-text-secondary hover:border-ai-gradient-start/40 hover:bg-ai-gradient-start/5"
          : "",
        "p-4",
        className
      )}
      {...props}
    >
      <div className={cn("relative z-[1] flex w-full", contentClassName)}>
        {children}
      </div>
    </button>
  );
}
