import * as React from "react";
import { Download, Bell, Minimize2, Pin, Info, Tag, ShieldCheck, Users, Lock, CalendarRange, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SURVEY_KIND_LABELS, type SurveyDraft } from "@/components/survey-builder";
import type { SegmentDefinition, SurveyResults } from "@/mocks/surveyResults";
import { formatPreviewDate } from "@/components/survey-preview/previewModel";
import { RailSelectionChip } from "@/components/action-rail";

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
}: ResultsActionRailProps) {
  const start = formatPreviewDate(draft.startDate);
  const end = formatPreviewDate(draft.endDate);
  const isAnonymous = draft.visibility === "anonymous";
  const [autoHide, setAutoHide] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(true);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // ── Step-change detection (contextual actions) ──────────
  const prevSelectedRef = React.useRef(selectedCount > 0);
  const [stepChangeKey, setStepChangeKey] = React.useState(0);

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
    } else {
      // Selection cleared: resume auto-hide if it was configured
      if (autoHide) {
        startCollapseTimer();
      }
    }
  }, [selectedCount, autoHide, startCollapseTimer]);

  React.useEffect(() => {
    if (!autoHide || selectedCount > 0) {
      setIsExpanded(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else {
      setIsExpanded(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [autoHide, selectedCount]);

  const handleMouseEnter = () => {
    setIsExpanded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handleMouseLeave = () => {
    startCollapseTimer();
  };

  return (
    <div className="absolute z-50 flex pointer-events-none bottom-0 left-1/2 -translate-x-1/2 flex-col items-center justify-end pb-4">
      {/* Hit area for hover */}
      <div
        className="pointer-events-auto flex items-center justify-end h-16 flex-col px-6 pb-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-[24px] transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            isExpanded
              ? "h-14 max-w-[800px] bg-zinc-900 px-3 shadow-[0_8px_30px_rgb(0,0,0,0.24)] border border-zinc-800/80"
              // Collapsed: a full pill rather than a half-rounded hump, so the
              // handle reads as one continuous rounded line from any angle.
              : "h-1.5 max-w-[64px] w-[64px] bg-zinc-400 shadow-sm border-transparent rounded-full translate-y-[2px]"
          )}
        >
          {/* Content that fades/slides in */}
          <div 
            className={cn(
              "flex items-center gap-2 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] w-max",
              isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
          >
            {selectedCount > 0 && (
              <>
                <div
                  key={`shimmer-results-${stepChangeKey}`}
                  className="pointer-events-none absolute inset-0 rounded-[24px]"
                  style={{
                    animation: "railGroupShimmer 1200ms ease-out both",
                    animationDelay: "200ms",
                  }}
                />
                <AnimatedActionItem animKey={stepChangeKey} staggerIndex={0} skipColorFlash>
                  <RailSelectionChip count={selectedCount} onClear={onClearSelection} gender="m" />
                </AnimatedActionItem>
                <AnimatedActionItem animKey={stepChangeKey} staggerIndex={1} skipColorFlash>
                  <div className="self-stretch bg-zinc-700/60 mx-1 my-2 w-px" />
                </AnimatedActionItem>
              </>
            )}

            {/* Always available — with nothing ticked it targets the survey's
                own faltantes, so a reminder never has to wait on a selection. */}
            <AnimatedActionItem animKey={stepChangeKey} staggerIndex={2}>
              <RailButton
                icon={<Bell className="h-[20px] w-[20px]" strokeWidth={2.3} />}
                label={reminderLabel(segment, selectedCount, reminderParticipants)}
                onClick={onSendReminders}
              />
            </AnimatedActionItem>
            <AnimatedActionItem animKey={stepChangeKey} staggerIndex={3} skipColorFlash>
              <div className="self-stretch bg-zinc-700/60 my-2 w-px" />
            </AnimatedActionItem>

            <RailButton
              icon={<Download className="h-[20px] w-[20px]" strokeWidth={2.3} />}
              label="Descargar información"
              onClick={onDownload}
            />

            <HoverCard openDelay={100} closeDelay={100}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  aria-label="Información de la encuesta"
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                >
                  <Info className="h-[20px] w-[20px]" strokeWidth={2.3} />
                </button>
              </HoverCardTrigger>
              <HoverCardContent
                // Centered on the button rather than flush with its edge —
                // the trigger is small and square, so an offset alignment
                // would visibly overshoot to one side.
                align="center"
                side="top"
                sideOffset={16}
                className="w-[280px] rounded-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-zinc-800/80 bg-zinc-900 text-zinc-400"
              >
                <p className="text-[13px] font-semibold text-zinc-100">Información</p>
                <div className="my-3 h-px bg-zinc-700/60" />
                <dl className="flex flex-col gap-3">
                  {draft.kind && (
                    <InfoRow icon={Tag} label="Tipo" value={SURVEY_KIND_LABELS[draft.kind]} />
                  )}
                  <InfoRow icon={isAnonymous ? ShieldCheck : Users} label="Privacidad" value={isAnonymous ? "Anónima" : "Pública"} />
                  {isAnonymous && (
                    <InfoRow icon={Lock} label="Mínimo por grupo" value={`${results.threshold} respuestas`} />
                  )}
                  <InfoRow icon={Users} label="Audiencia" value={`${results.participation.invited.toLocaleString("es-CO")} invitados`} />
                  <InfoRow icon={CalendarRange} label="Fecha de inicio" value={start ?? "—"} />
                  <InfoRow icon={CalendarRange} label="Fecha de finalización" value={end ?? "—"} />
                </dl>
              </HoverCardContent>
            </HoverCard>

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
          </div>
        </div>
      </div>
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
          className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
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
      <dt className="flex items-center gap-2 text-[12.5px] text-zinc-400">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        {label}
      </dt>
      <dd className="text-[13px] font-semibold tabular-nums text-zinc-100">{value}</dd>
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
