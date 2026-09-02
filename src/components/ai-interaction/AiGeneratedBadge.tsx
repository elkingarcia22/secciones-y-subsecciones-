import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AiGeneratedBadgeProps {
  className?: string;
}

/**
 * El sello "Generado con IA": mismo ícono en degradado de marca en secciones,
 * subsecciones y preguntas, para que se lea como IA a primera vista y no como
 * un badge de estado cualquiera.
 */
export function AiGeneratedBadge({ className }: AiGeneratedBadgeProps) {
  const gradientId = `${React.useId()}-ai-generated-badge`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center cursor-default", className)}>
          {/* Defs-only SVG: comparte el degradado con el ícono de al lado sin
              duplicar el <linearGradient> por cada instancia del badge. */}
          <svg width="0" height="0" className="absolute" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="hsl(var(--ai-gradient-start))" />
                <stop offset="1" stopColor="hsl(var(--ai-gradient-end))" />
              </linearGradient>
            </defs>
          </svg>
          <Sparkles className="h-3 w-3" strokeWidth={2.5} style={{ stroke: `url(#${gradientId})` }} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">Generado con IA</TooltipContent>
    </Tooltip>
  );
}
