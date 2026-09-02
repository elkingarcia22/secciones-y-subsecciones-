import { Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The "crear con IA" entry point — the same secondary AI button as
 * "Re-analizar" in the results tab: a static gradient border at rest, a
 * soft gradient wash that fades in on hover, and an icon that leans into the
 * gesture. Label and icon keep their own color at rest and on hover — no
 * color flip — so the gradient border stays the one thing announcing "this
 * calls the AI" instead of competing with the text for attention.
 */
interface AiCreateChipProps {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  icon?: LucideIcon;
  iconClassName?: string;
}

export function AiCreateChip({
  label = "Crear con IA",
  onClick,
  disabled,
  className,
  icon: Icon = Sparkles,
  iconClassName,
}: AiCreateChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex h-9 items-center gap-2 overflow-hidden rounded-lg border-ai-gradient-surface px-3.5 text-[13px] font-bold text-text-primary transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {/* Soft AI gradient wash on hover */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[inherit] bg-ai-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-10"
      />

      <Icon
        className={cn(
          "relative z-10 h-3.5 w-3.5 text-ai-gradient-start transition-transform duration-300",
          iconClassName
        )}
        strokeWidth={2.5}
      />
      <span className="relative z-10">{label}</span>
    </button>
  );
}
