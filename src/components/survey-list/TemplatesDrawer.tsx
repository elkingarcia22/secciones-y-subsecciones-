import * as React from "react";
import { DrawerShell } from "@/components/overlays";
import type { SurveyDraft } from "@/components/survey-builder";
import { DEFAULT_TEMPLATE, TemplateDetail, TemplateGallery, findTemplateByName } from "@/components/templates";

interface TemplatesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: SurveyDraft) => void;
  /** Open straight on this template's detail instead of the gallery. Read
   *  fresh on every open, so a shortcut elsewhere (a tile on the home strip)
   *  lands on the one it points at; "Ver más plantillas" passes nothing and
   *  gets the gallery. */
  initialTemplateName?: string;
}

/**
 * "Crear con plantilla": a gallery of template tiles grouped by shelf — the
 * same tiles the home strip uses — and, one tap deeper, the template itself
 * with its objective, size, sections and a row of alternatives underneath.
 *
 * The body is remounted on every open (keyed by an open counter) so it can
 * own its own state — where it is, what's being searched — starting fresh
 * from the props each time, without effects syncing anything. The counter
 * is bumped with the "storing information from previous renders" pattern:
 * compare the `open` prop with what the last render saw and adjust state
 * right there, which React handles before committing.
 */
export function TemplatesDrawer({
  open,
  onOpenChange,
  onSelectTemplate,
  initialTemplateName,
}: TemplatesDrawerProps) {
  const [session, setSession] = React.useState({ open, count: 0 });
  if (session.open !== open) {
    setSession({ open, count: open ? session.count + 1 : session.count });
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Crear con plantilla"
      description="Explora las plantillas por categoría, abre una para ver sus secciones y úsala como punto de partida de tu encuesta."
      size="6xl"
      disablePadding
      // El scroll vive dentro de cada vista (la galería y el detalle tienen
      // su propio `overflow-y-auto`), así que el contenedor del drawer nunca
      // desborda — el `scrollbar-gutter: stable` por defecto solo reservaba
      // una franja del fondo del Sheet a la derecha.
      disableScrollbarGutter
      className="!w-[95vw] !max-w-[1240px] gap-0 p-0"
    >
      <TemplatesDrawerBody
        key={session.count}
        initialTemplateName={initialTemplateName}
        onSelectTemplate={onSelectTemplate}
      />
    </DrawerShell>
  );
}

/** Where the drawer is: browsing every template, or reading one. */
type DrawerView = { kind: "gallery" } | { kind: "detail"; templateName: string };

const GALLERY_VIEW: DrawerView = { kind: "gallery" };

function initialView(templateName: string | undefined): DrawerView {
  const template = findTemplateByName(templateName);
  return template ? { kind: "detail", templateName: template.name } : GALLERY_VIEW;
}

interface TemplatesDrawerBodyProps {
  initialTemplateName?: string;
  onSelectTemplate: (template: SurveyDraft) => void;
}

function TemplatesDrawerBody({ initialTemplateName, onSelectTemplate }: TemplatesDrawerBodyProps) {
  const [view, setView] = React.useState<DrawerView>(() => initialView(initialTemplateName));
  const [query, setQuery] = React.useState("");

  // Whether the reader has moved away from the view the drawer opened on.
  // The first view lands while the Sheet is still sliding in, so it needs
  // `cascade-enter-drawer`'s extra delay to clear that motion first; a view
  // reached by tapping — opening a template, going back to the gallery — has
  // nothing to wait on and uses the immediate `cascade-enter` (the delayed
  // one would leave the panel blank for a beat on every switch, reading as
  // a glitch).
  const [hasNavigated, setHasNavigated] = React.useState(false);

  const navigate = (next: DrawerView) => {
    setView(next);
    setHasNavigated(true);
  };

  const selectedTemplate =
    view.kind === "detail" ? findTemplateByName(view.templateName) ?? DEFAULT_TEMPLATE : null;

  const cascadeClassName = hasNavigated ? "cascade-enter" : "cascade-enter-drawer";

  return (
    // Las tiles se apoyan directamente sobre el fondo del drawer, igual que
    // en el home se apoyan sobre el fondo de la página — sin una tarjeta que
    // las agrupe. El propio Sheet hace la entrada/salida; lo que cascada es
    // lo que hay dentro, una vez ese slide libera el paso.
    <div className="flex min-h-0 flex-1 flex-col bg-background p-4">
      {selectedTemplate ? (
        <TemplateDetail
          key={selectedTemplate.name}
          template={selectedTemplate}
          onBack={() => navigate(GALLERY_VIEW)}
          onUseTemplate={() => onSelectTemplate(selectedTemplate)}
          onOpenTemplate={(template) => navigate({ kind: "detail", templateName: template.name })}
          cascadeClassName={cascadeClassName}
        />
      ) : (
        <TemplateGallery
          query={query}
          onQueryChange={setQuery}
          onOpenTemplate={(template) => navigate({ kind: "detail", templateName: template.name })}
          onUseTemplate={onSelectTemplate}
          cascadeClassName={cascadeClassName}
        />
      )}
    </div>
  );
}
