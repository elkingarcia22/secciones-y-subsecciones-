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
  Sparkles,
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
import { formatCount, type ParticipantsGroupBreakdown } from "./participants";
import { depthLabel } from "./surveyBuilderTypes";
import { RailSelectionChip, useRailAutoHide } from "@/components/action-rail";

interface BuilderSideRailProps {
  readOnly?: boolean;
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
  /** Cuando existe, "añadir pregunta" abre el menú con las dos vías —IA o a
   * mano— en vez de crear la pregunta en blanco directamente. */
  onAddQuestionWithAi?: () => void;
  onOpenAnswerBank: () => void;
  onOpenQuestionBank: () => void;
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
  /** How that count splits between selected groups and ad-hoc picks — empty
   * outside "Por grupos" / "Por colaborador", where there is nothing to
   * split. */
  participantsBreakdown: ParticipantsGroupBreakdown;
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
  /** The current wizard step id — drives the open-on-entry and staggered
   * animation of contextual action buttons. */
  activeStep: string;
  participantsSelectionCount?: number;
  /** Drops the ticks in the participants table. */
  onClearParticipantsSelection?: (() => void) | null;
  /** Present only when removing rows differs from clearing the ticks. */
  onDeleteParticipantsSelection?: (() => void) | null;
  /** When true, the rail is forced minimized and ignores hover events to expand. */
  forceMinimized?: boolean;
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
          className="dock-item relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white/60"
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

/**
 * Wraps a contextual action button to apply a staggered slide-in animation
 * when the wizard step changes. The `animKey` should change on every step
 * transition so the CSS animation re-fires. Each item gets a progressive
 * `animation-delay` based on `staggerIndex` to create a cascade effect.
 *
 * Also applies a blue→normal color flash so buttons briefly glow indigo
 * before settling into their resting zinc-400 colour. Set `skipColorFlash`
 * for non-button elements like dividers.
 */
function AnimatedActionItem({
  animKey,
  staggerIndex,
  skipColorFlash = false,
  children,
}: {
  animKey: number;
  staggerIndex: number;
  skipColorFlash?: boolean;
  children: React.ReactNode;
}) {
  const delay = staggerIndex * 100;
  const animations = [
    `railActionAppear 550ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`,
  ];
  if (!skipColorFlash) {
    animations.push(`railActionColorFlash 1100ms ease-out ${delay + 150}ms both`);
  }
  return (
    <div
      key={animKey}
      className="rounded-xl"
      style={{ animation: animations.join(", ") }}
    >
      {children}
    </div>
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
      <dt className="flex items-center gap-2 text-[13px] text-white/60">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {label}
      </dt>
      <dd className="text-[13px] font-semibold tabular-nums text-white">{value}</dd>
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
      readOnly,
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
      onAddQuestionWithAi,
      onOpenAnswerBank,
      onOpenQuestionBank,
      onAddDemographic,
      onImportSections,
      onPreview,
      previewBlockedReason,
      sectionCount,
      questionCount,
      estimatedMinutes,
      participantsCount,
      participantsBreakdown,
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
      activeStep,
      participantsSelectionCount = 0,
      onClearParticipantsSelection,
      onDeleteParticipantsSelection,
      forceMinimized = false,
    },
    ref
  ) {
    const [isSubnivelMenuOpen, setIsSubnivelMenuOpen] = React.useState(false);
    const [isAddQuestionMenuOpen, setIsAddQuestionMenuOpen] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const importInputRef = React.useRef<HTMLInputElement>(null);

    const [autoHide, setAutoHide] = useRailAutoHide();
    const [isExpanded, setIsExpanded] = React.useState(true);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Step-change detection ──────────────────────────────
    // Tracks the previous step to detect real transitions and drive the
    // stagger animation. `stepChangeKey` increments on every transition
    // so CSS animations re-fire via a new React key.
    const prevStepRef = React.useRef(activeStep);
    const [stepChangeKey, setStepChangeKey] = React.useState(0);
    const forceOpenTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    /** False until the mount-grace effect below has run once — lets the
     * autoHide-sync effect tell a real preference change from its own
     * first pass, so it doesn't collapse the rail before the grace period
     * even starts. */
    const hasMountedRef = React.useRef(false);

    React.useEffect(() => {
      if (prevStepRef.current !== activeStep) {
        prevStepRef.current = activeStep;
        setStepChangeKey((k) => k + 1);

        // Force the rail open and suspend autoHide for 3 s so the author
        // has time to notice the new contextual actions.
        setIsExpanded(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (forceOpenTimerRef.current) clearTimeout(forceOpenTimerRef.current);
        forceOpenTimerRef.current = setTimeout(() => {
          // After the grace period, start the regular collapse timer if
          // autoHide is on — otherwise leave the rail open.
          if (autoHide) {
            startCollapseTimer();
          }
        }, 3000);
      }
    }, [activeStep]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clean up force-open timer on unmount
    React.useEffect(() => {
      return () => {
        if (forceOpenTimerRef.current) clearTimeout(forceOpenTimerRef.current);
      };
    }, []);

    const startCollapseTimer = React.useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Do not collapse if a menu is open or autoHide is disabled
      if (isSubnivelMenuOpen || isAddQuestionMenuOpen || isImporting || !autoHide) return;

      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 150);
    }, [isSubnivelMenuOpen, isAddQuestionMenuOpen, isImporting, autoHide]);

    React.useEffect(() => {
      if (forceMinimized) {
        // A hard override, not a preference — applies immediately even on
        // the very first mount, unlike the autoHide grace period below.
        setIsExpanded(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else if (!autoHide) {
        setIsExpanded(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else if (hasMountedRef.current) {
        setIsExpanded(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    }, [autoHide, forceMinimized]);

    // On first mount, hold the rail open for a few seconds before autoHide
    // collapses it — the same grace period a real step change gets, so
    // whoever just opened this screen sees the bar open at least once. The
    // cleanup resets `hasMountedRef` rather than leaving it set, because
    // StrictMode runs every effect's setup → cleanup → setup once in dev:
    // without the reset, that replay would see a "mounted" ref on its
    // second setup pass and collapse the rail immediately, well before the
    // real timer below ever gets a chance to.
    React.useEffect(() => {
      hasMountedRef.current = true;
      if (forceMinimized || !autoHide) {
        return () => {
          hasMountedRef.current = false;
        };
      }
      if (forceOpenTimerRef.current) clearTimeout(forceOpenTimerRef.current);
      forceOpenTimerRef.current = setTimeout(() => {
        if (autoHide) startCollapseTimer();
      }, 1500);
      return () => {
        hasMountedRef.current = false;
        if (forceOpenTimerRef.current) clearTimeout(forceOpenTimerRef.current);
      };
      // Mount-only grace period — must run once, not on every autoHide flip.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleMouseEnter = () => {
      if (forceMinimized) return;
      setIsExpanded(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    const handleMouseLeave = () => {
      if (forceMinimized) return;
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
      <>
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
            isRight ? "w-16 flex-row py-6 pr-0" : "h-16 flex-col px-6 pb-0"
          )}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            ref={ref}
            className={cn(
              "relative flex items-center justify-center overflow-hidden rounded-3xl transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              isExpanded
                ? isRight
                  ? "w-max min-w-[56px] max-h-[800px] flex-col bg-surface-nav px-3 py-3 shadow-rail border border-white/10"
                  : "h-14 max-w-[800px] bg-surface-nav px-3 shadow-rail border border-white/10"
                // Collapsed: a full pill rather than a half-rounded hump, so
                // the handle reads as one continuous rounded line either way.
                : isRight
                  ? "w-1.5 max-h-[64px] h-[64px] bg-border-strong shadow-card border-transparent rounded-full translate-x-[2px]"
                  : "h-1.5 max-w-[64px] w-[64px] bg-border-strong shadow-card border-transparent rounded-full translate-y-[2px]"
            )}
          >
            {/* The actual content that fades/slides in */}
            <div 
              className={cn(
                "dock-container flex items-center gap-2 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                isRight ? "h-max flex-col" : "w-max",
                isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              )}
            >
              {isSectionsStepActive && !readOnly && (
                <>
                  {/* Shimmer overlay for the contextual group */}
                  <div
                    key={`shimmer-sections-${stepChangeKey}`}
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    style={{
                      animation: "railGroupShimmer 1200ms ease-out both",
                      animationDelay: "200ms",
                    }}
                  />
                  <AnimatedActionItem animKey={stepChangeKey} staggerIndex={0}>
                    <RailButton tooltipSide={isRight ? "left" : "top"}
                      icon={<ListPlus className="h-[20px] w-[20px]" strokeWidth={2} />}
                      label="Añadir sección"
                      onClick={onAddSection}
                      ignoreOutsideClick
                    />
                  </AnimatedActionItem>
                  {showAddSubsection &&
                    (asksSubnivelChoice ? (
                      <AnimatedActionItem animKey={stepChangeKey} staggerIndex={1}>
                        <Popover open={isSubnivelMenuOpen} onOpenChange={setIsSubnivelMenuOpen}>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              data-click-outside-ignore
                              aria-label="Añadir subsección"
                              onClick={() => setIsSubnivelMenuOpen(true)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                            >
                              <CornerDownRight className="h-[20px] w-[20px]" strokeWidth={2} />
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
                                className="hover-icon-pop flex w-full items-start gap-3 rounded-lg border border-border/60 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              >
                                <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                                <span className="min-w-0">
                                  <span className="block text-[13px] font-semibold text-text-primary">
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
                                className="hover-icon-pop flex w-full items-start gap-3 rounded-lg border border-border/60 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              >
                                <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2} />
                                <span className="min-w-0">
                                  <span className="block text-[13px] font-semibold text-text-primary">
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
                      </AnimatedActionItem>
                    ) : (
                      <AnimatedActionItem animKey={stepChangeKey} staggerIndex={1}>
                        <RailButton tooltipSide={isRight ? "left" : "top"}
                          icon={<CornerDownRight className="h-[20px] w-[20px]" strokeWidth={2} />}
                          label="Añadir subsección"
                          onClick={onAddSubsection}
                          blockedReason={addSubsectionBlockedReason}
                          ignoreOutsideClick
                        />
                      </AnimatedActionItem>
                    ))}
                  <AnimatedActionItem animKey={stepChangeKey} staggerIndex={2}>
                    {onAddQuestionWithAi && addQuestionBlockedReason === null ? (
                      <Popover open={isAddQuestionMenuOpen} onOpenChange={setIsAddQuestionMenuOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            data-click-outside-ignore
                            aria-label="Añadir pregunta"
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                          >
                            <Plus className="h-[20px] w-[20px]" strokeWidth={2} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          side={isRight ? "left" : "top"}
                          align="center"
                          sideOffset={16}
                          avoidCollisions={false}
                          className="w-[280px] rounded-2xl border-white/10 bg-surface-nav p-2 shadow-rail"
                        >
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddQuestionMenuOpen(false);
                                onAddQuestionWithAi();
                              }}
                              className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/5"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-white/10">
                                {/* Same gradient as the "Agente IA" button on the home floating rail, so the AI branding reads as one system. */}
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-transparent">
                                  <defs>
                                    <linearGradient id="ai-icon-gradient-rail" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="hsl(var(--ai-gradient-start))" />
                                      <stop offset="100%" stopColor="hsl(var(--ai-gradient-end))" />
                                    </linearGradient>
                                  </defs>
                                  <Sparkles stroke="url(#ai-icon-gradient-rail)" className="h-5 w-5" strokeWidth={2} />
                                </svg>
                              </div>
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="block text-[14px] font-bold tracking-tight text-ai-gradient">
                                  Crear con IA
                                </span>
                                <span className="block text-[11px] font-medium text-white/45 truncate">
                                  Genera una propuesta base.
                                </span>
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsAddQuestionMenuOpen(false);
                                onAddQuestion();
                              }}
                              className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/5"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/60 transition-colors group-hover:bg-white/10 group-hover:text-white">
                                <Plus className="h-5 w-5" strokeWidth={2} />
                              </div>
                              <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="block text-[14px] font-bold tracking-tight text-white">
                                  Crear manualmente
                                </span>
                                <span className="block text-[11px] font-medium text-white/45 truncate">
                                  Redacta desde cero.
                                </span>
                              </span>
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <RailButton tooltipSide={isRight ? "left" : "top"}
                        icon={<Plus className="h-[20px] w-[20px]" strokeWidth={2} />}
                        label="Añadir pregunta"
                        onClick={onAddQuestion}
                        blockedReason={addQuestionBlockedReason}
                        ignoreOutsideClick
                      />
                    )}
                  </AnimatedActionItem>
                  <AnimatedActionItem animKey={stepChangeKey} staggerIndex={3}>
                    <RailButton tooltipSide={isRight ? "left" : "top"}
                      icon={<Library className="h-[20px] w-[20px]" strokeWidth={2} />}
                      label="Banco de preguntas"
                      onClick={onOpenQuestionBank}
                      blockedReason={addQuestionBlockedReason}
                    />
                  </AnimatedActionItem>
                  <AnimatedActionItem animKey={stepChangeKey} staggerIndex={4}>
                    <RailButton tooltipSide={isRight ? "left" : "top"}
                      icon={
                        isImporting
                          ? <span className="h-[20px] w-[20px] animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                          : <UploadCloud className="h-[20px] w-[20px]" strokeWidth={2} />
                      }
                      label={isImporting ? "Importando…" : "Cargar preguntas desde archivo"}
                      onClick={() => importInputRef.current?.click()}
                      blockedReason={isImporting ? "Importando archivo…" : null}
                      ignoreOutsideClick
                    />
                  </AnimatedActionItem>
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
                </>
              )}

              {isDemographicsStepActive && (
                <>
                  {/* Shimmer overlay for the contextual group */}
                  <div
                    key={`shimmer-demographics-${stepChangeKey}`}
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    style={{
                      animation: "railGroupShimmer 1200ms ease-out both",
                      animationDelay: "200ms",
                    }}
                  />
                  <AnimatedActionItem animKey={stepChangeKey} staggerIndex={0}>
                    <RailButton tooltipSide={isRight ? "left" : "top"}
                      icon={<Plus className="h-[20px] w-[20px]" strokeWidth={2} />}
                      label="Añadir dato demográfico"
                      onClick={onAddDemographic}
                      blockedReason={addDemographicBlockedReason}
                    />
                  </AnimatedActionItem>
                </>
              )}

              {activeStep === "participants" && participantsSelectionCount > 0 && (
                <>
                  <div
                    key={`shimmer-participants-${stepChangeKey}`}
                    className="pointer-events-none absolute inset-0 rounded-3xl"
                    style={{
                      animation: "railGroupShimmer 1200ms ease-out both",
                      animationDelay: "200ms",
                    }}
                  />
                  <AnimatedActionItem animKey={stepChangeKey} staggerIndex={0} skipColorFlash>
                    <RailSelectionChip
                      count={participantsSelectionCount}
                      onClear={() => onClearParticipantsSelection?.()}
                      gender="m"
                    />
                  </AnimatedActionItem>
                  {/* Only where removing differs from clearing — the directory
                      table's ticks *are* the audience, so it reports no remove. */}
                  {onDeleteParticipantsSelection && (
                    <>
                      <div className={cn("self-stretch bg-white/10", isRight ? "mx-2 my-1 h-px w-auto" : "-mx-1 my-2 w-px")} />
                      <AnimatedActionItem animKey={stepChangeKey} staggerIndex={2}>
                        <RailButton tooltipSide={isRight ? "left" : "top"}
                          icon={
                            <svg className="h-[20px] w-[20px] text-status-negative" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          }
                          label={`Eliminar ${participantsSelectionCount} ${participantsSelectionCount === 1 ? "seleccionado" : "seleccionados"}`}
                          onClick={() => onDeleteParticipantsSelection?.()}
                        />
                      </AnimatedActionItem>
                    </>
                  )}
                  <div className={cn("self-stretch bg-white/10", isRight ? "mx-2 my-1 h-px w-auto" : "-mx-1 my-2 w-px")} />
                </>
              )}

              {(isSectionsStepActive || isDemographicsStepActive || isPagesStepActive) && (
                <>
                  {/* Shimmer for shared preview/info group (only when pages step triggers it) */}
                  {isPagesStepActive && !isSectionsStepActive && !isDemographicsStepActive && (
                    <div
                      key={`shimmer-pages-${stepChangeKey}`}
                      className="pointer-events-none absolute inset-0 rounded-3xl"
                      style={{
                        animation: "railGroupShimmer 1200ms ease-out both",
                        animationDelay: "200ms",
                      }}
                    />
                  )}
                  {(isSectionsStepActive || isPagesStepActive) && (
                    <AnimatedActionItem
                      animKey={stepChangeKey}
                      staggerIndex={isSectionsStepActive ? 6 : isDemographicsStepActive ? 2 : 0}
                    >
                      <RailButton tooltipSide={isRight ? "left" : "top"}
                        icon={<Eye className="h-[20px] w-[20px]" strokeWidth={2} />}
                        label="Vista previa"
                        onClick={onPreview}
                        blockedReason={previewBlockedReason}
                      />
                    </AnimatedActionItem>
                  )}
                </>
              )}

              {(isSectionsStepActive || isDemographicsStepActive || isPagesStepActive) && (
                <div className={cn("self-stretch bg-white/10", isRight ? "mx-2 my-1 h-px w-auto" : "-mx-1 my-2 w-px")} />
              )}

              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    aria-label="Información de participantes, secciones, preguntas, datos demográficos y tiempo"
                    className="dock-item relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    <Info className="h-[20px] w-[20px]" strokeWidth={2} />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  side="top"
                  align="center"
                  sideOffset={16}
                  avoidCollisions={false}
                  className="w-72 rounded-2xl p-4 bg-surface-nav border border-white/10 shadow-rail gap-0"
                >
                  <PopoverTitle className="text-[13px] font-semibold text-white">
                    Información
                  </PopoverTitle>

                  <div className="mt-2 mb-3 h-px bg-white/10" />

                  <dl className="flex flex-col gap-2.5">
                    <InfoRow icon={Users} label="Participantes" value={formatCount(participantsCount)} />
                    {(participantsBreakdown.groups.length > 0 ||
                      participantsBreakdown.outsideCount > 0 ||
                      participantsBreakdown.importedCount > 0) && (
                      <div className="ml-[22px] flex flex-col gap-1 border-l border-white/10 pl-2.5">
                        {participantsBreakdown.groups.map((group) => (
                          <div key={group.label} className="flex items-center justify-between gap-3 text-[11.5px]">
                            <span className="truncate text-white/50">{group.label}</span>
                            <span className="shrink-0 tabular-nums font-medium text-white/80">
                              {formatCount(group.count)}
                            </span>
                          </div>
                        ))}
                        {participantsBreakdown.outsideCount > 0 && (
                          <div className="flex items-center justify-between gap-3 text-[11.5px]">
                            <span className="truncate text-white/50">Fuera de grupos</span>
                            <span className="shrink-0 tabular-nums font-medium text-white/80">
                              {formatCount(participantsBreakdown.outsideCount)}
                            </span>
                          </div>
                        )}
                        {participantsBreakdown.importedCount > 0 && (
                          <div className="flex items-center justify-between gap-3 text-[11.5px]">
                            <span className="truncate text-white/50">Importados</span>
                            <span className="shrink-0 tabular-nums font-medium text-white/80">
                              {formatCount(participantsBreakdown.importedCount)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <InfoRow icon={Layers} label="Secciones" value={sectionCount} />
                    <InfoRow icon={ListChecks} label="Preguntas" value={questionCount} />
                    <InfoRow icon={BarChart3} label="Datos demográficos" value={demographicsCount} />
                    <InfoRow icon={Clock3} label="Tiempo estimado" value={`${estimatedMinutes} min`} />
                  </dl>
                </HoverCardContent>
              </HoverCard>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setAutoHide(!autoHide)}
                    aria-label={autoHide ? "Mantener barra abierta" : "Ocultar barra automáticamente"}
                    className="dock-item relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {!autoHide ? (
                      <Minimize2 className="h-[20px] w-[20px]" strokeWidth={2} />
                    ) : (
                      <Pin className="h-[20px] w-[20px]" strokeWidth={2} />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {autoHide ? "Mantener barra abierta" : "Ocultar barra automáticamente"}
                </TooltipContent>
              </Tooltip>

              <div className={cn("self-stretch bg-white/10", isRight ? "mx-2 my-1 h-px w-auto" : "-mx-1 my-2 w-px")} />

              <RailButton tooltipSide={isRight ? "left" : "top"}
                icon={<Save className="h-[20px] w-[20px]" strokeWidth={2} />}
                label="Guardar encuesta"
                onClick={onSave}
              />

              {canContinue ? (
                <Button
                  size="sm"
                  onClick={onContinue}
                  className="hover-icon-pop relative h-10 gap-2 rounded-full px-4 text-[13px] transition-shadow hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                >
                  {continueLabel}
                  {continueLabel === "Finalizar" ? (
                    <Check className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  )}
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="relative">
                      <Button
                        size="sm"
                        disabled
                        className="pointer-events-none h-10 gap-2 rounded-full px-4 text-[13px] opacity-50"
                      >
                        {continueLabel}
                        {continueLabel === "Finalizar" ? (
                          <Check className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <ArrowRight className="h-4 w-4" strokeWidth={2} />
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
    </>
  );
  }
);
