import * as React from "react";
import { cn } from "@/lib/utils";

export function AnimatedNumber({ value, format }: { value: number, format: (v: number) => React.ReactNode }) {
  // A subtle fade-in and slide-up animation is much cleaner than a number counter for dashboard metrics.
  return (
    <span className="inline-block animate-in fade-in slide-in-from-bottom-1.5 duration-700 ease-out">
      {format(value)}
    </span>
  );
}

/**
 * Pequeña tarjeta con icono, etiqueta y valor, sin barra de progreso.
 *
 * Passing `onClick` turns it into a button — same card, same type, plus an
 * active ring — so a KPI that filters something reads as the identical object
 * to one that only reports. Anything that changed the layout for the clickable
 * variant would make two dialects of the same card.
 */
export function MiniMetricCard({
  icon: Icon,
  label,
  value,
  tone,
  color,
  bgColor,
  borderColor,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: React.ReactNode;
  tone?: "positive" | "warning" | "yellow" | "neutral" | "negative" | "brand";
  color?: string;
  bgColor?: string;
  borderColor?: string;
  /** Makes the card a button. Omit for a plain readout. */
  onClick?: () => void;
  /** Only meaningful with `onClick`: the narrowing this card applies is on. */
  active?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const interactive = onClick !== undefined;
  const Root = (interactive ? "button" : "div") as "button";

  return (
    <Root
      type={interactive ? "button" : undefined}
      onClick={onClick}
      disabled={interactive ? disabled : undefined}
      aria-pressed={interactive ? active : undefined}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5",
        !bgColor && !active && "border-border/60 bg-surface",
        active && "border-brand bg-brand/[0.04] shadow-[0_0_0_1px_theme(colors.brand.DEFAULT)]",
        // The same lift the Resumen cards use (SummaryStrengths), so a card
        // that reacts to the pointer reacts the way they already do.
        interactive && "text-left transition-transform duration-300",
        interactive && !disabled && "hover:scale-[1.01] hover:shadow-md active:scale-[0.99]",
        interactive && disabled && "cursor-default opacity-60"
      )}
      style={{
        backgroundColor: active ? undefined : bgColor,
        borderColor: active ? undefined : borderColor
      }}
    >
      <div className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        <span className="truncate">{label}</span>
        {children}
      </div>
      <span
        className={cn(
          "text-[24px] font-extrabold tabular-nums leading-none",
          !color && "text-text-primary",
          !color && tone === "positive" && "text-status-positive",
          !color && tone === "warning" && "text-status-warning",
          !color && tone === "yellow" && "text-[#EAB308]",
          !color && tone === "neutral" && "text-muted-foreground",
          !color && tone === "negative" && "text-status-negative",
          !color && tone === "brand" && "text-brand"
        )}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </Root>
  );
}
