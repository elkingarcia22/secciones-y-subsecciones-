import * as React from "react";
import { cn } from "@/lib/utils";
import { MovingBorderBeam } from "@/components/ui/moving-border-beam";
import { ArrowUp, Plus, Sparkles, X } from "lucide-react";
import { AI_GRADIENT, CURRENT_USER } from "@/components/app-shell/appShellData";

export type AiAgentContext = "dashboard" | "builder" | "results" | "demographics";

interface AiAgentPanelProps {
  open: boolean;
  onClose: () => void;
  context?: AiAgentContext;
}

/** Panel width once open — fixed so the width transition below has a target
 *  to animate to, and so the inner content never has to reflow mid-slide. */
const PANEL_WIDTH = 400;

const CONTEXT_CONFIG = {
  dashboard: {
    title: "Asistente de Plataforma",
    placeholder: "¿Qué deseas hacer con tus encuestas?",
    suggestions: [
      "Crear una encuesta con IA",
      "Comparar encuestas recientes",
      "Cargar encuestas históricas",
      "Preguntas frecuentes sobre encuestas",
    ],
  },
  builder: {
    title: "Asistente de Creación",
    placeholder: "¿Cómo te ayudo a crear esta encuesta?",
    suggestions: [
      "Generar preguntas para esta sección",
      "Ayuda para crear la estructura de la encuesta",
      "Sugerir tipos de respuesta",
    ],
  },
  results: {
    title: "Asistente de Análisis",
    placeholder: "¿Qué datos te gustaría analizar?",
    suggestions: [
      "Analizar los resultados generales",
      "Resumir las respuestas abiertas",
      "Identificar áreas de mejora",
    ],
  },
  demographics: {
    title: "Asistente de Demográficos",
    placeholder: "¿Cómo te ayudo con tus variables demográficas?",
    suggestions: [
      "Sugerir demográficos recomendados",
      "Crear un nuevo demográfico con opciones",
      "Explicar cómo segmentar con demográficos",
    ],
  },
};

/**
 * The AI assistant, as a panel docked beside the page content rather than a
 * drawer floating over it — opening it narrows the content column (this is a
 * flex sibling in `AdminShell`, not a portaled overlay) instead of dimming or
 * covering whatever the user was looking at.
 */
export function AiAgentPanel({ open, onClose, context = "dashboard" }: AiAgentPanelProps) {
  const [prompt, setPrompt] = React.useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const firstName = CURRENT_USER?.name || "Usuario";

  const config = CONTEXT_CONFIG[context];

  return (
    <div
      className={cn(
        "flex h-full shrink-0 overflow-hidden rounded-2xl border transition-[width,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        open ? "opacity-100 border-border/60" : "w-0 opacity-0 border-transparent"
      )}
      style={{ width: open ? PANEL_WIDTH : 0 }}
      aria-hidden={!open}
    >
      {/* Fixed-width inner shell — the outer wrapper animates 0 → PANEL_WIDTH,
          but content itself must not reflow mid-slide, so it always lays out
          at full width and just gets clipped by the outer `overflow-hidden`. */}
      <div
        className="flex h-full min-w-0 flex-col bg-ai-mesh-agent"
        style={{ width: PANEL_WIDTH }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-b border-border/20">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: AI_GRADIENT }}
          >
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-bold text-text-primary leading-tight">Agente IA</h2>
            <p className="text-[11px] text-text-muted">{config.title}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-6">
          <h3 className="mb-6 text-center text-2xl font-semibold tracking-tight text-text-primary lg:leading-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: AI_GRADIENT }}
            >
              ¡Hola,
            </span>{" "}
            {firstName}!
          </h3>

          <div className="group relative rounded-[22px] bg-surface p-4 z-0 shadow-card transition-shadow focus-within:shadow-[0_0_20px_rgba(45,92,247,0.1)]">
            {/* AI Light Border */}
            <MovingBorderBeam
              duration={6000}
              borderWidth={1.5}
              rx={22}
              ry={22}
              colorFrom="hsl(var(--ai-gradient-start))"
              colorTo="hsl(var(--ai-gradient-end))"
            />

            <textarea
              ref={inputRef}
              rows={2}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={config.placeholder}
              className="relative z-10 min-h-12 w-full resize-none bg-transparent text-sm leading-normal text-text-primary outline-none placeholder:text-text-muted"
            />
            <div className="relative z-10 mt-2 flex items-center justify-between">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-text-secondary transition-colors hover:bg-background"
                title="Agregar contexto"
                aria-label="Agregar contexto"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
                style={{ background: AI_GRADIENT }}
                title="Enviar"
                aria-label="Enviar"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-[11px] text-text-muted">
            El Agente IA puede cometer errores, verifica las respuestas.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {config.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setPrompt(suggestion);
                  inputRef.current?.focus();
                }}
                className="rounded-2xl border border-border/70 bg-surface p-3 text-left text-xs font-medium leading-snug text-text-secondary transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-text-primary hover:shadow-card"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
