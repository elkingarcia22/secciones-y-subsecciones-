import * as React from "react";
import { ArrowRight, ChevronUp, HelpCircle, ListOrdered, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  FAVORABILITY_FLOOR,
  FAVORABILITY_TARGET,
  NEGATIVE,
  POSITIVE,
  YELLOW,
  formatPercent,
} from "./favorabilityScale";
import type { AlertTarget, Priority } from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

const SEVERITY_COPY = {
  critical: { label: "Prioridad crítica", variant: "negative" as const },
  high: { label: "Prioridad alta", variant: "warning" as const },
  watch: { label: "En seguimiento", variant: "neutral" as const },
};

/**
 * Prioridades de esta medición — three, not seven.
 *
 * The old "qué atender primero" mixed global problems, section problems,
 * participation, eNPS, comments and strengths into one queue, which meant
 * nobody could tell what was actually first. This block commits: the three
 * highest-scoring priorities, each pairing the quantitative result with the
 * qualitative signal that confirms it — the one combination that produces
 * information neither number carries alone. The score itself stays
 * interrogable behind "¿por qué?", because a ranking nobody can check is an
 * opinion with a layout.
 */
export function SummaryPriorities({
  priorities,
  onNavigate,
}: {
  priorities: readonly Priority[];
  onNavigate: (target: AlertTarget) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(true);

  if (priorities.length === 0) {
    return (
      <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface">
        <PrioritiesHeader isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} />
        {isOpen && (
          <div className="px-6 py-5 animate-in fade-in slide-in-from-top-1 duration-300">
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Ningún bloque del alcance está por debajo del objetivo de {FAVORABILITY_TARGET}%.
              Sostener el resultado es la tarea de este periodo.
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface">
      <PrioritiesHeader isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)} count={priorities.length} />
      {isOpen && (
        <div className="flex min-h-0 flex-col animate-in fade-in slide-in-from-top-1 duration-300">
          <ul className="flex flex-col divide-y divide-border/50">
            {priorities.map((priority, index) => (
              <PriorityRow
                key={priority.finding.id}
                priority={priority}
                rank={index + 1}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function PrioritiesHeader({ isOpen, onToggle, count }: { isOpen: boolean; onToggle: () => void; count?: number }) {
  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Contraer prioridades" : "Expandir prioridades"}
      className={cn(
        "group flex items-start gap-3.5 px-6 py-5 bg-muted/40 transition-colors hover:bg-muted/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
        isOpen && "border-b border-border/50"
      )}
    >
      <div className="mt-1 shrink-0 rounded-md p-0.5 text-muted-foreground/50 transition-colors group-hover:text-text-primary group-hover:bg-border/40">
        <ChevronUp
          className={cn("h-4 w-4 transition-transform duration-300", !isOpen && "rotate-180")}
          strokeWidth={2.5}
        />
      </div>

      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted/60 border border-border/50 text-muted-foreground">
        <ListOrdered className="h-3 w-3" strokeWidth={2.2} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="px-1 py-0.5 text-[15px] font-bold tracking-tight text-text-primary flex flex-wrap items-baseline gap-x-2 gap-y-1">
          Prioridades de esta medición
          <span className="text-[12px] font-medium text-muted-foreground tracking-normal">
            Severidad × alcance × evidencia cualitativa
          </span>
        </p>
      </div>

      {count !== undefined && count > 0 && (
        <div className="shrink-0 pt-0.5 flex items-center gap-1.5">
          <Badge variant="neutral" className="h-5 px-1.5 text-[11px] font-semibold tabular-nums">
            {count}
          </Badge>
        </div>
      )}
    </div>
  );
}

const barColor = (favorability: number): string =>
  favorability >= FAVORABILITY_TARGET
    ? POSITIVE
    : favorability >= FAVORABILITY_FLOOR
      ? YELLOW
      : NEGATIVE;

function PriorityRow({
  priority,
  rank,
  onNavigate,
}: {
  priority: Priority;
  rank: number;
  onNavigate: (target: AlertTarget) => void;
}) {
  const { finding, severity, confidence, why, qual } = priority;
  const severityCopy = SEVERITY_COPY[severity];
  const color = barColor(finding.favorability);

  return (
    <li className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-4">
        <div 
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold tabular-nums"
          style={{ backgroundColor: `${color}1A`, color: color }}
        >
          {rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col">
            <h3 className="text-[14px] font-bold leading-snug text-text-primary">
              {finding.title}
            </h3>
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{finding.parent}</p>
          </div>
          
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={severityCopy.variant} className="text-[10.5px]">
              {severityCopy.label}
            </Badge>
            <Badge variant="neutral" className="text-[10.5px]">
              Confianza {confidence}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Por qué esto aparece como prioridad"
                  className="rounded-md bg-muted/40 p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-text-primary"
                >
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[340px] border-none bg-slate-900 p-4 text-slate-100 shadow-xl"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-[11.5px] font-bold opacity-80">Por qué aparece como prioridad</span>
                  {priority.evidence.map((item) => (
                    <div key={item.label} className="flex flex-col">
                      <span className="text-[10.5px] font-semibold opacity-60">{item.label}</span>
                      <span className="text-[12px] leading-snug">{item.detail}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[24px] font-extrabold leading-none tabular-nums" style={{ color }}>
            {formatPercent(finding.favorability)}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground mt-1">
            {formatCount(finding.n)} respuestas
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 ml-10">
        <div className="flex-1 space-y-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11.5px] font-bold text-text-secondary">Por qué importa</span>
            <p className="text-[12.5px] leading-relaxed text-text-secondary">{why}</p>
          </div>

          {qual && (
            <div className="mt-1 flex w-fit items-center gap-1.5 rounded-md border border-dashed border-border/70 bg-muted/30 px-2 py-1.5 text-[11px] font-medium tabular-nums text-text-secondary">
              <MessageSquareQuote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2.4} />
              {formatCount(qual.mentions)} comentarios sobre {qual.topic.toLowerCase()} · {Math.round(qual.negativeShare)}% negativos
            </div>
          )}
        </div>

        <div className="shrink-0 pt-2 md:pt-0 flex items-center md:items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("favorability")}
            className="h-8 gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            Explorar {shortTitle(finding.title)}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </li>
  );
}

/** "Bienestar y carga de trabajo" → "Bienestar", so the button stays a button. */
const shortTitle = (title: string): string => {
  const first = title.split(/\s+y\s+|\s*[,:–—]\s*/)[0] ?? title;
  return first.length > 18 ? `${first.slice(0, 18)}…` : first;
};
