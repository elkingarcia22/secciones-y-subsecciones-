import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import {
  ActionRailShell,
  AnimatedActionItem,
  RailButton,
  RailDivider,
  RailGroupShimmer,
  RailSelectionChip,
  useContextChangeKey,
} from "@/components/action-rail";

interface DemographicsActionRailProps {
  selectedCount: number;
  /** The lone selected row, when exactly one is selected. */
  selected: { id: string; name: string; origin: "system" | "user" } | null;
  onCreate: () => void;
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
  onEdit,
  onDuplicate,
  onDelete,
  onClearSelection,
}: DemographicsActionRailProps) {
  const mode = selectedCount === 0 ? "none" : selectedCount === 1 ? "single" : "bulk";
  const animKey = useContextChangeKey(mode);

  const isSystem = selected?.origin === "system";
  const systemBlock = "Los demográficos del sistema no se pueden modificar";

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
              icon={<Pencil className="h-[20px] w-[20px]" strokeWidth={2.3} />}
              label="Editar"
              onClick={() => onEdit(selected.id)}
              blockedReason={isSystem ? systemBlock : null}
            />
          </AnimatedActionItem>
        )}

        <AnimatedActionItem animKey={animKey} staggerIndex={3}>
          <RailButton
            icon={<Copy className="h-[20px] w-[20px]" strokeWidth={2.3} />}
            label={mode === "bulk" ? `Duplicar (${selectedCount})` : "Duplicar"}
            onClick={onDuplicate}
          />
        </AnimatedActionItem>

        <AnimatedActionItem animKey={animKey} staggerIndex={4}>
          <RailButton
            icon={<Trash2 className="h-[20px] w-[20px]" strokeWidth={2.3} />}
            label={mode === "bulk" ? `Eliminar (${selectedCount})` : "Eliminar"}
            tone="danger"
            onClick={onDelete}
            blockedReason={mode === "single" && isSystem ? systemBlock : null}
          />
        </AnimatedActionItem>
      </>
    );

  return (
    <ActionRailShell
      keepOpen={selectedCount > 0}
      contextual={contextual}
      persistent={
        selectedCount === 0 ? (
          <button
            type="button"
            onClick={onCreate}
            className="flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-[13px] font-semibold text-white transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Crear demográfico
          </button>
        ) : null
      }
    />
  );
}
