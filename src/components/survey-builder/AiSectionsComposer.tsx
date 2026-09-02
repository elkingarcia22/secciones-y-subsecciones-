import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { AI_GRADIENT } from "@/components/app-shell/appShellData";
import { ANCHOR_ATTRIBUTE } from "@/hooks/useAnchorOffset";
import { AiSectionsBriefForm } from "./AiSectionsBriefForm";
import { AiStructureLoader } from "./AiStructureLoader";
import {
  defaultBrief,
  describeBriefForLoader,
  generateSections,
  isBriefReady,
  type AiScope,
  type AiSectionsBrief,
} from "./aiSectionGenerator";
import type { SurveyKind, SurveySection } from "./surveyBuilderTypes";

/**
 * "Crear con IA" for the sections step — inline, in the panel itself.
 *
 * It takes the place of the empty state it was launched from rather than
 * opening over the survey, exactly as the question editor takes the place of
 * its row: the author stays where they were, and the thing being built appears
 * where it will end up. The contour is the one difference — a question in focus
 * is outlined in primary, and this is outlined in the AI gradient, so the two
 * kinds of editor never read as the same one. The gradient stays there and on
 * the badge and title: it marks WHOSE panel this is. Everything inside it —
 * picking a tema, choosing a tipo de respuesta, the primary action — takes the
 * builder's ordinary primary, because none of those are AI-specific acts.
 *
 * Two states share the frame — brief and waiting. The proposal lands straight
 * in the survey, editable there like anything else; reviewing whether to keep
 * it, regenerate it, or come back and change the brief is `AiGenerationReviewBar`'s
 * job, sitting above the applied result once this panel is gone.
 */
type Stage = "brief" | "generating";

interface AiSectionsComposerProps {
  /** What the survey measures — it decides which temas start marked. */
  surveyKind: SurveyKind | null;
  /** Whether the "esta sección" scope is offered — it needs a section to land in. */
  canScopeToSection: boolean;
  /** Scope the composer opens on. */
  initialScope: AiScope;
  /** Prefills the brief instead of starting blank — "Modificar los criterios"
   * reopens the composer on what was last asked, not on a clean slate. */
  initialBrief?: AiSectionsBrief;
  /** Skips the brief and goes straight to "generating" — "Otra propuesta"
   * wants the same waiting panel a first generation gets, not an instant swap. */
  autoStart?: boolean;
  /** The seed the previous batch was built from, so a regenerate continues the
   * sequence instead of restarting it at 1 and risking the same proposal. */
  initialSeed?: number;
  onCancel: () => void;
  onApply: (sections: SurveySection[], scope: AiScope, brief: AiSectionsBrief, seed: number) => void;
}

/** How long the proposal takes to "arrive", and how often the bar advances. */
const GENERATION_MS = 2400;
const TICK_MS = 60;

export function AiSectionsComposer({
  surveyKind,
  canScopeToSection,
  initialScope,
  initialBrief,
  autoStart = false,
  initialSeed,
  onCancel,
  onApply,
}: AiSectionsComposerProps) {
  const [stage, setStage] = React.useState<Stage>(autoStart ? "generating" : "brief");
  const [brief, setBrief] = React.useState<AiSectionsBrief>(
    () => initialBrief ?? defaultBrief(surveyKind, canScopeToSection ? initialScope : "survey", canScopeToSection)
  );
  const [progress, setProgress] = React.useState(0);
  // Every run gets its own seed, so regenerating proposes something new rather
  // than redrawing the same tree. Auto-starting bumps it once up front, the
  // same step `startGeneration` takes on a manual "Generar estructura".
  const [seed, setSeed] = React.useState(() => (autoStart ? (initialSeed ?? 1) + 1 : (initialSeed ?? 1)));
  // Recomputed only from the brief, so it can't drift from what the proposal
  // is actually about to build.
  const loaderSteps = React.useMemo(() => describeBriefForLoader(brief), [brief]);

  // The wait is simulated, but it is the only place the panel can show that the
  // brief was read — so the bar runs on its own clock and the proposal is
  // built, and applied straight to the survey, when it lands.
  React.useEffect(() => {
    if (stage !== "generating") return;

    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const next = Math.min(100, Math.round((elapsed / GENERATION_MS) * 100));
      setProgress(next);

      if (next >= 100) {
        window.clearInterval(timer);
        const newProposal = generateSections(brief, seed);
        onApply(newProposal.sections, newProposal.scope, brief, seed);
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [stage, brief, seed]);

  const startGeneration = () => {
    if (!isBriefReady(brief)) return;
    setSeed((current) => current + 1);
    setProgress(0);
    setStage("generating");
  };

  const isReady = isBriefReady(brief);

  const title = stage === "generating" ? "Armando la estructura" : "Crear las secciones con IA";

  const subtitle =
    stage === "generating"
      ? "Un momento: estamos redactando las preguntas por ti."
      : "Genera la estructura de tu encuesta o sección de forma automática.";

  return (
    <motion.section
      {...{ [ANCHOR_ATTRIBUTE]: true }}
      initial={{ opacity: 0, y: 16, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Crear secciones con IA"
      // El marco es el de la plataforma para "esto lo está haciendo la IA":
      // borde normal y la malla de degradado de fondo. El anillo degradado que
      // había antes competía con el contorno primario del editor de pregunta y
      // hacía que la tarjeta pesara más que su contenido.
      className="overflow-hidden rounded-2xl border border-border bg-ai-mesh-card shadow-card"
    >
      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border/50 px-5 py-4">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow-drawer"
          style={{ background: AI_GRADIENT }}
        >
          <Sparkles className="size-[17px]" strokeWidth={2.2} />
        </span>

        <div className="min-w-[220px] flex-1">
          <h3 className="text-[14px] font-bold leading-tight text-text-primary">{title}</h3>
          <p className="text-[12px] leading-snug text-text-secondary">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          disabled={stage === "generating"}
          aria-label="Cerrar el generador con IA"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-40"
        >
          <X className="size-4" strokeWidth={2.2} />
        </button>
      </header>

      <div className="px-5 py-6">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {stage === "brief" && (
            <AiSectionsBriefForm
              brief={brief}
              onChange={(patch) => setBrief((current) => ({ ...current, ...patch }))}
              canScopeToSection={canScopeToSection}
              staggerCount={0}
            />
          )}

          {stage === "generating" && <AiStructureLoader progress={progress} steps={loaderSteps} />}
        </motion.div>
      </div>

      {stage === "brief" && (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 bg-surface/70 px-5 py-4">
          <p className="text-[11.5px] text-text-muted">
            {isReady
              ? "Es una propuesta: podrás conservarla, regenerarla o ajustar los criterios."
              : "Responde las preguntas de arriba y generamos la propuesta."}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-4 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={startGeneration}
              disabled={!isReady}
              className="flex h-9 items-center gap-2 rounded-full px-5 text-[13px] font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:hover:brightness-100"
              style={{ background: AI_GRADIENT }}
            >
              Generar estructura
              <Sparkles className="size-4" strokeWidth={2.4} />
            </button>
          </div>
        </footer>
      )}
    </motion.section>
  );
}
