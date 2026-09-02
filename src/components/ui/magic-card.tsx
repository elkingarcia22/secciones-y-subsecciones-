"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MagicCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  isSelected?: boolean;
  contentClassName?: string;
  variant?: "primary" | "ai";
}

export function MagicCard({
  className,
  contentClassName,
  children,
  isSelected,
  variant = "primary",
  onClick,
  ...props
}: MagicCardProps) {
  const isAI = variant === "ai";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[12px] text-left",
        "magic-card-sweep magic-card-lift",
        isAI && "magic-card-sweep-ai",
        // Backgrounds
        isAI ? "bg-ai-mesh-card" : "bg-surface",
        // Borders & Active State — a constant 1.5px border (transparent when
        // unselected) keeps the selected ring from nudging the content when
        // it toggles on.
        isSelected && !isAI ? "border-[1.5px] border-primary bg-primary/5 text-primary" : "",
        isSelected && isAI ? "border-[1.5px] border-transparent text-ai-gradient-start ai-gradient-ring" : "",
        !isSelected && !isAI
          ? "border-[1.5px] border-border text-text-secondary hover:border-primary/40 hover:bg-primary/5"
          : "",
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
