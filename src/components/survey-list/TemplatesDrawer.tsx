import * as React from "react";
import {
  BrainCircuit,
  ChevronRight,
  Clock,
  Gauge,
  Heart,
  Layers,
  ListChecks,
  Search,
  Shapes,
  ShieldCheck,
  Sprout,
  Target,
  type LucideIcon,
} from "lucide-react";
import { DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { templates } from "@/lib/templates/nom035Templates";
import { MINUTES_PER_QUESTION, countQuestions, type SurveyDraft } from "@/components/survey-builder";
import { cn } from "@/lib/utils";
import { TemplateSectionsAccordion } from "./TemplateOutline";

/** El mismo ritmo que usa el constructor para su "tiempo estimado", así la
 * cifra que se promete aquí es la que la encuesta acaba mostrando. */
function estimateDurationMinutes(questionCount: number): number {
  return questionCount === 0 ? 0 : Math.max(1, Math.round(questionCount * MINUTES_PER_QUESTION));
}

interface TemplatesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: SurveyDraft) => void;
}

interface TemplateFolder {
  id: string;
  title: string;
  items: readonly SurveyDraft[];
  children: readonly TemplateFolder[];
}

const NOM035_PREFIX = "NOM 035";

const FOLDERS: readonly TemplateFolder[] = [
  {
    id: "general",
    title: "General",
    items: templates.filter((template) => !template.name.startsWith(NOM035_PREFIX)),
    children: [],
  },
  {
    id: "nom035",
    title: NOM035_PREFIX,
    items: [],
    children: [
      {
        id: "nom035-mexico",
        title: "México",
        items: templates.filter((template) => template.name.startsWith(NOM035_PREFIX)),
        children: [],
      },
    ],
  },
];

const DEFAULT_TEMPLATE = templates.find((template) => template.name === "Cultura") ?? templates[0];

/** One icon per template, so the sidebar list is scannable by shape as well
 * as by name — NOM 035 gets its own mark since every guide in that family
 * shares the generic "otros" kind. */
function getTemplateIcon(template: SurveyDraft): LucideIcon {
  if (template.name.startsWith(NOM035_PREFIX)) return ShieldCheck;
  switch (template.kind) {
    case "cultura":
      return Heart;
    case "clima":
      return Sprout;
    case "enps":
      return Gauge;
    case "ia":
      return BrainCircuit;
    default:
      return Shapes;
  }
}

export function TemplatesDrawer({ open, onOpenChange, onSelectTemplate }: TemplatesDrawerProps) {
  const [selectedName, setSelectedName] = React.useState(DEFAULT_TEMPLATE.name);
  const [collapsedFolders, setCollapsedFolders] = React.useState<ReadonlySet<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedName(DEFAULT_TEMPLATE.name);
      setSearchQuery("");
    }
    onOpenChange(next);
  };

  const selectedTemplate =
    templates.find((template) => template.name === selectedName) ?? DEFAULT_TEMPLATE;

  const handleUseTemplate = () => {
    setSelectedName(DEFAULT_TEMPLATE.name);
    setSearchQuery("");
    onSelectTemplate(selectedTemplate);
  };

  const toggleFolder = (id: string) => {
    setCollapsedFolders((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter templates by search query
  const filteredFolders = FOLDERS.map((folder) => ({
    ...folder,
    items: folder.items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    children: folder.children.map((child) => ({
      ...child,
      items: child.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    })),
  })).filter((folder) => {
    const hasVisibleItems = folder.items.length > 0 ||
      folder.children.some((child) => child.items.length > 0);
    return hasVisibleItems;
  });

  const renderFolder = (folder: TemplateFolder, depth: number): React.ReactNode => {
    const isExpanded = !collapsedFolders.has(folder.id);
    const hasItems = folder.items.length > 0 || folder.children.length > 0;

    if (!hasItems) return null;

    return (
      <li key={folder.id}>
        <button
          type="button"
          onClick={() => toggleFolder(folder.id)}
          aria-expanded={isExpanded}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200",
            "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          )}
          style={{ paddingLeft: 10 + depth * 12 }}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-text-muted transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
            strokeWidth={2}
          />
          <TruncatedLabel label={folder.title} className="text-left" />
          {(folder.items.length > 0 || folder.children.some(c => c.items.length > 0)) && (
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-text-muted">
              {folder.items.length + folder.children.reduce((sum, c) => sum + c.items.length, 0)}
            </span>
          )}
        </button>

        {isExpanded && (
          <ul className="flex flex-col gap-0.5">
            {folder.children.map((child) => renderFolder(child, depth + 1))}
            {folder.items.map((template) => renderTemplateRow(template, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  const getDisplayName = (templateName: string): string => {
    if (templateName.startsWith("NOM 035 - ")) {
      return templateName.replace("NOM 035 - ", "");
    }
    return templateName;
  };

  const renderTemplateRow = (template: SurveyDraft, depth: number): React.ReactNode => {
    const isCurrent = template.name === selectedName;
    const displayName = getDisplayName(template.name);
    const Icon = getTemplateIcon(template);

    return (
      <li key={template.name}>
        <button
          type="button"
          onClick={() => setSelectedName(template.name)}
          aria-current={isCurrent ? "true" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl py-2 pr-3 text-left text-[13px] leading-snug transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            isCurrent
              ? "bg-primary/10 font-semibold text-primary"
              : "font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary"
          )}
          style={{ paddingLeft: 10 + depth * 12 }}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isCurrent ? "text-primary" : "text-text-muted"
            )}
            strokeWidth={2}
          />
          <TruncatedLabel label={displayName} />
        </button>
      </li>
    );
  };

  const sectionCount = selectedTemplate.sections.length;
  const questionCount = countQuestions(selectedTemplate.sections);
  const durationMinutes = estimateDurationMinutes(questionCount);

  return (
    <DrawerShell
      open={open}
      onOpenChange={handleOpenChange}
      title="Crear con plantilla"
      description="Elige una plantilla, revisa sus secciones y úsala como punto de partida de tu encuesta."
      size="6xl"
      disablePadding
      className="!w-[95vw] !max-w-[1240px] p-0"
    >
      {/* Dos paneles independientes sobre el fondo, con el mismo `gap-3` y el
          mismo contenedor (`rounded-2xl` + borde + `shadow-card`) que el panel
          de pasos de "crear encuesta en blanco". */}
      <div className="flex min-h-0 flex-1 gap-3 bg-background p-3">
        {/* Panel lateral — categorías y plantillas */}
        <aside className="flex w-[288px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
          <div className="shrink-0 px-3 pb-3 pt-3">
            <h2 className="mb-2.5 pl-1 text-[13px] font-semibold text-text-secondary">
              Plantillas
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                placeholder="Buscar plantilla..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-border/60 bg-background pl-9 text-[13px]"
              />
            </div>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pb-2">
            {filteredFolders.length > 0 ? (
              <ul className="flex flex-col gap-0.5">
                {filteredFolders.map((folder) => renderFolder(folder, 0))}
              </ul>
            ) : (
              <div className="flex items-center justify-center py-8 text-center">
                <p className="text-[13px] text-text-muted">No se encontraron plantillas</p>
              </div>
            )}
          </nav>
        </aside>

        {/* Panel principal — la plantilla seleccionada */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="shrink-0 rounded-2xl border border-border/60 bg-surface px-6 py-5 shadow-card">
            <div className="flex items-start justify-between gap-6">
              <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug tracking-tight text-text-primary">
                {selectedTemplate.name}
              </h2>
              <Button onClick={handleUseTemplate} className="shrink-0">
                Usar plantilla
              </Button>
            </div>

            {/* El objetivo es lo que decide si la plantilla sirve, así que se
                lee como una cita destacada — ancho completo y con su propio
                filete — en lugar de media columna con un micro-rótulo. */}
            <div className="mt-4 border-l-2 border-primary/40 pl-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <Target className="h-3.5 w-3.5" strokeWidth={2} />
                Objetivo
              </p>
              <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-text-secondary">
                {selectedTemplate.description || "Esta plantilla no tiene un objetivo descrito."}
              </p>
            </div>

            {/* Secciones, preguntas y duración son tres datos del mismo tipo —
                el tamaño de la plantilla — así que comparten forma. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <MetaChip icon={Layers}>
                {sectionCount} {sectionCount === 1 ? "sección" : "secciones"}
              </MetaChip>
              <MetaChip icon={ListChecks}>
                {questionCount} {questionCount === 1 ? "pregunta" : "preguntas"}
              </MetaChip>
              <MetaChip icon={Clock}>{durationMinutes} min aprox.</MetaChip>
            </div>
          </header>

          {/* La estructura de la plantilla: un acordeón de secciones, sus
              subsecciones y las preguntas que cada una hace. */}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="max-w-4xl pb-2">
              <TemplateSectionsAccordion sections={selectedTemplate.sections} />
            </div>
          </div>
        </div>
      </div>
    </DrawerShell>
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

function TruncatedLabel({ label, className }: { label: string; className?: string }) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    
    const checkTruncation = () => {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    };
    
    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [label]);

  return (
    <span
      ref={textRef}
      className={cn("min-w-0 flex-1 truncate", className)}
      title={isTruncated ? label : undefined}
    >
      {label}
    </span>
  );
}
