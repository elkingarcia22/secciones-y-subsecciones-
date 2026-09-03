import { Layers, Plus } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { EmptyStateActionButton } from "@/components/feedback/EmptyStateActionButton";
import { AiCreateChip } from "./AiCreateChip";

/**
 * The sections step with nothing in it yet.
 *
 * A blank survey has no sections at all, so this is the first thing the author
 * sees on the step — and the point where the two ways of building are offered
 * side by side: create the first section by hand, or describe the survey and
 * let the AI propose the whole tree. The manual route stays the primary action;
 * the AI route is an alternative, not a shortcut past a decision.
 */
interface SectionsEmptyStateProps {
  readOnly?: boolean;
  onAddSection: () => void;
  onGenerateWithAi: () => void;
}

export function SectionsEmptyState({
  readOnly,
  onAddSection,
  onGenerateWithAi,
}: SectionsEmptyStateProps) {
  return (
    <EmptyState
      icon={Layers}
      title="Aún no hay secciones"
      description="Las preguntas viven dentro de secciones y subsecciones. Crea la primera tú mismo, o cuéntale a la IA de qué trata esta encuesta y deja que proponga la estructura completa."
      className="p-10"
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <EmptyStateActionButton
            onClick={onAddSection}
            disabled={readOnly}
            icon={<Plus className="size-4" strokeWidth={2.5} />}
          >
            Crear primera sección
          </EmptyStateActionButton>
          {!readOnly && (
            <AiCreateChip onClick={onGenerateWithAi} className="h-11 rounded-xl px-4" />
          )}
        </div>
      }
    />
  );
}
