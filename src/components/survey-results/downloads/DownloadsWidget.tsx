import * as React from "react";
import { Check, ChevronDown, ChevronUp, ExternalLink, Loader2, RotateCcw, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneChip } from "@/lib/tone";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DownloadEntry } from "./downloadTypes";

interface DownloadsWidgetProps {
  entries: readonly DownloadEntry[];
  /** Retry path only — a finished report has already reached the browser. */
  onDeliver: (id: string) => void;
  onShare: (id: string) => void;
  onOpenDrawer: () => void;
  onDismiss: () => void;
}

/**
 * The minimized face of the download center: a floating card that keeps the
 * preparation visible after "Minimizar y continuar" closed the drawer.
 *
 * It reports the *worst* state of the batch — one file still preparing makes
 * the whole header say "Preparando" — because the reader's question is "can I
 * leave yet?", and a green check with a spinner hidden inside answers it wrong.
 */
export function DownloadsWidget({
  entries,
  onDeliver,
  onShare,
  onOpenDrawer,
  onDismiss,
}: DownloadsWidgetProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const preparing = entries.filter((entry) => entry.status === "preparing");
  const isBusy = preparing.length > 0;

  if (entries.length === 0) return null;

  return (
    <div
      role="status"
      aria-label="Descargas activas"
      // Misma anatomía que una tarjeta del drawer —chip del icono, título,
      // línea de estado y, bajo una divisoria, el cuerpo— sobre la sombra
      // flotante que la separa de la página que sigue debajo.
      className="fixed bottom-6 right-6 z-50 w-[320px] overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-[0_12px_40px_rgb(0,0,0,0.16)]"
    >
      <div className="flex items-center gap-2.5 p-3.5">
        <span
          style={toneChip(isBusy ? "brand" : "positive")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-border/40"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Check className="h-4 w-4" strokeWidth={2.5} />
          )}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13.5px] font-semibold leading-tight text-text-primary">
            {isBusy
              ? `Preparando ${preparing.length === 1 ? "reporte" : `${preparing.length} reportes`}…`
              : entries.length === 1
                ? `${entries[0].format} descargado`
                : "Reportes descargados"}
          </span>
          <span className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
            {isBusy ? `${preparing.length} en progreso` : "Descarga completada"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 self-start text-muted-foreground">
          <WidgetIconButton label="Abrir centro de descargas" onClick={onOpenDrawer}>
            <ExternalLink className="h-3.5 w-3.5" />
          </WidgetIconButton>
          <WidgetIconButton
            label={collapsed ? "Expandir" : "Minimizar"}
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </WidgetIconButton>
          <WidgetIconButton label="Cerrar" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </WidgetIconButton>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-border/50 px-3.5 pb-3.5 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-text-secondary">
              Descargas activas
            </span>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
              {entries.length}
            </span>
          </div>
          {/* Las filas viven dentro de su marco sobre el fondo gris, como las
              listas de las tarjetas del drawer: se leen como un grupo y no
              como archivos sueltos flotando en la tarjeta. */}
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-2">
            {entries.slice(0, 4).map((entry) => {
              const isPreparing = entry.status === "preparing";
              const needsRetry = !isPreparing && !entry.delivered;
              const showsCheck = !isPreparing && !needsRetry;
              return (
                <div
                  key={entry.id}
                  className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-surface px-2.5 py-2"
                >
                  <span className="flex items-center gap-1.5 text-[12px] font-semibold text-text-primary">
                    {showsCheck && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-status-positive" strokeWidth={2.5} />
                    )}
                    <span className="truncate" title={entry.fileName}>
                      {entry.fileName}
                    </span>
                  </span>
                  {isPreparing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">Reporte en progreso</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-[11px] font-bold tabular-nums text-primary">
                        {Math.round(entry.progress)}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-[11px]",
                          needsRetry ? "font-semibold text-status-warning" : "text-text-muted"
                        )}
                      >
                        {needsRetry ? "Descarga bloqueada" : "Descargado"}
                      </span>
                      <button
                        type="button"
                        onClick={() => (needsRetry ? onDeliver(entry.id) : onShare(entry.id))}
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                      >
                        {needsRetry ? (
                          <>
                            <RotateCcw className="h-3 w-3" />
                            Reintentar
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3 w-3" />
                            Compartir
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {entries.length > 4 && (
              <button
                type="button"
                onClick={onOpenDrawer}
                className="self-start rounded-lg border border-dashed border-border/60 px-2.5 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Ver las {entries.length} descargas
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-primary/10 hover:text-primary"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
