import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AiAnalyzingState } from "@/components/ai-interaction";
import { AiCreateChip } from "./AiCreateChip";
import {
  WORDING_SHORTCUTS,
  generateQuestionFromContext,
  refineQuestionWording,
  type RefineIntent,
} from "./aiQuestionWording";
import type { QuestionType } from "./surveyBuilderTypes";

interface AiStatementFieldProps {
  value: string;
  onChange: (value: string) => void;
  /**
   * Se llama solo cuando la IA escribió la pregunta desde cero: de una frase
   * de contexto sale el enunciado y también qué tipo de respuesta le
   * corresponde. Llega en un único aviso, y no como un `onChange` seguido de
   * un cambio de tipo, porque los dos escriben sobre la misma pregunta: dos
   * avisos en el mismo tick harían que el segundo pisara al primero.
   */
  onGenerated?: (generated: { statement: string; type: QuestionType }) => void;
  placeholder?: string;
  ariaLabel?: string;
  error?: string;
  rows?: number;
  disabled?: boolean;
  /**
   * Abre el campo ya pidiendo contexto, sin que haya que pulsar el botón.
   * Lo usa "crear pregunta con IA": ahí la decisión de usar la IA ya está
   * tomada en el rail, y volver a pedirla aquí sería preguntar dos veces.
   */
  autoStart?: boolean;
}

/**
 * El enunciado de una pregunta, con la IA al lado.
 *
 * La IA tiene dos trabajos aquí y cuál toca lo decide lo que haya escrito, no
 * un menú:
 *
 * - Campo con texto → mejora la redacción. No pregunta nada porque no le falta
 *   nada: la pregunta ya está dicha, solo mal dicha. Debajo aparecen los
 *   atajos, que son la misma acción con una intención concreta.
 * - Campo vacío → no hay qué mejorar, así que el propio campo pasa a pedir una
 *   frase de contexto y de ahí sale el enunciado entero.
 *
 * Es el mismo par generar/mejorar del resto de la plataforma, y por eso el
 * botón es de borde degradado y no sólido: escribir la pregunta a mano sigue
 * siendo la acción principal del formulario.
 */
export function AiStatementField({
  value,
  onChange,
  onGenerated,
  placeholder = "Escribe aquí la pregunta o enunciado",
  ariaLabel = "Pregunta o enunciado",
  error,
  rows = 2,
  disabled = false,
  autoStart = false,
}: AiStatementFieldProps) {
  // `autoStart` solo decide con qué fase se monta: una vez dentro, el campo
  // manda sobre sí mismo y volver a montarlo no debe reabrir la pregunta.
  const [phase, setPhase] = React.useState<"idle" | "context" | "working">(
    autoStart && value.trim() === "" ? "context" : "idle"
  );
  const [workingLabel, setWorkingLabel] = React.useState("Redactando la pregunta…");
  const fieldRef = React.useRef<HTMLTextAreaElement>(null);

  // El foco va al campo en cuanto se abre pidiendo contexto, para poder
  // escribir sin buscar dónde.
  React.useEffect(() => {
    if (phase === "context") fieldRef.current?.focus();
  }, [phase]);

  const isWorking = phase === "working";
  const isAskingContext = phase === "context";
  const hasText = value.trim() !== "";

  // La IA tarda un momento y el autor puede seguir escribiendo mientras, así
  // que se lee el texto de cuando la IA termina y no de cuando se pulsó.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  const run = async (mode: "generate" | "refine", intent?: RefineIntent) => {
    const source = valueRef.current.trim();
    if (source === "") return;

    setWorkingLabel(mode === "generate" ? "Redactando la pregunta…" : "Mejorando la redacción…");
    setPhase("working");

    if (mode === "generate") {
      const generated = await generateQuestionFromContext(source);
      // Un solo aviso cuando quien nos usa sabe qué hacer con el tipo; si no,
      // al menos el enunciado entra por la vía normal.
      if (onGenerated) onGenerated(generated);
      else onChange(generated.statement);
    } else {
      onChange(await refineQuestionWording(source, intent));
    }

    setPhase("idle");
  };

  const handleTrigger = () => {
    if (isWorking) return;

    // Nada escrito: el campo se convierte en la pregunta "¿de qué va?".
    if (phase === "idle" && !hasText) {
      setPhase("context");
      return;
    }

    void run(isAskingContext ? "generate" : "refine");
  };

  const triggerLabel = isWorking
    ? "Redactando…"
    : !hasText || isAskingContext
      ? "Generar con IA"
      : "Mejorar con IA";

  // Los atajos solo tienen sentido sobre un texto que ya existe: son formas de
  // mejorar lo escrito, no de escribirlo.
  const showShortcuts = phase === "idle" && hasText && !disabled;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="text-[13px] font-semibold text-text-primary">{ariaLabel}</span>

      <div className="flex items-start gap-3">
        <textarea
          ref={fieldRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (!isAskingContext) return;
            // Enter cierra el paso sin ir al botón; Escape deja el campo como
            // estaba, siendo otra vez el enunciado.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleTrigger();
            } else if (event.key === "Escape") {
              event.stopPropagation();
              setPhase("idle");
            }
          }}
          rows={rows}
          disabled={disabled || isWorking}
          placeholder={
            isAskingContext
              ? "Cuéntanos de qué va: por ejemplo, la carga de trabajo del equipo"
              : placeholder
          }
          aria-label={isAskingContext ? "Contexto para que la IA escriba la pregunta" : ariaLabel}
          aria-invalid={!!error}
          className={cn(
            "min-w-0 flex-1 resize-y rounded-md border bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-all focus:ring-2 placeholder:text-muted-foreground/70 disabled:opacity-60",
            isAskingContext
              ? "border-ai-gradient-start/50 focus:border-ai-gradient-start focus:ring-ai-gradient-start/20"
              : error
                ? "border-destructive focus:border-destructive focus:ring-destructive/25"
                : "border-border focus:border-primary focus:ring-primary/25"
          )}
        />

        <AiCreateChip
          label={triggerLabel}
          onClick={handleTrigger}
          disabled={disabled || isWorking || (isAskingContext && !hasText)}
          className="h-10 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {isAskingContext && (
        <p className="text-[12px] leading-relaxed text-text-secondary">
          Todavía no hay nada que mejorar. Escribe en una frase de qué quieres que vaya la
          pregunta y la redactamos por ti, con su tipo de respuesta.
        </p>
      )}

      {isWorking && <AiAnalyzingState variant="inline" title={workingLabel} />}

      {showShortcuts && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-1.5"
        >
          {WORDING_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.id}
              type="button"
              onClick={() => void run("refine", shortcut.id)}
              className="rounded-full border border-border/70 bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-text-secondary transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.97]"
            >
              {shortcut.label}
            </button>
          ))}
        </motion.div>
      )}

      {error && <span className="text-[12px] text-destructive">{error}</span>}
    </div>
  );
}
