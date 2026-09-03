import * as React from "react";
import { ChevronRight, LayoutGrid, Rows3, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SurveyDraft } from "@/components/survey-builder";
import {
  FEATURED_REASON,
  FEATURED_TEMPLATE,
  TEMPLATE_SHELVES,
  describeTemplateSize,
  getTemplateDisplayName,
  getTemplateVisual,
  matchesTemplateQuery,
  measureTemplate,
  pluralize,
  type TemplateShelf,
} from "./templateCatalog";
import { PageThumb, TemplateSizeMeta, TemplateTile, ToneStage } from "./TemplateTile";

interface TemplateGalleryProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Opens a template's detail (sections, questions, alternatives). */
  onOpenTemplate: (template: SurveyDraft) => void;
  /** Creates the survey from a template straight away — the spotlight offers
   *  it, since its whole point is "start here". */
  onUseTemplate: (template: SurveyDraft) => void;
  /** Which cascade to play — the drawer decides based on whether its
   *  slide-in is still running. */
  cascadeClassName: string;
}

/** `card`: the tinted-stage grid. `list`: dense, full-width rows — the same
 *  choice the home strip's tiles vs. this gallery already embody, just made
 *  explicit so either one can browse many templates at once. */
type GalleryView = "card" | "list";

/**
 * The picker's "home": a spotlight on the template to start with, then every
 * template laid out as a tile, shelf by shelf, the way the home strip shows
 * its shortcuts — same thumbnail, same badge, same hover — only taller, with
 * the page on a tinted stage so a shelf reads by color before by name.
 */
export function TemplateGallery({
  query,
  onQueryChange,
  onOpenTemplate,
  onUseTemplate,
  cascadeClassName,
}: TemplateGalleryProps) {
  // Local and ephemeral — the drawer already remounts this whole component
  // on every open, same as `query`, so there is nothing to persist here.
  const [view, setView] = React.useState<GalleryView>("card");
  const totalCount = TEMPLATE_SHELVES.reduce((sum, shelf) => sum + shelf.items.length, 0);
  const visibleShelves = TEMPLATE_SHELVES.map((shelf) => ({
    ...shelf,
    items: shelf.items.filter((template) => matchesTemplateQuery(template, query)),
  })).filter((shelf) => shelf.items.length > 0);
  const isSearching = query.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 px-1 pb-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-text-primary">Elige un punto de partida</h2>
          <p className="mt-0.5 text-[12.5px] text-text-secondary">
            {pluralize(totalCount, "plantilla lista", "plantillas listas")} para usar. Toca una para ver sus
            secciones y preguntas antes de crear la encuesta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="Tipo de vista"
            className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-surface p-0.5"
          >
            <ViewToggleButton
              label="Ver en tarjetas"
              icon={LayoutGrid}
              isActive={view === "card"}
              onClick={() => setView("card")}
            />
            <ViewToggleButton
              label="Ver en lista"
              icon={Rows3}
              isActive={view === "list"}
              onClick={() => setView("list")}
            />
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Buscar plantilla"
              placeholder="Buscar por nombre u objetivo…"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="border-border/60 bg-surface pl-9 pr-8 text-[13px]"
            />
            {isSearching && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => onQueryChange("")}
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {visibleShelves.length > 0 ? (
          <div className={cn("flex flex-col gap-7 pb-2", cascadeClassName)}>
            {/* The spotlight steps aside while searching: a search is already
                an answer to "where do I start?". */}
            {!isSearching && (
              <FeaturedTemplateCard
                template={FEATURED_TEMPLATE}
                onOpen={() => onOpenTemplate(FEATURED_TEMPLATE)}
                onUse={() => onUseTemplate(FEATURED_TEMPLATE)}
              />
            )}
            {visibleShelves.map((shelf) => (
              <Shelf key={shelf.id} shelf={shelf} view={view} onOpenTemplate={onOpenTemplate} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-muted/40 px-6 py-12 text-center">
            <p className="text-[13.5px] font-semibold text-text-primary">
              No encontramos plantillas para “{query.trim()}”
            </p>
            <p className="text-[12.5px] text-text-secondary">Prueba con otra palabra o revisa todo el catálogo.</p>
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="mt-1 text-[12.5px] font-semibold text-primary hover:underline"
            >
              Ver todas las plantillas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FeaturedTemplateCardProps {
  template: SurveyDraft;
  onOpen: () => void;
  onUse: () => void;
}

/**
 * The one template to start with, stretched across the top: the same page
 * thumbnail as its tile, on a wider stage, with why it is the pick and both
 * ways forward — read it first, or use it now.
 */
function FeaturedTemplateCard({ template, onOpen, onUse }: FeaturedTemplateCardProps) {
  const { icon, tone } = getTemplateVisual(template);
  const size = measureTemplate(template);

  return (
    <article
      aria-label={`Recomendada: ${template.name}`}
      className="group relative flex items-stretch gap-4 overflow-hidden rounded-2xl border border-border/60 bg-surface p-3 shadow-card magic-card-sweep"
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ver la plantilla ${template.name}`}
        className="z-[1] shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <ToneStage tone={tone} className="h-full w-[188px]">
          <PageThumb icon={icon} tone={tone} size="lg" className="mb-0 mr-0" />
        </ToneStage>
      </button>

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-1.5">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
          <Sparkles className="h-3 w-3" strokeWidth={2.25} />
          Recomendada para empezar
        </span>
        <h3 className="text-[16px] font-bold leading-tight tracking-tight text-text-primary">
          {getTemplateDisplayName(template)}
        </h3>
        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-text-secondary">{FEATURED_REASON}</p>
        <TemplateSizeMeta size={size} className="mt-0.5" />
      </div>

      <div className="relative z-[1] flex shrink-0 flex-col justify-center gap-2 pr-2">
        <Button onClick={onUse}>Usar plantilla</Button>
        <Button variant="outline" onClick={onOpen} className="justify-between">
          Ver secciones
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </article>
  );
}

function Shelf({
  shelf,
  view,
  onOpenTemplate,
}: {
  shelf: TemplateShelf;
  view: GalleryView;
  onOpenTemplate: (template: SurveyDraft) => void;
}) {
  const Icon = shelf.icon;

  return (
    <section aria-labelledby={`shelf-${shelf.id}`}>
      <div className="mb-3 flex items-center gap-3 px-1">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-text-secondary ring-1 ring-inset ring-border/40">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 id={`shelf-${shelf.id}`} className="text-[13.5px] font-semibold leading-tight text-text-primary">
              {shelf.category}
            </h3>
            {shelf.path.length > 0 && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                {shelf.path.join(" · ")}
              </span>
            )}
            <span className="text-[11px] font-semibold tabular-nums text-text-muted">{shelf.items.length}</span>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-text-muted">{shelf.description}</p>
        </div>
      </div>

      <div className={view === "card" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" : "flex flex-col gap-2"}>
        {shelf.items.map((template) => {
          const { icon, tone } = getTemplateVisual(template);
          const size = measureTemplate(template);
          const meta = describeTemplateSize(size);
          return (
            <TemplateTile
              key={template.name}
              variant={view}
              icon={icon}
              tone={tone}
              label={getTemplateDisplayName(template)}
              meta={meta}
              size={size}
              description={template.description || "Esta plantilla no tiene un objetivo descrito."}
              title={`${template.name} · ${meta}`}
              onClick={() => onOpenTemplate(template)}
            />
          );
        })}
      </div>
    </section>
  );
}

function ViewToggleButton({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        isActive ? "bg-primary/10 text-primary" : "text-text-muted hover:bg-surface-muted hover:text-text-primary"
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
