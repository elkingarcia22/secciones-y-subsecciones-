import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GuidedStepProps {
  /** Posición 1-based dentro del bloque que lo ordena. */
  number: number;
  question: string;
  /** Por qué existe este paso, en una línea. Siempre presente: un paso que no
   * puede explicarse solo es el campo que el autor va a adivinar. */
  help: string;
  children: React.ReactNode;
  className?: string;
  /** Segundos de espera antes de aparecer. Sirve para encadenar la entrada
   * cuando varios pasos se montan a la vez —al volver al brief desde la
   * revisión, por ejemplo— para que caigan en cascada en vez de todos de
   * golpe. Cuando se revela uno solo, se queda en 0. */
  delay?: number;
}

/**
 * Una pregunta dentro de un bloque guiado.
 *
 * El bloque es un formulario, pero se presenta como una conversación: una
 * pregunta numerada, la razón por la que se hace, y luego el control. Los
 * pasos se montan a medida que el anterior se responde, así que el autor
 * nunca está mirando un campo cuyo significado depende de una decisión que
 * todavía no ha tomado.
 *
 * La entrada es lenta y desenfocada a propósito: un paso que aparece de golpe
 * se lee como un salto de la interfaz, mientras que uno que se va enfocando
 * mientras sube se lee como la conversación avanzando. El desenfoque es lo
 * que da esa sensación de "venía de más atrás" sin mover nada de sitio.
 */
export function GuidedStep({
  number,
  question,
  help,
  children,
  className,
  delay = 0,
}: GuidedStepProps) {
  // Quien pidió menos movimiento recibe el mismo contenido sin el viaje: la
  // aparición se resuelve en opacidad y nada más.
  const prefersReducedMotion = useReducedMotion();

  const hidden = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, y: 18, filter: "blur(10px)" };
  const shown = prefersReducedMotion
    ? { opacity: 1 }
    : { opacity: 1, y: 0, filter: "blur(0px)" };

  return (
    <motion.section
      data-guided-step
      initial={hidden}
      animate={shown}
      transition={{
        duration: prefersReducedMotion ? 0.2 : 0.65,
        delay,
        ease: [0.16, 1, 0.3, 1],
        // El desenfoque se despeja antes que el viaje: así el texto ya se
        // puede leer mientras el bloque termina de asentarse.
        filter: { duration: prefersReducedMotion ? 0.2 : 0.45, delay, ease: "easeOut" },
      }}
      // Margen para `scrollIntoView`: cuando el bloque lleva el foco a este
      // paso, deja aire arriba y abajo en vez de pegarlo al borde.
      className={cn("relative scroll-mb-16 scroll-mt-6 pl-9", className)}
    >
      {/* El conector corre por detrás del número, para que las preguntas se
          lean como un solo hilo y no como cajas apiladas por accidente. */}
      <span
        aria-hidden
        className="absolute left-[13px] top-7 h-[calc(100%-0.5rem)] w-px bg-border/70"
      />

      <span
        aria-hidden
        className="absolute left-0 top-0 flex size-[27px] items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold tabular-nums text-primary"
      >
        {number}
      </span>

      <header className="flex flex-col gap-0.5 pb-3">
        <h4 className="text-[13.5px] font-semibold leading-snug text-text-primary">{question}</h4>
        <p className="max-w-[75ch] text-[12px] leading-relaxed text-text-secondary">{help}</p>
      </header>

      {children}
    </motion.section>
  );
}
