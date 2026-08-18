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
      <Row icon={Cloud} className="bg-border/30 text-text-secondary">
        Se guarda automáticamente
      </Row>
    );
  }

  if (status === "saving") {
    return (
      <Row icon={RefreshCw} className="bg-border/50 text-text-primary" spin>
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
      className={cn("flex items-center gap-1.5 text-[11.5px] font-bold rounded-full px-3 py-1.5", className)}
    >
      <Icon className={cn("h-4 w-4 shrink-0", spin && "animate-spin")} strokeWidth={2.5} />
      {children}
    </span>
  );
}
