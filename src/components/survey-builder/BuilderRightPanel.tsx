import * as React from "react";
import {
  CornerDownRight,
  Eye,
  Library,
  ListPlus,
  Plus,
  Info,
  Users,
  Layers,
  ListChecks,
  BarChart3,
  Clock3,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { depthLabel } from "./surveyBuilderTypes";
import { cn } from "@/lib/utils";

interface BuilderRightPanelProps {
  offset: number;
  isScrolling: boolean;
  isSectionsStepActive: boolean;
  isDemographicsStepActive: boolean;
  isPagesStepActive: boolean;
  onAddSection: () => void;
  onAddSubsection: () => void;
  onAddSiblingSubsection: () => void;
  onAddLevelTwoSubsection: () => void;
  onAddQuestion: () => void;
  onOpenAnswerBank: () => void;
  onOpenQuestionBank: () => void;
  onAddDemographic: () => void;
  onPreview: () => void;
  previewBlockedReason: string | null;
  addQuestionBlockedReason: string | null;
  addSubsectionBlockedReason: string | null;
  addDemographicBlockedReason: string | null;
  showAddSubsection: boolean;
  selectedDepth: number | null;
  sectionCount: number;
  questionCount: number;
  estimatedMinutes: number;
  participantsCount: number;
  demographicsCount: number;
}

export const BuilderRightPanel = React.forwardRef<HTMLDivElement, BuilderRightPanelProps>(
  function BuilderRightPanel({
    offset,
    isScrolling,
    isSectionsStepActive,
    isDemographicsStepActive,
    isPagesStepActive,
    onAddSection,
    onAddSubsection,
    onAddSiblingSubsection,
    onAddLevelTwoSubsection,
    onAddQuestion,
    onOpenAnswerBank,
    onOpenQuestionBank,
    onAddDemographic,
    onPreview,
    previewBlockedReason,
    addQuestionBlockedReason,
    addSubsectionBlockedReason,
    addDemographicBlockedReason,
    showAddSubsection,
    selectedDepth,
    sectionCount,
    questionCount,
    estimatedMinutes,
    participantsCount,
    demographicsCount,
  }, ref) {
    const [isSubnivelMenuOpen, setIsSubnivelMenuOpen] = React.useState(false);
    
    const asksSubnivelChoice = selectedDepth === 2 || selectedDepth === 3;
    const hermanaTitle = `${depthLabel(selectedDepth ?? 2)} (nivel ${selectedDepth ?? 2})`;
    const secondDepth = selectedDepth === 3 ? 2 : 3;
    const secondTitle = `${depthLabel(secondDepth)} (nivel ${secondDepth})`;

    return (
      <div 
        ref={ref}
        className={cn(
          "w-[56px] shrink-0 bg-surface border border-border/60 rounded-2xl shadow-sm flex flex-col items-center py-3 px-2 transition-transform duration-[600ms] ease-out z-10",
          isScrolling && "duration-0"
        )}
        style={{ transform: `translateY(${offset}px)` }}
      >
        <div className="flex flex-col gap-2">
          {isSectionsStepActive && (
            <>
              <ActionIconButton 
                icon={<ListPlus className="h-[20px] w-[20px]" strokeWidth={2.3} />} 
                label="Añadir sección" 
                onClick={onAddSection} 
              />
              {showAddSubsection && (
                asksSubnivelChoice ? (
                  <Popover open={isSubnivelMenuOpen} onOpenChange={setIsSubnivelMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="h-10 w-10 p-0 rounded-xl text-zinc-500 hover:bg-black/5 hover:text-black">
                        <CornerDownRight className="h-[20px] w-[20px]" strokeWidth={2.3} />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="left" align="start" className="w-64 p-3">
                      <PopoverTitle className="text-[13px] font-semibold text-text-primary mb-2">
                        Añadir subsección
                      </PopoverTitle>
                      <div className="flex flex-col gap-2">
                        <Button variant="ghost" className="justify-start h-auto p-2" onClick={() => { setIsSubnivelMenuOpen(false); onAddSiblingSubsection(); }}>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-[12.5px] font-semibold text-text-primary">{hermanaTitle}</span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Crea una subsección al mismo nivel.</span>
                          </div>
                        </Button>
                        <Button variant="ghost" className="justify-start h-auto p-2" onClick={() => { setIsSubnivelMenuOpen(false); if (selectedDepth === 3) onAddLevelTwoSubsection(); else onAddSubsection(); }}>
                          <div className="flex flex-col items-start text-left">
                            <span className="text-[12.5px] font-semibold text-text-primary">{secondTitle}</span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Crea una subsección anidada.</span>
                          </div>
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <ActionIconButton 
                    icon={<CornerDownRight className="h-[20px] w-[20px]" strokeWidth={2.3} />} 
                    label="Añadir subsección" 
                    onClick={onAddSubsection} 
                    blockedReason={addSubsectionBlockedReason}
                  />
                )
              )}
              
              <ActionIconButton 
                icon={<Plus className="h-[20px] w-[20px]" strokeWidth={2.3} />} 
                label="Añadir pregunta" 
                onClick={onAddQuestion} 
                blockedReason={addQuestionBlockedReason}
              />
              
              <ActionIconButton 
                icon={<Library className="h-[20px] w-[20px]" strokeWidth={2.3} />} 
                label="Banco de preguntas" 
                onClick={onOpenQuestionBank} 
              />
              
              <div className="my-1 border-t border-border/50 w-full" />
            </>
          )}
          
          {isDemographicsStepActive && (
            <>
              <ActionIconButton 
                icon={<Plus className="h-[20px] w-[20px]" strokeWidth={2.3} />} 
                label="Añadir dato demográfico" 
                onClick={onAddDemographic} 
                blockedReason={addDemographicBlockedReason}
              />
              <div className="my-1 border-t border-border/50 w-full" />
            </>
          )}

          {(isSectionsStepActive || isPagesStepActive) && (
            <ActionIconButton 
              icon={<Eye className="h-[20px] w-[20px]" strokeWidth={2.3} />} 
              label="Vista previa" 
              onClick={onPreview} 
              blockedReason={previewBlockedReason}
            />
          )}

          {(isSectionsStepActive || isDemographicsStepActive || isPagesStepActive) && (
            <HoverCard openDelay={0} closeDelay={200}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-label="Información de participantes, secciones, preguntas, datos demográficos y tiempo"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <Info className="h-[20px] w-[20px]" strokeWidth={2.3} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                side="left"
                align="center"
                sideOffset={16}
                className="w-[280px] p-3 animate-in zoom-in-95 duration-200 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-border/60"
              >
                <PopoverTitle className="text-[13px] font-semibold text-text-primary">
                  Información
                </PopoverTitle>

                <div className="my-2.5 h-px bg-border/60" />

                <dl className="flex flex-col gap-2.5">
                  <InfoRow icon={Users} label="Participantes" value={formatCount(participantsCount)} />
                  <InfoRow icon={Layers} label="Secciones" value={sectionCount} />
                  <InfoRow icon={ListChecks} label="Preguntas" value={questionCount} />
                  <InfoRow icon={BarChart3} label="Datos demográficos" value={demographicsCount} />
                  <InfoRow icon={Clock3} label="Tiempo estimado" value={`${estimatedMinutes} min`} />
                </dl>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      </div>
    );
  }
);

function formatCount(n: number) {
  return new Intl.NumberFormat("es-CO").format(n);
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        {label}
      </dt>
      <dd className="text-[13px] font-semibold tabular-nums text-text-primary">{value}</dd>
    </div>
  );
}

function ActionIconButton({ icon, label, onClick, blockedReason }: { icon: React.ReactNode, label: string, onClick: () => void, blockedReason?: string | null }) {
  const disabled = blockedReason != null;
  const button = (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      disabled={disabled}
      className="h-10 w-10 p-0 rounded-xl text-zinc-500 hover:bg-black/5 hover:text-black focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {icon}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>{button}</div>
      </TooltipTrigger>
      <TooltipContent side="left">
        {blockedReason ?? label}
      </TooltipContent>
    </Tooltip>
  );
}
