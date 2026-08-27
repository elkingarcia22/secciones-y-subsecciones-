import * as React from "react";
import { DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { templates } from "@/lib/templates/nom035Templates";
import type { SurveyDraft, SurveySection } from "@/components/survey-builder/surveyBuilderTypes";
import { ChevronRight, ChevronDown, Layers, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplatesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: SurveyDraft) => void;
}

export function TemplatesDrawer({ open, onOpenChange, onSelectTemplate }: TemplatesDrawerProps) {
  const [selectedTemplate, setSelectedTemplate] = React.useState<SurveyDraft | null>(null);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    "General": true,
    "NOM035": true,
    "México": true,
  });

  React.useEffect(() => {
    if (open) {
      const defaultTemplate = templates.find(t => t.name.includes("NOM 035 - Riesgo psicosocial (- 50 trabajadores)")) || templates[0];
      setSelectedTemplate(defaultTemplate);
    }
  }, [open]);

  type Folder = {
    id: string;
    title: string;
    items?: SurveyDraft[];
    children?: Folder[];
  };

  const groups: Folder[] = [
    {
      id: "General",
      title: "General",
      items: templates.filter((t) => !t.name.includes("NOM 035")),
    },
    {
      id: "NOM035",
      title: "NOM 035",
      children: [
        {
          id: "México",
          title: "México",
          items: templates.filter((t) => t.name.includes("NOM 035")),
        }
      ]
    },
  ];

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderFolder = (folder: Folder, depth = 0) => {
    const isExpanded = expandedGroups[folder.id];
    
    return (
      <div key={folder.id} className="mb-1" style={{ paddingLeft: depth === 0 ? 0 : 12 }}>
        <button
          onClick={() => toggleGroup(folder.id)}
          className="flex items-center justify-between w-full px-3 py-2 text-[14px] font-semibold text-text-secondary hover:bg-background/80 rounded-lg transition-colors"
        >
          {folder.title}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-muted" />
          )}
        </button>
        
        {isExpanded && (
          <div className="flex flex-col mt-1 gap-1">
            {folder.children && folder.children.map(child => renderFolder(child, depth + 1))}
            
            {folder.items && folder.items.map((template) => {
              const isSelected = selectedTemplate?.name === template.name;
              return (
                <button
                  key={template.name}
                  onClick={() => setSelectedTemplate(template)}
                  className={cn(
                    "flex items-center px-4 py-2.5 mx-2 text-[13px] rounded-lg transition-all text-left font-medium",
                    isSelected
                      ? "bg-primary text-white shadow-sm"
                      : "text-text-secondary hover:bg-background hover:text-text-primary"
                  )}
                >
                  <span className="truncate">{template.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Crear con plantilla"
      description="Selecciona una plantilla para comenzar."
      size="5xl"
      disablePadding
      className="flex flex-col gap-0 !max-w-[1100px] !w-[95vw] p-0 overflow-hidden"
    >
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Left Sidebar - Clean Menu */}
        <div className="w-[300px] shrink-0 border-r flex flex-col bg-surface-muted">
          <div className="p-5 border-b">
            <h3 className="font-semibold text-sm text-text-secondary">Categorías</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {groups.map(folder => renderFolder(folder, 0))}
          </div>
        </div>
        
        {/* Right Pane - Preview */}
        <div className="flex-1 flex flex-col bg-surface relative overflow-hidden">
          {selectedTemplate ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-8 pb-6 border-b flex-shrink-0 bg-surface z-10 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-8">
                    <h2 className="text-2xl font-bold mb-2 text-text-primary">{selectedTemplate.name}</h2>
                    <p className="text-text-secondary text-[14px] max-w-2xl leading-relaxed">{selectedTemplate.description}</p>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={() => onSelectTemplate(selectedTemplate)}
                    className="shrink-0 bg-primary hover:bg-[var(--color-brand-hover)] text-white font-medium shadow-md px-6 rounded-xl"
                  >
                    Usar plantilla
                  </Button>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-6 text-[13px] font-medium text-text-secondary mt-6">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-text-muted" />
                    <span>{selectedTemplate.sections.length} {selectedTemplate.sections.length === 1 ? "sección principal" : "secciones principales"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-text-muted" />
                    <span>{countQuestions(selectedTemplate.sections)} {countQuestions(selectedTemplate.sections) === 1 ? "pregunta" : "preguntas"}</span>
                  </div>
                </div>
              </div>
              
              {/* Content Preview */}
              <div className="flex-1 overflow-y-auto p-8 bg-surface-muted">
                <h3 className="font-bold text-[11px] text-text-muted mb-6 uppercase tracking-wider">Contenido de la plantilla</h3>
                <div className="flex flex-col gap-5 max-w-3xl pb-10">
                  {selectedTemplate.sections.map((section, idx) => (
                    <SectionPreviewCard key={section.id} section={section} index={idx} depth={1} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted">
              Selecciona una plantilla
            </div>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}

function SectionPreviewCard({ section, index, depth }: { section: SurveySection, index: number, depth: number }) {
  const directQuestions = section.questions?.length || 0;
  const directSubsections = section.children?.length || 0;

  return (
    <div className={cn(
      "border border-border/60 rounded-2xl bg-surface overflow-hidden shadow-sm",
      depth > 1 && "ml-8 border-l-4 border-l-blue-200"
    )}>
      <div className="px-5 py-4 border-b border-border/60 bg-surface-muted flex items-center justify-between">
        <h4 className="font-semibold text-text-primary text-[14px]">
          {depth === 1 ? `Sección ${index + 1}: ` : ""}
          {section.title}
        </h4>
        <span className="text-[12px] font-semibold bg-surface-muted text-text-secondary px-2.5 py-1 rounded-md">
          {directSubsections} {directSubsections === 1 ? "subsección" : "subsecciones"}, {directQuestions} {directQuestions === 1 ? "pregunta" : "preguntas"}
        </span>
      </div>
      
      {(section.description || directSubsections > 0 || directQuestions > 0) && (
        <div className="p-5 flex flex-col gap-5">
          {section.description && (
            <p className="text-[13px] text-text-secondary leading-relaxed">{section.description}</p>
          )}
          
          <div className="flex flex-col gap-4">
            {section.children?.map((child, cIdx) => (
              <SectionPreviewCard key={child.id} section={child} index={cIdx} depth={depth + 1} />
            ))}

            {section.questions?.map((child, cIdx) => (
              <div key={child.id} className="flex gap-4 items-start p-4 rounded-xl border border-border/60 bg-surface-muted hover:bg-surface-muted transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                  {cIdx + 1}
                </div>
                <div className="flex flex-col gap-1.5 mt-0.5">
                  <p className="text-[14px] font-medium text-text-primary">{child.statement || "Pregunta sin título"}</p>
                  <span className="text-[12px] font-medium text-text-muted capitalize">Tipo: {child.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function countQuestions(sections: readonly SurveySection[]): number {
  return sections.reduce((acc, sec) => {
    const directQs = sec.questions ? sec.questions.length : 0;
    const subSections = sec.children || [];
    return acc + directQs + countQuestions(subSections);
  }, 0);
}
