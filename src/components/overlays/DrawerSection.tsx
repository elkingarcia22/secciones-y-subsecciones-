import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { toneChip, type Tone } from "@/lib/tone";

interface DrawerSectionProps {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  hint: string;
  /** Un dato al vuelo sobre lo que hay dentro — cuántas opciones van escritas. */
  badge?: string;
  /**
   * Un control que manda sobre toda la tarjeta —un interruptor de "filtrar o
   * no"—, alineado con el título. Va en la cabecera y no dentro del cuerpo
   * porque enciende el cuerpo entero.
   */
  action?: React.ReactNode;
  /**
   * Los campos de la tarjeta. Opcional: una tarjeta apagada por su `action`
   * no tiene cuerpo, y la divisoria tampoco debe dibujarse sobre nada.
   */
  children?: React.ReactNode;
}

/**
 * Un grupo de un drawer como tarjeta: el chip de su icono, el título, la línea
 * que explica para qué sirve y, bajo una divisoria, sus campos.
 *
 * Es la anatomía de los drawers de demográficos —crear, editar y ver— y la que
 * usa el centro de descargas, para que todos los paneles laterales del producto
 * se lean como la misma cosa.
 */
export function DrawerSection({
  icon: Icon,
  tone,
  title,
  hint,
  badge,
  action,
  children,
}: DrawerSectionProps) {
  return (
    <section className="rounded-2xl border border-border/60 bg-surface p-3.5 shadow-card">
      <header className="flex items-start gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-border/40"
          style={toneChip(tone)}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[13.5px] font-semibold leading-tight text-text-primary">{title}</h3>
            {badge && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">{hint}</p>
        </div>
        {action && <div className="shrink-0 pt-0.5">{action}</div>}
      </header>
      {children && <div className="mt-3 border-t border-border/50 pt-3.5">{children}</div>}
    </section>
  );
}
