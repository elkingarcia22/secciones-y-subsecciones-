import * as React from "react";
import { Download, Bell, Minimize2, Pin, Info, Tag, ShieldCheck, Users, Lock, CalendarRange, Sparkles, Eye, type LucideIcon } from "lucide-react";
import { AiAgentDrawer } from "@/components/ai/AiAgentDrawer";
import { MovingBorderBeam } from "@/components/ui/moving-border-beam";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SURVEY_KIND_LABELS, type SurveyDraft } from "@/components/survey-builder";
import type { SegmentDefinition, SurveyResults } from "@/mocks/surveyResults";
import { formatPreviewDate } from "@/components/survey-preview/previewModel";
import {
  RailDragHandle,
  RailSelectionChip,
  useDraggableRail,
  useRailAutoHide,
} from "@/components/action-rail";

interface ResultsActionRailProps {
  draft: SurveyDraft;
  results: SurveyResults;
  /** The Participación table's current breakdown — a person-per-row segment
   * (Colaborador) counts differently from a grouped one (Área, Líder…). */
  segment?: SegmentDefinition;
  selectedCount: number;
  /** People the reminder actually reaches — never those who already
   * finished. With nothing ticked, the survey's own "faltan" total; ticked,
   * the same count summed over just the selected rows. */
  reminderParticipants: number;
  onDownload: () => void;
  onSendReminders: () => void;
  /** Drops the table's tick marks from the rail. */
  onClearSelection: () => void;
  onPreview?: () => void;
}

/** "área" → "áreas", "líder" → "líderes", "país" → "países": every segment
 * label here ends the same way Spanish pluralizes it — a vowel just takes an
 * "s", anything else takes "es". */
function pluralizeEs(label: string): string {
  const lastChar = label.slice(-1).toLowerCase();
  return "aeiouáéíóú".includes(lastChar) ? `${label}s` : `${label}es`;
}

/** "Enviar recordatorio a los faltantes · 37 participantes" with nothing
 * ticked — a reminder is for whoever hasn't finished, never the whole
 * audience — "Enviar recordatorio · 1 área · 3 participantes" for a ticked
 * grouped segment, "Enviar recordatorio · 4 participantes" when each ticked
 * row is already a person. */
function reminderLabel(
  segment: SegmentDefinition | undefined,
  selectedCount: number,
  reminderParticipants: number
): string {
  const participantsWord = reminderParticipants === 1 ? "participante" : "participantes";
  if (selectedCount === 0) {
    return `Enviar recordatorio a los faltantes · ${reminderParticipants} ${participantsWord}`;
  }
  if (!segment || segment.perPerson) {
    return `Enviar recordatorio · ${reminderParticipants} ${participantsWord}`;
  }
  const singular = segment.label.toLowerCase();
  const groupWord = selectedCount === 1 ? singular : pluralizeEs(singular);
  return `Enviar recordatorio · ${selectedCount} ${groupWord} · ${reminderParticipants} ${participantsWord}`;
}

export function ResultsActionRail({
  draft,
  results,
  segment,
  selectedCount,
  reminderParticipants,
  onDownload,
  onSendReminders,
  onClearSelection,
  onPreview,
}: ResultsActionRailProps) {
  const start = formatPreviewDate(draft.startDate);
  const end = formatPreviewDate(draft.endDate);
  const isAnonymous = draft.visibility === "anonymous";
  const [autoHide, setAutoHide] = useRailAutoHide();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceOpenTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // The pin toggle's "keep the bar open" state doubles as its "fixed" state —
  // only while autoHide won't yank the rail away is picking it up safe.
  const isFixed = !autoHide;
  const { barRef, position, isDragging, gripHandlers } = useDraggableRail(isFixed);

  // ── Step-change detection (contextual actions) ──────────
  const prevSelectedRef = React.useRef(selectedCount > 0);
  const [stepChangeKey, setStepChangeKey] = React.useState(0);
  /** False until the mount-grace effect below has run once — lets both
   * sync effects below tell a real change from their own first pass, so
   * neither collapses the rail before the grace period even starts. */
  const hasMountedRef = React.useRef(false);

  const startCollapseTimer = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Do not collapse if autoHide is disabled OR there is an active selection
    if (!autoHide || selectedCount > 0) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 150);
  }, [autoHide, selectedCount]);

  React.useEffect(() => {
    const hasSelection = selectedCount > 0;
    
    // Trigger animation re-renders only when selection presence changes
    if (prevSelectedRef.current !== hasSelection) {
      prevSelectedRef.current = hasSelection;
      setStepChangeKey((k) => k + 1);
    }

    if (hasSelection) {
      // Force the rail open and cancel any pending collapses
      setIsExpanded(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (hasMountedRef.current) {
      // Selection cleared: resume auto-hide if it was configured. Skipped
      // on the effect's own first pass so the mount-grace effect below
      // gets to hold the rail open first.
      if (autoHide) {
        startCollapseTimer();
      }
    }
  }, [selectedCount, autoHide, startCollapseTimer]);

  React.useEffect(() => {
    if (!autoHide || selectedCount > 0) {
      setIsExpanded(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (hasMountedRef.current) {
      setIsExpanded(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [autoHide, selectedCount]);

  // On first mount, hold the rail open for a few seconds before autoHide
  // collapses it — whoever just opened this screen should see the bar
  // open at least once. The cleanup resets `hasMountedRef` rather than
  // leaving it set, because StrictMode runs every effect's
  // setup → cleanup → setup once in dev: without the reset, that replay
  // would see a "mounted" ref on its second setup pass and collapse the
  // rail immediately, well before the real timer below ever fires.
  React.useEffect(() => {
    hasMountedRef.current = true;
    if (!autoHide || selectedCount > 0) {
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
    setIsExpanded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    startCollapseTimer();
  };

  return (
    <div className="absolute inset-x-0 z-50 flex pointer-events-none bottom-0 flex-col items-center justify-end pb-4">
      {/* Hit area for hover. Switches to fixed positioning once dragged, so
          it can sit anywhere in the viewport instead of only at the bottom
          centre dock. Centred with flexbox rather than a translate transform
          — a transformed ancestor becomes the containing block for a fixed-
          position descendant, which would send the dragged bar's coordinates
          to the wrong origin and fling it off-screen. */}
      <div
        ref={barRef}
        className={cn(
          "pointer-events-auto flex items-center justify-end h-16 flex-col px-6 pb-0 w-max",
          position && "fixed z-[60]"
        )}
        style={position ? { left: position.x, top: position.y } : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-visible rounded-3xl transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            isExpanded
              ? "h-14 max-w-[800px] bg-surface-nav px-3 shadow-rail border border-white/10"
              // Collapsed: a full pill rather than a half-rounded hump, so the
              // handle reads as one continuous rounded line from any angle.
              : "h-1.5 max-w-[64px] w-[64px] bg-border-strong shadow-card border-transparent rounded-full translate-y-[2px]"
          )}
        >
          {/* Content that fades/slides in */}
          <div 
            className={cn(
              "dock-container flex items-center gap-2 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] w-max",
              isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
          >
            {isFixed && (
              <>
                <RailDragHandle isDragging={isDragging} {...gripHandlers} />
                <div className="self-stretch bg-white/10 mx-1 my-2 w-px" />
              </>
            )}

            {selectedCount > 0 && (
              <>
                <div
                  key={`shimmer-results-${stepChangeKey}`}
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{
                    animation: "railGroupShimmer 1200ms ease-out both",
                    animationDelay: "200ms",
                  }}
                />
                <AnimatedActionItem animKey={stepChangeKey} staggerIndex={0} skipColorFlash>
                  <RailSelectionChip count={selectedCount} onClear={onClearSelection} gender="m" />
                </AnimatedActionItem>
                <AnimatedActionItem animKey={stepChangeKey} staggerIndex={1} skipColorFlash>
                  <div className="self-stretch bg-white/10 mx-1 my-2 w-px" />
                </AnimatedActionItem>
              </>
            )}

            {/* Always available — with nothing ticked it targets the survey's
                own faltantes, so a reminder never has to wait on a selection. */}
            <AnimatedActionItem animKey={stepChangeKey} staggerIndex={2}>
              <RailButton
                icon={<Bell className="h-[20px] w-[20px]" strokeWidth={2} />}
                label={reminderLabel(segment, selectedCount, reminderParticipants)}
                onClick={onSendReminders}
              />
            </AnimatedActionItem>
            <AnimatedActionItem animKey={stepChangeKey} staggerIndex={3} skipColorFlash>
              <div className="self-stretch bg-white/10 my-2 w-px" />
            </AnimatedActionItem>

            <RailButton
              icon={<Download className="h-[20px] w-[20px]" strokeWidth={2} />}
              label="Descargar información"
              onClick={onDownload}
            />

            {onPreview && (
              <RailButton
                icon={<Eye className="h-[20px] w-[20px]" strokeWidth={2} />}
                label="Vista previa"
                onClick={onPreview}
              />
            )}


            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="ai-icon-gradient-results" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--ai-gradient-start))" />
                  <stop offset="100%" stopColor="hsl(var(--ai-gradient-end))" />
                </linearGradient>
              </defs>
            </svg>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAiDrawerOpen(true)}
                  aria-label="Agente IA"
                  className="group hover-icon-pop relative flex h-10 w-10 items-center justify-center rounded-xl bg-transparent transition-all duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 overflow-hidden"
                >
                  {/* Background animation on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-ai-gradient -z-10" />
                  
                  <MovingBorderBeam 
                    duration={4000}
                    borderWidth={2}
                    rx={12}
                    ry={12}
                    beamSize={60}
                    colorFrom="hsl(var(--ai-gradient-start))"
                    colorTo="hsl(var(--ai-gradient-end))"
                    className="opacity-100 group-hover:opacity-0 transition-opacity duration-300"
                  />
                  
                  {/* Gradient icon (default) */}
                  <Sparkles 
                    className="absolute z-10 h-[20px] w-[20px] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] opacity-100 group-hover:opacity-0 transition-opacity duration-300" 
                    stroke="url(#ai-icon-gradient-results)" 
                    strokeWidth={2.5} 
                  />
                  
                  {/* White icon (hover) */}
                  <Sparkles 
                    className="absolute z-10 h-[20px] w-[20px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                    strokeWidth={2.5} 
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Agente IA</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAutoHide(!autoHide)}
                  aria-label={autoHide ? "Mantener barra abierta" : "Ocultar barra automáticamente"}
                  className="dock-item hover-icon-pop relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
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
          </div>
        </div>
      </div>
      <AiAgentDrawer open={aiDrawerOpen} onOpenChange={setAiDrawerOpen} context="results" />
    </div>
  );
}

function RailButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="dock-item hover-icon-pop relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
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
      <span className="flex items-center gap-2 text-[13px] text-white/60 leading-none">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        {label}
      </span>
      <span className="text-[13px] font-semibold tabular-nums text-white leading-none">{value}</span>
    </div>
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
