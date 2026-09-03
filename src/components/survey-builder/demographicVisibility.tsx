import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** The single line that groups every section-wide action of an accordion: a
 * labeled strip the author reads as "these act on the whole list at once".
 * Children are the bulk toggles; a `GroupActionDivider` separates clusters. */
export function GroupActionsBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 rounded-lg border border-border/70 bg-muted/30 px-2.5 py-1.5">
      {children}
    </div>
  );
}

/** Thin vertical rule inside `GroupActionsBar`, between clusters of actions. */
export function GroupActionDivider() {
  return <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-border/70" />;
}

/** Icon-only toggle — the row already carries the label as text elsewhere. An
 * optional `tooltip` turns it into a hover explainer, for the choices whose
 * meaning is not obvious from the icon alone. */
export function IconToggleButton({
  icon: Icon,
  isActive,
  label,
  tooltip,
  onSelect,
  disabled = false,
}: {
  icon: LucideIcon;
  isActive: boolean;
  label: string;
  tooltip?: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const button = (
    <button
      type="button"
      aria-pressed={isActive}
      aria-label={label}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "disabled:cursor-not-allowed disabled:opacity-40",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground/70 hover:text-text-primary"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
    </button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** The per-row mostrar/ocultar control for an active field. */
export function RowVisibilityToggle({
  visible,
  onChange,
  disabled = false,
}: {
  visible: boolean;
  onChange: (visible: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/70 bg-muted/30 p-0.5">
      <IconToggleButton
        icon={Eye}
        isActive={visible}
        label="Mostrar al participante"
        tooltip="Mostrar la pregunta al participante para que confirme o corrija su dato."
        onSelect={() => onChange(true)}
        disabled={disabled}
      />
      <IconToggleButton
        icon={EyeOff}
        isActive={!visible}
        label="Ocultar, solo para filtrar"
        tooltip="No mostrarla: el dato se toma de la plataforma o del archivo y solo se usa para filtrar resultados."
        onSelect={() => onChange(false)}
        disabled={disabled}
      />
    </div>
  );
}

/** The section-wide "mostrar todos / ocultar todos" pair, with the mixed hint
 * when the active rows disagree. Rendered inside a `GroupActionsBar`, so it
 * carries no strip of its own — the bar is the strip. */
export function VisibilityBulkRow({
  bulk,
  onVisibleChange,
  disabled = false,
}: {
  bulk: boolean | "mixed" | null;
  onVisibleChange: (visible: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {bulk === "mixed" && (
        <span className="mr-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          Mixto
        </span>
      )}
      <IconToggleButton
        icon={Eye}
        isActive={bulk === true}
        label="Mostrar todos"
        tooltip="Mostrar todos los activos al participante"
        onSelect={() => onVisibleChange(true)}
        disabled={disabled}
      />
      <IconToggleButton
        icon={EyeOff}
        isActive={bulk === false}
        label="Ocultar todos"
        tooltip="Ocultarlos todos y usarlos solo para filtrar"
        onSelect={() => onVisibleChange(false)}
        disabled={disabled}
      />
    </div>
  );
}
