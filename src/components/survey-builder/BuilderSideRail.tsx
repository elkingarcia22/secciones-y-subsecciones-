import * as React from "react";
import {
  BarChart3,
  Clock3,
  CornerDownRight,
  Eye,
  Info,
  Layers,
  Library,
  ListChecks,
  ListPlus,
  Plus,
  UploadCloud,
  Users,
  Save,
  ArrowRight,
  Check,
  Pin,
  Minimize2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SECTION_IMPORT_ACCEPT, importedToSections, parseSectionFile, summarizeImported } from "./sectionFileImport";
import type { SectionImportSummary } from "./sectionFileImport";
import type { SurveySection } from "./surveyBuilderTypes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { formatCount } from "./participants";
import { depthLabel } from "./surveyBuilderTypes";

interface BuilderSideRailProps {
  /** Whether the rail should appear at the bottom (horizontal) or right (vertical). */
  orientation?: "bottom" | "right";
  /** Distance from the top of the column, so the rail tracks the active row. */
  offset: number;
  /** True while a scroll gesture is in progress. Drops the position
   * transition so the rail holds still instead of visibly chasing a target
   * that is being recomputed every scroll frame. */
  isScrolling: boolean;
  /**
   * Whether "Secciones y preguntas" is the active step. Creating a section,
   * subsection or question only makes sense there — on every other step the
   * three buttons would either do nothing useful or act on a section the
   * author isn't looking at, so they leave the rail entirely instead of
   * sitting there disabled.
   */
  isSectionsStepActive: boolean;
  /** Whether "Datos demográficos" is the active step — the only place
   * creating a custom demographic from the rail makes sense. */
  isDemographicsStepActive: boolean;
  /** Whether the combined "Páginas" step is active. */
  isPagesStepActive: boolean;
  onAddSection: () => void;
  onAddSubsection: () => void;
  /** Rail's "nivel 2 (hermana)" choice: inserts a subsección right below the
   * selected level-2 subsection instead of nesting a third level. */
  onAddSiblingSubsection: () => void;
  /** Rail's "subsección nivel 2" choice while standing on a level-3 sub-sección:
   * inserts a new level-2 subsección below the level-2 parent, since nesting a
   * fourth level is beyond the tree's maximum depth. */
  onAddLevelTwoSubsection: () => void;
  onAddQuestion: () => void;
  onOpenAnswerBank: () => void;
  onAddDemographic: () => void;
  /** Called once an import file is parsed — only visible on the sections step. */
  onImportSections: (sections: SurveySection[], summary: SectionImportSummary) => void;
  onPreview: () => void;
  /** Reason the preview cannot be opened yet, or null when it can. */
  previewBlockedReason: string | null;
  /** Survey stats shown inside the info card. */
  sectionCount: number;
  questionCount: number;
  estimatedMinutes: number;
  participantsCount: number;
  demographicsCount: number;
  /** Reason questions cannot be added right now, or null when they can. */
  addQuestionBlockedReason: string | null;
  /** Reason a subsection cannot be added right now, or null when it can. */
  addSubsectionBlockedReason: string | null;
  /** Reason a demographic cannot be created right now, or null when it can. */
  addDemographicBlockedReason: string | null;
  /** False at the max nesting depth: the button is hidden rather than disabled. */
  showAddSubsection: boolean;
  /**
   * Depth of the currently selected section, or null when nothing is selected.
   * Standing on a level-2/3 subsección makes the "Añadir subsección" button ask
   * (modal beside the rail) whether to add a sibling or a child subsección.
   */
  selectedDepth: number | null;
  onSave: () => void;
  onContinue: () => void;
  canContinue: boolean;
  continueLabel?: string;
  continueDisabledReason?: string;
}

interface RailButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  blockedReason?: string | null;
  /** When true, ignores clicks outside so the rail doesn't close if a modal opens */
  ignoreOutsideClick?: boolean;
  tooltipSide?: "top" | "left";
}

function RailButton({
  icon,
  label,
  onClick,
  blockedReason = null,
  ignoreOutsideClick = false,
  tooltipSide = "top",
}: RailButtonProps) {
  const disabled = blockedReason !== null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          {...(ignoreOutsideClick ? { "data-click-outside-ignore": true } : {})}
          aria-label={label}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400 disabled:active:scale-100"
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} className="max-w-[220px]">
        {blockedReason ?? label}
      </TooltipContent>
    </Tooltip>
  );
}

/** One stat line in the info card: icon-led label on the left, value flush right. */
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

/**
 * Bottom contextual action bar for quick structural actions.
 *
 * It is minimized by default into a small pill, and expands horizontally on hover
 * to reveal actions like adding sections, preview, and info.
 */
export const BuilderSideRail = React.forwardRef<HTMLDivElement, BuilderSideRailProps>(
  function BuilderSideRail(
    {
      orientation = "bottom",
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
      onAddDemographic,
      onImportSections,
      onPreview,
      previewBlockedReason,
      sectionCount,
      questionCount,
      estimatedMinutes,
      participantsCount,
      demographicsCount,
      addQuestionBlockedReason,
      addSubsectionBlockedReason,
      addDemographicBlockedReason,
      showAddSubsection,
      selectedDepth,
      onSave,
      onContinue,
      canContinue,
      continueLabel = "Continuar",
      continueDisabledReason,
    },
    ref
  ) {
    const [isSubnivelMenuOpen, setIsSubnivelMenuOpen] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const importInputRef = React.useRef<HTMLInputElement>(null);

    const [autoHide, setAutoHide] = React.useState(false);
    const [isExpanded, setIsExpanded] = React.useState(true);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const startCollapseTimer = React.useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Wait longer if a menu is open so it doesn't collapse while the user is looking at it
      if (isSubnivelMenuOpen || isImporting || !autoHide) return;
      
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
    }, [isSubnivelMenuOpen, isImporting, autoHide]);

    React.useEffect(() => {
      if (!autoHide) {
        setIsExpanded(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else {
        startCollapseTimer();
      }
    }, [autoHide, startCollapseTimer]);

    React.useEffect(() => {
      setIsExpanded(true);
      startCollapseTimer();
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, [isSectionsStepActive, isDemographicsStepActive, startCollapseTimer]);

    const handleMouseEnter = () => {
      setIsExpanded(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleMouseLeave = () => {
      startCollapseTimer();
    };

    const handleImportFiles = async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setIsImporting(true);
      try {
        const imported = await parseSectionFile(file);
        if (imported.length === 0) {
          toast.error("No se detectaron secciones", {
            description: "El archivo es válido pero no contiene estructura de secciones/preguntas reconocible.",
          });
          return;
        }
        const parsed = summarizeImported(imported);
        onImportSections(importedToSections(imported), parsed);
        toast.success("Preguntas importadas", {
          description: `${parsed.sections} sección${parsed.sections !== 1 ? "es" : ""}, ${parsed.subsections} subsección${parsed.subsections !== 1 ? "es" : ""} y ${parsed.questions} pregunta${parsed.questions !== 1 ? "s" : ""} añadidas.`,
        });
      } catch {
        toast.error("Archivo no válido", {
          description: "No se pudo leer el archivo. Verifica que sea .md, .txt, .csv o .xlsx y no esté corrupto.",
        });
      } finally {
        setIsImporting(false);
        if (importInputRef.current) importInputRef.current.value = "";
      }
    };

    const asksSubnivelChoice = selectedDepth === 2 || selectedDepth === 3;
    const hermanaTitle = `${depthLabel(selectedDepth ?? 2)} (nivel ${selectedDepth ?? 2})`;
    const secondDepth = selectedDepth === 3 ? 2 : 3;
    const secondTitle = `${depthLabel(secondDepth)} (nivel ${secondDepth})`;

    const isRight = orientation === "right";

    return (
      <div 
        className={cn(
          "absolute z-50 flex pointer-events-none",
          isRight ? "right-0 top-1/2 -translate-y-1/2 flex-row items-center justify-end" : "bottom-0 left-1/2 -translate-x-1/2 flex-col items-center justify-end"
        )}
      >
        {/* Hit area for hover */}
        <div 
          className={cn(
            "pointer-events-auto flex items-center justify-end",
            isRight ? "w-32 flex-row py-12 pr-0" : "h-32 flex-col px-12 pb-0"
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={ref}
            className={cn(
              "relative flex items-center justify-center overflow-hidden rounded-[24px] transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              isExpanded
                ? isRight
                  ? "w-max min-w-[56px] max-h-[800px] flex-col bg-zinc-900 px-3 py-3 shadow-[-8px_0_30px_rgb(0,0,0,0.24)] border border-zinc-800/80"
                  : "h-14 max-w-[800px] bg-zinc-900 px-3 shadow-[0_8px_30px_rgb(0,0,0,0.24)] border border-zinc-800/80"
                : isRight
                  ? "w-1.5 max-h-[64px] h-[64px] bg-zinc-400 shadow-sm border-transparent rounded-l-full rounded-r-none translate-x-[2px]"
                  : "h-1.5 max-w-[64px] w-[64px] bg-zinc-400 shadow-sm border-transparent rounded-t-full rounded-b-none translate-y-[2px]"
            )}
          >
            {/* The actual content that fades/slides in */}
            <div 
              className={cn(
                "flex items-center gap-2 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                isRight ? "h-max flex-col" : "w-max",
                isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              )}
            >
              {isSectionsStepActive && (
                <>
                  <RailButton tooltipSide={isRight ? "left" : "top"}
                    icon={<ListPlus className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                    label="Añadir sección"
                    onClick={onAddSection}
                    ignoreOutsideClick
                  />
                  {showAddSubsection &&
                    (asksSubnivelChoice ? (
                      <Popover open={isSubnivelMenuOpen} onOpenChange={setIsSubnivelMenuOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            data-click-outside-ignore
                            aria-label="Añadir subsección"
                            onClick={() => setIsSubnivelMenuOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                          >
                            <CornerDownRight className="h-[20px] w-[20px]" strokeWidth={2.3} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          side="top"
                          align="center"
                          sideOffset={16}
                          avoidCollisions={false}
                          className="w-64 rounded-xl p-5"
                        >
                          <PopoverTitle className="text-[13px] font-semibold text-text-primary">
                            Añadir subsección
                          </PopoverTitle>

                          <div className="my-3 h-px bg-border/60" />

                          <div className="flex flex-col gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsSubnivelMenuOpen(false);
                                onAddSiblingSubsection();
                              }}
                              className="flex w-full items-start gap-3 rounded-lg border border-border/60 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            >
                              <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.3} />
                              <span className="min-w-0">
                                <span className="block text-[12.5px] font-semibold text-text-primary">
                                  {hermanaTitle}
                                </span>
                                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                                  Crea otra subsección al mismo nivel, debajo de esta.
                                </span>
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsSubnivelMenuOpen(false);
                                if (selectedDepth === 3) onAddLevelTwoSubsection();
                                else onAddSubsection();
                              }}
                              className="flex w-full items-start gap-3 rounded-lg border border-border/60 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            >
                              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.3} />
                              <span className="min-w-0">
                                <span className="block text-[12.5px] font-semibold text-text-primary">
                                  {secondTitle}
                                </span>
                                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                                  {selectedDepth === 3
                                    ? "Crea una subsección de nivel 2, debajo de tu subsección actual."
                                    : "Crea una subsección dentro de esta."}
                                </span>
                              </span>
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <RailButton tooltipSide={isRight ? "left" : "top"}
                        icon={<CornerDownRight className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                        label="Añadir subsección"
                        onClick={onAddSubsection}
                        blockedReason={addSubsectionBlockedReason}
                        ignoreOutsideClick
                      />
                    ))}
                  <RailButton tooltipSide={isRight ? "left" : "top"}
                    icon={<Plus className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                    label="Añadir pregunta"
                    onClick={onAddQuestion}
                    blockedReason={addQuestionBlockedReason}
                    ignoreOutsideClick
                  />
                  <RailButton tooltipSide={isRight ? "left" : "top"}
                    icon={<Library className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                    label="Banco de respuestas"
                    onClick={onOpenAnswerBank}
                  />
                  <RailButton tooltipSide={isRight ? "left" : "top"}
                    icon={
                      isImporting
                        ? <span className="h-[20px] w-[20px] animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                        : <UploadCloud className="h-[20px] w-[20px]" strokeWidth={2.3} />
                    }
                    label={isImporting ? "Importando…" : "Cargar preguntas desde archivo"}
                    onClick={() => importInputRef.current?.click()}
                    blockedReason={isImporting ? "Importando archivo…" : null}
                    ignoreOutsideClick
                  />
                  <input
                    ref={importInputRef}
                    type="file"
                    accept={SECTION_IMPORT_ACCEPT}
                    className="hidden"
                    aria-hidden="true"
                    disabled={isImporting}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) handleImportFiles(files);
                    }}
                  />

                  <div className={cn("self-stretch bg-zinc-700/60", isRight ? "mx-2 my-1 h-px w-auto" : "mx-2 my-2 w-px")} />
                </>
              )}

              {isDemographicsStepActive && (
                <>
                  <RailButton tooltipSide={isRight ? "left" : "top"}
                    icon={<Plus className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                    label="Añadir dato demográfico"
                    onClick={onAddDemographic}
                    blockedReason={addDemographicBlockedReason}
                  />

                  <div className={cn("self-stretch bg-zinc-700/60", isRight ? "mx-2 my-1 h-px w-auto" : "mx-2 my-2 w-px")} />
                </>
              )}

              {(isSectionsStepActive || isDemographicsStepActive || isPagesStepActive) && (
                <>
                  <RailButton tooltipSide={isRight ? "left" : "top"}
                    icon={<Eye className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                    label="Vista previa"
                    onClick={onPreview}
                    blockedReason={previewBlockedReason}
                  />
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <button
                        type="button"
                        aria-label="Información de participantes, secciones, preguntas, datos demográficos y tiempo"
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                      >
                        <Info className="h-[20px] w-[20px]" strokeWidth={2.3} />
                      </button>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="top"
                      align="center"
                      sideOffset={16}
                      avoidCollisions={false}
                      className="w-60 rounded-2xl p-4"
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
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setAutoHide(!autoHide)}
                    aria-label={autoHide ? "Mantener barra abierta" : "Ocultar barra automáticamente"}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                  >
                    {!autoHide ? (
                      <Minimize2 className="h-[20px] w-[20px]" strokeWidth={2.3} />
                    ) : (
                      <Pin className="h-[20px] w-[20px]" strokeWidth={2.3} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {autoHide ? "Mantener barra abierta" : "Ocultar barra automáticamente"}
                </TooltipContent>
              </Tooltip>

              <div className={cn("self-stretch bg-zinc-700/60", isRight ? "mx-2 my-1 h-px w-auto" : "mx-2 my-2 w-px")} />

              <RailButton tooltipSide={isRight ? "left" : "top"}
                icon={<Save className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                label="Guardar encuesta"
                onClick={onSave}
              />

              {canContinue ? (
                <Button
                  size="sm"
                  onClick={onContinue}
                  className="h-10 gap-2 rounded-full px-4 text-[13px]"
                >
                  {continueLabel}
                  {continueLabel === "Finalizar" ? (
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  ) : (
                    <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                  )}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        size="sm"
                        disabled
                        className="h-10 gap-2 rounded-full px-4 text-[13px]"
                      >
                        {continueLabel}
                        {continueLabel === "Finalizar" ? (
                          <Check className="h-4 w-4" strokeWidth={2.4} />
                        ) : (
                          <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {continueDisabledReason ?? "Ya estás en el último paso"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
