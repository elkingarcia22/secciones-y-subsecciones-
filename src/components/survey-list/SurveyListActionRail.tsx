import * as React from "react";
import { Copy, Download, GitCompare, Layout, Plus, Trash2, Sparkles, Upload } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AiAgentDrawer } from "@/components/ai/AiAgentDrawer";
import { MovingBorderBeam } from "@/components/ui/moving-border-beam";
import { AI_GRADIENT } from "@/components/app-shell/appShellData";
import {
  ActionRailShell,
  AnimatedActionItem,
  RailButton,
  RailCreateOption,
  RailDivider,
  RailGroupShimmer,
  RailOverflowMenu,
  RailSelectionChip,
  useContextChangeKey,
} from "@/components/action-rail";
import {
  SURVEY_ACTIONS,
  splitSurveyActions,
  type SurveyActionId,
} from "./surveyListActions";

interface SurveyListActionRailProps {
  /** A row is mid date-edit — an immersive, in-row decision that the rail
   * must not compete with, so the whole rail closes rather than sit there
   * offering an unrelated action on top of it. */
  locked?: boolean;
  selectedCount: number;
  /** The lone selected survey, when exactly one is selected. */
  selectedSurvey: { id: string; name: string; status: string } | null;
  onCreateBlank: () => void;
  onCreateFromTemplate: () => void;
  onCompare: () => void;
  /** Runs one of the selected survey's own actions. */
  onAction: (action: SurveyActionId, surveyId: string) => void;
  onClearSelection: () => void;
  onBulkDuplicate: () => void;
  onBulkExport: () => void;
  onBulkDelete: () => void;
}

/**
 * What the survey list contributes to the shared rail.
 *
 * The bar itself — where it sits, how it hides, the auto-hide toggle — belongs
 * to `ActionRailShell`. This only decides what goes in it, and that changes
 * with the table selection:
 *
 *  - nothing selected → the two ways to make a survey, plus comparing them
 *  - one selected     → that survey's own actions (this replaces the per-row
 *                       "⋮" menu, so the actions live in one place instead of
 *                       hiding behind a hover target on every row)
 *  - several selected → the batch actions
 *
 * Which actions a single survey gets comes from its status, via
 * `surveyListActions` — see there for why the set changes rather than greying
 * out.
 */
export function SurveyListActionRail({
  locked = false,
  selectedCount,
  selectedSurvey,
  onCreateBlank,
  onCreateFromTemplate,
  onCompare,
  onAction,
  onClearSelection,
  onBulkDuplicate,
  onBulkExport,
  onBulkDelete,
}: SurveyListActionRailProps) {
  // Closed and inert, not just missing its buttons — a stray click landing
  // on where the rail used to be must not reach a control that is no longer
  // meant to be there.
  if (locked) return null;

  const mode = selectedCount === 0 ? "none" : selectedCount === 1 ? "single" : "bulk";
  // Keyed on the status too: moving between two surveys at different stages
  // swaps the whole action set, which is exactly the change the stagger exists
  // to announce.
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = React.useState(false);
  const animKey = useContextChangeKey(
    mode === "single" ? `single:${selectedSurvey?.status ?? ""}` : mode
  );
  const { inline, overflow } =
    mode === "single" && selectedSurvey
      ? splitSurveyActions(selectedSurvey.status)
      : { inline: [] as readonly SurveyActionId[], overflow: [] as readonly SurveyActionId[] };

  const contextual =
    selectedCount === 0 ? null : (
      <>
        <RailGroupShimmer animKey={animKey} />

        <AnimatedActionItem animKey={animKey} staggerIndex={0} skipColorFlash>
          <RailSelectionChip count={selectedCount} onClear={onClearSelection} />
        </AnimatedActionItem>
        <AnimatedActionItem animKey={animKey} staggerIndex={1} skipColorFlash>
          <RailDivider />
        </AnimatedActionItem>

        {mode === "single" && selectedSurvey && (
          <>
            {inline.map((id, index) => {
              const spec = SURVEY_ACTIONS[id];
              const Icon = spec.icon;
              return (
                <AnimatedActionItem key={id} animKey={animKey} staggerIndex={2 + index}>
                  <RailButton
                    icon={<Icon className="h-[20px] w-[20px]" strokeWidth={2} />}
                    label={spec.label}
                    tone={spec.tone}
                    onClick={() => onAction(id, selectedSurvey.id)}
                  />
                </AnimatedActionItem>
              );
            })}

            {overflow.length > 0 && (
              <AnimatedActionItem animKey={animKey} staggerIndex={2 + inline.length}>
                <RailOverflowMenu
                  onOpenChange={setIsMenuOpen}
                  items={overflow.map((id) => {
                    const spec = SURVEY_ACTIONS[id];
                    const Icon = spec.icon;
                    return {
                      id,
                      label: spec.label,
                      tone: spec.tone,
                      icon: <Icon className="h-[18px] w-[18px]" strokeWidth={2} />,
                      onClick: () => onAction(id, selectedSurvey.id),
                      subItems: spec.subActions?.map((subId) => {
                        const subSpec = SURVEY_ACTIONS[subId];
                        const SubIcon = subSpec.icon;
                        return {
                          id: subId,
                          label: subSpec.label,
                          icon: <SubIcon className="h-[18px] w-[18px]" strokeWidth={2} />,
                          onClick: () => onAction(subId, selectedSurvey.id),
                        };
                      }),
                    };
                  })}
                />
              </AnimatedActionItem>
            )}
          </>
        )}

        {mode === "bulk" && (
          <>
            <AnimatedActionItem animKey={animKey} staggerIndex={2}>
              <RailButton
                icon={<Copy className="h-[20px] w-[20px]" strokeWidth={2} />}
                label={`Duplicar (${selectedCount})`}
                onClick={onBulkDuplicate}
              />
            </AnimatedActionItem>
            <AnimatedActionItem animKey={animKey} staggerIndex={3}>
              <RailButton
                icon={<Download className="h-[20px] w-[20px]" strokeWidth={2} />}
                label={`Exportar (${selectedCount})`}
                onClick={onBulkExport}
              />
            </AnimatedActionItem>
            <AnimatedActionItem animKey={animKey} staggerIndex={4}>
              <RailButton
                icon={<Trash2 className="h-[20px] w-[20px]" strokeWidth={2} />}
                label={`Eliminar (${selectedCount})`}
                onClick={onBulkDelete}
                tone="danger"
              />
            </AnimatedActionItem>
          </>
        )}
      </>
    );

  return (
    <>
      <ActionRailShell
        keepOpen={selectedCount > 0 || isMenuOpen || aiDrawerOpen}
        contextual={contextual}
        persistent={
          selectedCount === 0 ? (
            <>
              <RailButton
                icon={<GitCompare className="h-[20px] w-[20px]" strokeWidth={2} />}
                label="Comparar encuestas"
                onClick={onCompare}
              />
              
              <RailButton
                icon={<Upload className="h-[20px] w-[20px]" strokeWidth={2} />}
                label="Cargar encuestas"
                onClick={() => console.log("Cargar encuestas")}
              />

              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="ai-icon-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
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
                      className="absolute z-10 h-[18px] w-[18px] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] opacity-100 group-hover:opacity-0 transition-opacity duration-300" 
                      stroke="url(#ai-icon-gradient-2)" 
                      strokeWidth={2.5} 
                    />
                    
                    {/* White icon (hover) */}
                    <Sparkles 
                      className="absolute z-10 h-[18px] w-[18px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                      strokeWidth={2.5} 
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Agente IA
                </TooltipContent>
              </Tooltip>

              <Popover onOpenChange={setIsMenuOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Crear encuesta"
                    className="hover-icon-pop relative flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Crear encuesta
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  side="top"
                  sideOffset={16}
                  className="w-[280px] rounded-2xl border-white/10 bg-surface-nav p-2 text-white/60 shadow-rail"
                >
                  <RailCreateOption
                    icon={<Plus className="h-5 w-5" strokeWidth={2} />}
                    title="Crear en blanco"
                    description="Empieza desde cero"
                    onClick={onCreateBlank}
                  />
                  <RailCreateOption
                    icon={<Layout className="h-5 w-5" strokeWidth={2} />}
                    title="Crear con plantilla"
                    description="Usa un diseño predefinido"
                    onClick={onCreateFromTemplate}
                  />
                </PopoverContent>
              </Popover>
            </>
          ) : null
        }
      />
      <AiAgentDrawer open={aiDrawerOpen} onOpenChange={setAiDrawerOpen} context="dashboard" />
    </>
  );
}
