import * as React from "react";
import { ArrowLeft, ChevronRight, Clock, Layers, ListChecks, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SurveyDraft } from "@/components/survey-builder";
import { TemplateSectionsAccordion } from "@/components/survey-list/TemplateOutline";
import {
  describeTemplateSize,
  findShelfOf,
  getTemplateDisplayName,
  getTemplateVisual,
  measureTemplate,
  pluralize,
  suggestTemplates,
} from "./templateCatalog";
import { PageThumb, TemplateTile } from "./TemplateTile";

const SUGGESTION_LIMIT = 3;

interface TemplateDetailProps {
  template: SurveyDraft;
  onBack: () => void;
  onUseTemplate: () => void;
  onOpenTemplate: (template: SurveyDraft) => void;
  /** Which cascade to play — the drawer decides based on whether its
   *  slide-in is still running. The drawer remounts this panel per template
   *  (`key={template.name}`), which is what replays the cascade on every pick. */
  cascadeClassName: string;
}

/**
 * One template, opened: the way back to the gallery, its header (the same
 * thumbnail the tile had, so the two read as one object), the objective, its
 * size, the structure as an accordion — and, under all that, a short row of
 * other templates in the same tile style, so comparing never means leaving.
 */
export function TemplateDetail({
  template,
  onBack,
  onUseTemplate,
  onOpenTemplate,
  cascadeClassName,
}: TemplateDetailProps) {
  const { icon, tone } = getTemplateVisual(template);
  const size = measureTemplate(template);
  const shelf = findShelfOf(template);
  const trail = shelf ? [shelf.category, ...shelf.path] : [];
  const suggestions = suggestTemplates(template, SUGGESTION_LIMIT);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", cascadeClassName)}>
      <nav aria-label="Ubicación de la plantilla" className="flex shrink-0 items-center gap-1 px-1 text-[12.5px]">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Todas las plantillas
        </button>
        {trail.map((crumb) => (
          <React.Fragment key={crumb}>
            <ChevronRight className="h-3.5 w-3.5 text-text-muted" strokeWidth={2} />
            <span className="font-medium text-text-muted">{crumb}</span>
          </React.Fragment>
        ))}
      </nav>

      <header className="group shrink-0 rounded-2xl border border-border/60 bg-surface px-6 py-5 shadow-card">
        <div className="flex items-start justify-between gap-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <PageThumb icon={icon} tone={tone} size="md" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-snug tracking-tight text-text-primary">
                {getTemplateDisplayName(template)}
              </h2>
              {template.name !== getTemplateDisplayName(template) && (
                <p className="mt-0.5 text-[12px] font-medium text-text-muted">{template.name}</p>
              )}
            </div>
          </div>
          <Button onClick={onUseTemplate} className="shrink-0">
            Usar plantilla
          </Button>
        </div>

        {/* El objetivo es lo que decide si la plantilla sirve, así que se lee
            como una cita destacada, con su propio filete. */}
        <div className="mt-4 border-l-2 border-primary/40 pl-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
            <Target className="h-3.5 w-3.5" strokeWidth={2} />
            Objetivo
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-text-secondary">
            {template.description || "Esta plantilla no tiene un objetivo descrito."}
          </p>
        </div>

        {/* Secciones, preguntas y duración son tres datos del mismo tipo — el
            tamaño de la plantilla — así que comparten forma. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <MetaChip icon={Layers}>{pluralize(size.sections, "sección", "secciones")}</MetaChip>
          <MetaChip icon={ListChecks}>{pluralize(size.questions, "pregunta", "preguntas")}</MetaChip>
          <MetaChip icon={Clock}>{size.minutes} min aprox.</MetaChip>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-6 pb-2">
          <TemplateSectionsAccordion sections={template.sections} />

          {suggestions.length > 0 && (
            <section aria-label="Otras plantillas">
              <h3 className="mb-2.5 px-1 text-[13px] font-semibold text-text-secondary">
                Otras plantillas que te pueden servir
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestions.map((suggestion) => {
                  const visual = getTemplateVisual(suggestion);
                  const meta = describeTemplateSize(measureTemplate(suggestion));
                  return (
                    <TemplateTile
                      key={suggestion.name}
                      icon={visual.icon}
                      tone={visual.tone}
                      label={getTemplateDisplayName(suggestion)}
                      meta={meta}
                      title={`${suggestion.name} · ${meta}`}
                      onClick={() => onOpenTemplate(suggestion)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-[12px] font-medium tabular-nums text-text-secondary">
      <Icon className="h-3.5 w-3.5 text-text-muted" strokeWidth={2} />
      {children}
    </span>
  );
}
