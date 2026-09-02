import * as React from "react";
import { cn } from "@/lib/utils";

interface AiSparkGlyphProps {
  /** Lado del glifo en píxeles. */
  size?: number;
  className?: string;
}

/**
 * La chispa de la IA: el destello grande con dos satélites que laten a
 * destiempo.
 *
 * Vive suelta porque es la misma marca en dos tamaños muy distintos —el
 * panel de "Analizando" a 42 px y el aviso de un campo redactándose a 18— y
 * duplicar el SVG habría dejado dos dibujos que se separan al primer retoque.
 * El latido escalonado es lo único que la hace leerse como trabajo en curso,
 * así que va aquí dentro y no en quien la usa.
 */
export function AiSparkGlyph({ size = 42, className }: AiSparkGlyphProps) {
  // Cada instancia pinta con su propio degradado: dos glifos a la vez con el
  // mismo id harían que el segundo tomara el del primero.
  const gradientId = `${React.useId()}-ai-spark`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("relative shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(var(--ai-gradient-start))" />
          <stop offset="100%" stopColor="hsl(var(--ai-gradient-end))" />
        </linearGradient>
      </defs>
      <path
        d="M12,3 Q12,12 3,12 Q12,12 12,21 Q12,12 21,12 Q12,12 12,3 Z"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-[pulse_1.8s_infinite_ease-in-out]"
      />
      <path
        d="M19,5 Q19,7 17,7 Q19,7 19,9 Q19,7 21,7 Q19,7 19,5 Z"
        fill={`url(#${gradientId})`}
        className="animate-[pulse_1.3s_infinite_ease-in-out] [animation-delay:0.3s]"
      />
      <circle
        cx="5.5"
        cy="18.5"
        r="1.75"
        fill={`url(#${gradientId})`}
        className="animate-[pulse_1.5s_infinite_ease-in-out] [animation-delay:0.6s]"
      />
    </svg>
  );
}
