import { Grid2x2Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { templates } from "@/lib/templates/nom035Templates";
import type { SurveyDraft } from "@/components/survey-builder";
import { TemplateTile, getTemplateVisual, measureTemplate, pluralize } from "@/components/templates";

interface TemplateStripItem {
  key: string;
  /** The short label the shelf shows — shorter than the template's own name,
   *  which has to fit a sixth of the row. */
  label: string;
  template: SurveyDraft;
}

/** Same fallback the full template picker uses — a renamed template degrades
 *  to the first one instead of leaving a tile with nothing to open. */
function findTemplate(name: string): SurveyDraft {
  return templates.find((template) => template.name === name) ?? templates[0];
}

/** The five templates worth a shortcut from Home — same set NOM 035 and the
 *  full picker already group as the "main" ones, just promoted a level up. */
const STRIP_ITEMS: readonly TemplateStripItem[] = [
  { key: "nom035", label: "NOM-035", template: findTemplate("NOM 035 - Riesgo psicosocial (- 50 colaboradores)") },
  { key: "cultura", label: "Cultura", template: findTemplate("Cultura") },
  { key: "clima", label: "Clima laboral", template: findTemplate("Clima") },
  { key: "enps", label: "eNPS", template: findTemplate("eNPS (Employee Net Promoter Score)") },
  { key: "ia", label: "Adopción de IA", template: findTemplate("Evaluación y adopción de la IA") },
];

/** What a template holds: the question count fits every tile width, so it is
 *  the visible line; sections join it in the tile's title on hover. */
function describeTemplate(template: SurveyDraft): { meta: string; detail: string } {
  const size = measureTemplate(template);
  const meta = pluralize(size.questions, "pregunta", "preguntas");
  return {
    meta,
    detail: `${template.name} · ${pluralize(size.sections, "sección", "secciones")} · ${meta}`,
  };
}

interface TemplatesStripProps {
  /** Opens a template for preview/use — the caller decides what "use" means. */
  onSelectTemplate: (template: SurveyDraft) => void;
  /** Opens the full picker (search + every shelf) — the row's own last tile. */
  onViewAll: () => void;
  className?: string;
}

/**
 * The "start from a template" shelf above the home pulse. Each tile is a tiny
 * document — a page thumbnail with skeleton lines and the template's badge
 * pinned to its corner, then the name and what it holds — so the row reads as
 * a template gallery rather than another set of metric cards. Tiles grow to
 * fill the row instead of scrolling, so the shelf stays one full-width strip.
 */
export function TemplatesStrip({ onSelectTemplate, onViewAll, className }: TemplatesStripProps) {
  return (
    <section aria-label="Plantillas de encuesta" className={cn("shrink-0", className)}>
      <h2 className="mb-2.5 text-[13px] font-semibold text-text-secondary">Empieza con una plantilla</h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STRIP_ITEMS.map((item) => {
          const { icon, tone } = getTemplateVisual(item.template);
          const { meta, detail } = describeTemplate(item.template);
          return (
            <TemplateTile
              key={item.key}
              icon={icon}
              tone={tone}
              label={item.label}
              meta={meta}
              title={detail}
              onClick={() => onSelectTemplate(item.template)}
            />
          );
        })}
        <TemplateTile
          icon={Grid2x2Plus}
          tone="neutral"
          label="Ver más plantillas"
          meta="Todo el catálogo"
          title="Abrir el catálogo completo de plantillas"
          onClick={onViewAll}
          dashed
        />
      </div>
    </section>
  );
}
