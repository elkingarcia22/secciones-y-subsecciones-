import { Check, RefreshCw, Sparkles, SlidersHorizontal, Trash2 } from "lucide-react";
import { AI_GRADIENT } from "@/components/app-shell/appShellData";
import type { AiScope } from "./aiSectionGenerator";
import type { SurveySection } from "./surveyBuilderTypes";

interface AiGenerationReviewBarProps {
  /** The batch just inserted into the survey — already live and editable. */
  sections: readonly SurveySection[];
  scope: AiScope;
  /** Dismisses the bar; the batch stays exactly as generated. */
  onKeep: () => void;
  /** Swaps the batch for a fresh one in the same spot, same brief. */
  onRegenerate: () => void;
  /** Drops the batch and reopens the brief, prefilled, to ask for something different. */
  onModifyCriteria: () => void;
  /** Removes the batch outright, leaving whatever was there before it. */
  onDiscard: () => void;
}

/**
 * Sits above whatever "Crear con IA" just inserted, since the proposal lands
 * straight in the survey instead of waiting in a separate review screen — the
 * one this replaces made every section unrecognizable behind a duplicate
 * checklist. Here the real, editable cards are what the author sees; this bar
 * only asks what to do about them next.
 */
export function AiGenerationReviewBar({
  sections,
  scope,
  onKeep,
  onRegenerate,
  onModifyCriteria,
  onDiscard,
}: AiGenerationReviewBarProps) {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-ai-mesh-card px-4 py-3 shadow-card">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white shadow-drawer"
        style={{ background: AI_GRADIENT }}
      >
        <Sparkles className="size-4" strokeWidth={2.2} />
      </span>

      <div className="min-w-[200px] flex-1">
        <p className="text-[13px] font-bold leading-tight text-text-primary">Estructura creada con IA</p>
        <p className="text-[11.5px] leading-snug text-text-secondary">
          {describeBatch(sections, scope)} · ¿la conservas, generas otra, cambias los criterios o la descartas?
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onDiscard}
          className="flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-text-muted transition-colors hover:bg-status-negative/10 hover:text-status-negative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <Trash2 className="size-3.5" strokeWidth={2.4} />
          Descartar
        </button>

        <button
          type="button"
          onClick={onModifyCriteria}
          className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <SlidersHorizontal className="size-3.5" strokeWidth={2.4} />
          Modificar criterios
        </button>

        <button
          type="button"
          onClick={onRegenerate}
          className="flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <RefreshCw className="size-3.5" strokeWidth={2.4} />
          Otra propuesta
        </button>

        <button
          type="button"
          onClick={onKeep}
          className="flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ background: AI_GRADIENT }}
        >
          <Check className="size-3.5" strokeWidth={2.6} />
          Conservar esta versión
        </button>
      </div>
    </div>
  );
}

/** "1 sección · 3 preguntas", scope-aware for when the batch is subsections instead. */
function describeBatch(sections: readonly SurveySection[], scope: AiScope): string {
  const countQuestionsDeep = (nodes: readonly SurveySection[]): number =>
    nodes.reduce((total, node) => total + node.questions.length + countQuestionsDeep(node.children), 0);
  const questions = countQuestionsDeep(sections);

  const unitLabel =
    scope === "section"
      ? sections.length === 1
        ? "subsección"
        : "subsecciones"
      : sections.length === 1
        ? "sección"
        : "secciones";

  return `${sections.length} ${unitLabel} · ${questions} ${questions === 1 ? "pregunta" : "preguntas"}`;
}
