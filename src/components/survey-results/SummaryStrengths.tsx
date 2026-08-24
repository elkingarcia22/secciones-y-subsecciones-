import { Sparkles, Trophy } from "lucide-react";
import { POSITIVE, YELLOW, formatPercent, FAVORABILITY_TARGET } from "./favorabilityScale";
import type { Finding } from "./summaryModel";
import { cn } from "@/lib/utils";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/**
 * Fortalezas para apalancar
 *
 * Celebramos las fortalezas con un diseño prominente (Hero cards). 
 * Cada fortaleza relevante obtiene su propia tarjeta grande con una métrica
 * circular destacada, dándole el protagonismo que merece.
 */
export function SummaryStrengths({ strengths }: { strengths: readonly Finding[] }) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/50 bg-muted/40 px-5 py-3.5">
        <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
        <h2 className="text-[13px] font-bold text-text-primary">Fortalezas para apalancar</h2>
        <span className="text-[11px] text-muted-foreground">
          La base para comunicar los cambios
        </span>
      </header>

      {strengths.length === 0 ? (
        <p className="px-5 py-8 text-[12.5px] leading-relaxed text-muted-foreground">
          Ningún bloque del alcance alcanza todavía el rango de fortaleza.
        </p>
      ) : (
        <div className="flex flex-col md:flex-row flex-wrap gap-6 p-6 lg:p-8 items-stretch">
          {strengths.map((finding, idx) => (
            <StrengthHeroCard key={finding.id} finding={finding} index={idx} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * One strength, on a neutral card with a coloured ring.
 *
 * The green wash and green border tinted the whole surface with the verdict,
 * which left the ring — the one thing that actually carries the score's band —
 * with nothing to say. The card is chrome; only the figure is coloured.
 */
function StrengthHeroCard({ finding, index }: { finding: Finding; index: number }) {
  const color = finding.favorability >= FAVORABILITY_TARGET ? POSITIVE : YELLOW;

  return (
    <div
      className={cn(
        "flex-1 min-w-[280px] rounded-[24px] border border-border/50 bg-surface p-8 flex flex-col items-center justify-center text-center relative shadow-sm",
        "transition-transform hover:scale-[1.01] duration-300"
      )}
    >
      <div className="mb-7 relative">
        <BigCircularScore score={finding.favorability} color={color} />
        
        <div
          className="absolute -top-1 -right-2 flex h-9 w-9 items-center justify-center rounded-full text-white font-black text-[14px] shadow-lg ring-4 ring-white dark:ring-slate-950"
          style={{ backgroundColor: color }}
        >
          {index + 1}
        </div>
      </div>

      <div className="inline-flex items-center justify-center rounded-full bg-muted/40 px-3 py-1 mb-4 border border-border/50">
        {index === 0 ? (
          <>
            <Trophy className="mr-1.5 h-3.5 w-3.5" style={{ color }} strokeWidth={2.5} />
            <span className="text-[11.5px] font-bold text-text-secondary">Mayor fortaleza</span>
          </>
        ) : (
          <>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" style={{ color }} strokeWidth={2.5} />
            <span className="text-[11.5px] font-bold text-text-secondary">Fortaleza destacada</span>
          </>
        )}
      </div>

      <h3 className="text-[18px] lg:text-[20px] font-extrabold text-text-primary mb-3 leading-tight">
        {finding.title}
      </h3>
      
      <p className="text-muted-foreground text-[13px] max-w-[280px]">
        {index === 0
          ? "Es el aspecto mejor evaluado de la medición, respaldado por "
          : "Es una de las principales fortalezas del equipo, respaldada por "}
        <strong className="font-bold text-text-primary">{formatCount(finding.n)}</strong>{" "}
        respuestas.
      </p>
    </div>
  );
}

function BigCircularScore({ score, color }: { score: number; color: string }) {
  const size = 130;
  const stroke = 10;
  const normalizedRadius = (size - stroke) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg height={size} width={size} className="-rotate-90 drop-shadow-sm">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="text-border/40"
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 1s ease-in-out" }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[34px] font-black tabular-nums tracking-tighter leading-none"
          style={{ color }}
        >
          {formatPercent(score)}
        </span>
        <span className="mt-1 text-[10px] font-semibold text-muted-foreground opacity-80">Fav.</span>
      </div>
    </div>
  );
}
