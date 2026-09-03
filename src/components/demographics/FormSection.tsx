import type * as React from "react";
import type { LucideIcon } from "lucide-react";
import { toneChip, type Tone } from "@/lib/tone";

interface FormSectionProps {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  hint: string;
  /** Un dato al vuelo sobre lo que hay dentro — cuántas opciones van escritas. */
  badge?: string;
  children: React.ReactNode;
}

/**
 * Un grupo del formulario como tarjeta: el chip de su icono, el título, la
 * línea que explica para qué sirve y, bajo una divisoria, sus campos. Misma
 * anatomía en el drawer de crear/editar y en el de ver, para que los dos se
 * lean como el mismo producto.
 */
export function FormSection({ icon: Icon, tone, title, hint, badge, children }: FormSectionProps) {
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
      </header>
      <div className="mt-3 border-t border-border/50 pt-3.5">{children}</div>
    </section>
  );
}
