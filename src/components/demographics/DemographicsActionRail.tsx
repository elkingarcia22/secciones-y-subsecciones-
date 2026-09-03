import * as React from "react";
import { Copy, Eye, Pencil, Plus, Trash2, Sparkles } from "lucide-react";
import {
  ActionRailShell,
  AnimatedActionItem,
  RailButton,
  RailDivider,
  RailGroupShimmer,
  RailPrimaryAction,
  RailSelectionChip,
  useContextChangeKey,
  useRailPopoutSide,
} from "@/components/action-rail";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAiAgentPanel } from "@/components/app-shell/aiAgentPanelContext";
import { MovingBorderBeam } from "@/components/ui/moving-border-beam";
import { SYSTEM_BLOCK_REASON } from "./demographicRows";

interface DemographicsActionRailProps {
  selectedCount: number;
  /** The lone selected row, when exactly one is selected. */
  selected: { id: string; name: string; origin: "system" | "user" } | null;
  onCreate: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

/**
 * What the demographics list contributes to the shared rail.
 *
 * Same bar as the survey list — same place, same hiding behaviour, same
 * toggle — with this screen's actions in it. System demographics refuse
 * editing and deleting rather than hiding those buttons: the reason ("las del
 * sistema no se pueden modificar") is more useful than a rail that silently
 * holds fewer actions depending on what you picked.
 */
export function DemographicsActionRail({
  selectedCount,
  selected,
  onCreate,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onClearSelection,
}: DemographicsActionRailProps) {
  const { open: aiPanelOpen, context: aiPanelContext, openPanel } = useAiAgentPanel();
  const isAiPanelOpenHere = aiPanelOpen && aiPanelContext === "demographics";
  const popoutSide = useRailPopoutSide();
  const mode = selectedCount === 0 ? "none" : selectedCount === 1 ? "single" : "bulk";
  const animKey = useContextChangeKey(mode);

  const isSystem = selected?.origin === "system";
  const systemBlock = SYSTEM_BLOCK_REASON;

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

        {mode === "single" && selected && (
          <AnimatedActionItem animKey={animKey} staggerIndex={2}>
            <RailButton
              icon={<Eye className="h-[20px] w-[20px]" strokeWidth={2} />}
              label="Ver"
              onClick={() => onView(selected.id)}
            />
          </AnimatedActionItem>
        )}

        {mode === "single" && selected && (
          <AnimatedActionItem animKey={animKey} staggerIndex={3}>
            <RailButton
              icon={<Pencil className="h-[20px] w-[20px]" strokeWidth={2} />}
              label="Editar"
              onClick={() => onEdit(selected.id)}
              blockedReason={isSystem ? systemBlock : null}
            />
          </AnimatedActionItem>
        )}

        <AnimatedActionItem animKey={animKey} staggerIndex={4}>
          <RailButton
            icon={<Copy className="h-[20px] w-[20px]" strokeWidth={2} />}
            label={mode === "bulk" ? `Duplicar (${selectedCount})` : "Duplicar"}
            onClick={onDuplicate}
          />
        </AnimatedActionItem>

        <AnimatedActionItem animKey={animKey} staggerIndex={5}>
          <RailButton
            icon={<Trash2 className="h-[20px] w-[20px]" strokeWidth={2} />}
            label={mode === "bulk" ? `Eliminar (${selectedCount})` : "Eliminar"}
            tone="danger"
            onClick={onDelete}
            blockedReason={mode === "single" && isSystem ? systemBlock : null}
          />
        </AnimatedActionItem>
      </>
    );

  return (
    <>
      <ActionRailShell
        keepOpen={selectedCount > 0 || isAiPanelOpenHere}
        contextual={contextual}
        persistent={
          selectedCount === 0 ? (
            <>
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="ai-icon-gradient-demographics" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--ai-gradient-start))" />
                    <stop offset="100%" stopColor="hsl(var(--ai-gradient-end))" />
                  </linearGradient>
                </defs>
              </svg>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => openPanel("demographics")}
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
                      stroke="url(#ai-icon-gradient-demographics)" 
                      strokeWidth={2.5} 
                    />
                    
                    {/* White icon (hover) */}
                    <Sparkles 
                      className="absolute z-10 h-[18px] w-[18px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                      strokeWidth={2.5} 
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side={popoutSide}>Agente IA</TooltipContent>
              </Tooltip>

              <RailPrimaryAction
                icon={<Plus className="h-4 w-4" strokeWidth={2.5} />}
                label="Crear demográfico"
                onClick={onCreate}
              />
            </>
          ) : null
        }
      />
    </>
  );
}
