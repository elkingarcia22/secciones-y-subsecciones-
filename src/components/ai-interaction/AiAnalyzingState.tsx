import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AiSparkGlyph } from "./AiSparkGlyph";

interface AiAnalyzingStateProps {
  /** El titular. Puede cambiar mientras el proceso avanza: cada cambio entra
   * con un fundido, que es lo que hace que el trabajo se lea como una
   * secuencia y no como una barra que sube sola. */
  title: string;
  /** 0–100. Sin él el trabajo se lee como indeterminado y la barra no sale:
   * hay esperas que no saben cuánto les queda. */
  progress?: number;
  /** La línea de la izquierda, sobre la barra: qué se está produciendo. */
  detail?: string;
  /** La frase de abajo: qué está pasando, en una línea. */
  caption?: string;
  /**
   * `panel` es el bloque grande, para cuando la espera ocupa la pantalla.
   * `inline` es la misma chispa reducida a una línea, para huecos donde el
   * bloque no cabe —un campo que se está redactando, por ejemplo—.
   */
  variant?: "panel" | "inline";
  className?: string;
}

/**
 * El estado "la IA está trabajando" de la plataforma.
 *
 * Vive aquí y no en una pantalla concreta porque es la única forma en que la
 * IA dice "dame un momento" en todo el producto, y dos versiones distintas
 * del mismo momento le harían dudar al usuario de si está viendo el mismo
 * sistema. Lo que cambia entre sitios es el texto y el tamaño, nunca la pieza.
 */
export function AiAnalyzingState({
  title,
  progress,
  detail,
  caption,
  variant = "panel",
  className,
}: AiAnalyzingStateProps) {
  if (variant === "inline") {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("flex min-w-0 select-none items-center gap-2", className)}
      >
        <AiSparkGlyph size={18} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={title}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="truncate text-[12.5px] font-semibold text-ai-gradient"
          >
            {title}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  const value =
    typeof progress === "number" ? Math.max(0, Math.min(100, Math.round(progress))) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "shimmer-mirror relative flex min-h-[300px] animate-in select-none flex-col rounded-xl bg-ai-gradient p-[2px] shadow-card duration-300 fade-in",
        className
      )}
    >
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-6 rounded-[calc(var(--radius-xl)-2px)] bg-surface p-6">
        <div className="relative mb-1 flex h-16 w-16 items-center justify-center">
          <div className="absolute h-11 w-11 animate-pulse rounded-full bg-ai-gradient opacity-20 blur-xl" />
          <AiSparkGlyph size={42} />
        </div>

        <div className="flex min-h-[24px] flex-col items-center gap-1.5 text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={title}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="text-[16px] font-bold text-ai-gradient"
            >
              {title}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-2">
          {value !== null && (
            <>
              <div className="flex items-end justify-between text-[12px] font-bold">
                <span className="text-text-secondary">{detail}</span>
                <span className="text-ai-gradient">{value}%</span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-ai-gradient transition-all duration-300"
                  style={{ width: `${value}%` }}
                />
              </div>
            </>
          )}
          {caption && (
            <p className="mt-2 text-center text-[11px] text-text-secondary">{caption}</p>
          )}
        </div>
      </div>
    </div>
  );
}
