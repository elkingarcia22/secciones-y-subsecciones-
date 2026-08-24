import { AlertCircle, Check, Cloud, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { AutosaveState } from "@/hooks/useAutosave";

const TIME_FORMAT = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });

/**
 * Autosave status next to the survey title.
 *
 * It is a status, not a control: nothing here is clickable, because the author
 * has no decision to make — the document already saved itself.
 */
export function AutosaveIndicator({ status, savedAt }: AutosaveState) {
  if (status === "idle") {
    return (
      <Row icon={Cloud} className="bg-surface-muted text-text-secondary">
        Se guarda automáticamente
      </Row>
    );
  }

  if (status === "saving") {
    return (
      <Row icon={RefreshCw} className="bg-surface-muted text-text-primary" spin>
        Guardando…
      </Row>
    );
  }

  if (status === "error") {
    return (
      <Row icon={AlertCircle} className="bg-status-negative/10 text-status-negative">
        No se pudo guardar
      </Row>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Row icon={Check} className="bg-status-positive/10 text-status-positive">
            Guardado
          </Row>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {savedAt ? `Último guardado a las ${TIME_FORMAT.format(savedAt)}` : "Guardado"}
      </TooltipContent>
    </Tooltip>
  );
}

function Row({
  icon: Icon,
  className,
  spin,
  children,
}: {
  icon: typeof Cloud;
  className?: string;
  spin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "flex h-[22px] shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold leading-none",
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", spin && "animate-spin")} strokeWidth={2.5} />
      {children}
    </span>
  );
}
