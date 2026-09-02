const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-results/ParticipationTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /<section className="relative flex flex-col overflow-hidden rounded-2xl border border-border\/60 bg-surface shadow-card shrink-0">[\s\S]*?<\/section>/;

const newSection = `<section className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card shrink-0">
  <div className="grid gap-x-8 gap-y-6 px-6 pt-5 pb-4 lg:grid-cols-[minmax(200px,0.7fr)_minmax(0,1.5fr)_minmax(200px,0.8fr)]">
    
    {/* Left Column: Big Number */}
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-3.5 w-[3px] shrink-0 rounded-full bg-primary" />
          <h2 className="text-[12.5px] font-semibold text-text-primary">Total de participación</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                <div className="flex flex-col gap-3 items-start leading-relaxed">
                  <p className="text-[12px]"><strong>Participación:</strong><br/>Es el porcentaje de personas invitadas que completaron la encuesta.</p>
                  <FormulaBlock numerator="Personas que completaron" denominator="Personas invitadas" result="% de participación" />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5 mt-2">
        <span className="text-[34px] font-extrabold leading-none tracking-tight tabular-nums text-text-primary">
          {formatPercent(results.participation.rate)}
        </span>
        <span className="text-[11px] font-medium text-text-muted">
          {formatCount(completed)} de {formatCount(invited)} invitados · meta {PARTICIPATION_TARGET}%
        </span>
      </div>
    </div>

    {/* Middle Column: 4 Circles */}
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <span className="text-[11px] font-semibold text-text-muted">Estado de los invitados</span>
        <span className="text-[11px] font-medium tabular-nums text-text-muted">{formatCount(invited)} en total</span>
      </div>
      
      <div className="flex flex-1 items-center justify-between gap-2">
        {/* Circle 1: Participación */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative text-primary">
            <RingGauge value={results.participation.rate} ariaLabel="Tasa de participación" size={72} strokeWidth={6.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-text-primary">
              {formatPercent(results.participation.rate)}
            </span>
          </div>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[12px] font-bold text-text-secondary">Participación</span>
            <span className="text-[11px] font-medium text-text-muted mt-0.5">{formatCount(completed + inProgress)}</span>
          </div>
        </div>

        {/* Circle 2: Completadas */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative text-status-positive">
            <RingGauge value={(completed / invited) * 100} ariaLabel="Completadas" size={72} strokeWidth={6.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-text-primary">
              {Math.round((completed / invited) * 100)}%
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleEstadoFilter("Completado")}
            aria-pressed={estadoFilter.has("Completado")}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              estadoFilter.has("Completado")
                ? "border-primary bg-primary/[0.08] text-primary"
                : "border-border/70 bg-surface-muted/60 text-text-secondary hover:border-primary/40 hover:text-text-primary"
            )}
          >
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: POSITIVE }} />
            Completadas
            <span className="font-bold tabular-nums text-text-primary ml-0.5">{formatCount(completed)}</span>
          </button>
        </div>

        {/* Circle 3: En progreso */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative text-[#EAB308]">
            <RingGauge value={(inProgress / invited) * 100} ariaLabel="En progreso" size={72} strokeWidth={6.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-text-primary">
              {Math.round((inProgress / invited) * 100)}%
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleEstadoFilter("En progreso")}
            aria-pressed={estadoFilter.has("En progreso")}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              estadoFilter.has("En progreso")
                ? "border-primary bg-primary/[0.08] text-primary"
                : "border-border/70 bg-surface-muted/60 text-text-secondary hover:border-primary/40 hover:text-text-primary"
            )}
          >
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: YELLOW }} />
            En progreso
            <span className="font-bold tabular-nums text-text-primary ml-0.5">{formatCount(inProgress)}</span>
          </button>
        </div>

        {/* Circle 4: Faltan */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="relative text-status-negative">
            <RingGauge value={(missing / invited) * 100} ariaLabel="Faltan" size={72} strokeWidth={6.5} />
            <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-text-primary">
              {Math.round((missing / invited) * 100)}%
            </span>
          </div>
          <button
            type="button"
            onClick={() => toggleEstadoFilter("Falta")}
            aria-pressed={estadoFilter.has("Falta")}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              estadoFilter.has("Falta")
                ? "border-primary bg-primary/[0.08] text-primary"
                : "border-border/70 bg-surface-muted/60 text-text-secondary hover:border-primary/40 hover:text-text-primary"
            )}
          >
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: NEGATIVE }} />
            Faltan
            <span className="font-bold tabular-nums text-text-primary ml-0.5">{formatCount(missing)}</span>
          </button>
        </div>
      </div>
    </div>

    {/* Right Column: Top 3 Areas */}
    <div className="flex flex-col min-w-[180px] lg:border-l lg:border-border/40 lg:pl-6">
      <span className="text-[11px] font-semibold text-text-muted mb-4">Top 3 {segment.label.toLowerCase()} mayor partic.</span>
      <div className="flex flex-col gap-3">
         {[...rows].sort((a, b) => b.rate - a.rate).slice(0, 3).map(r => (
           <div key={r.id} className="flex flex-col gap-1.5">
             <div className="flex justify-between items-end text-[11px] leading-none">
               <span className="text-text-secondary truncate pr-2 font-medium">{r.label}</span>
               <span className="text-text-primary font-bold tabular-nums">{formatPercent(r.rate)}</span>
             </div>
             <Progress value={r.rate} color="primary" className="h-1" />
           </div>
         ))}
      </div>
    </div>
  </div>

  <div className="relative mt-2 flex flex-col text-primary">
    <div className="flex items-baseline justify-between text-[10.5px] font-semibold tabular-nums text-text-muted px-6">
      <span>Tendencia por medición</span>
    </div>
    <div className="mt-1">
      <Sparkline
        points={results.trend.map((point) => ({ id: point.label, name: point.label, value: point.participation }))}
        target={PARTICIPATION_TARGET}
        format={formatPercent}
        ariaLabel={\`Participación de las últimas \${results.trend.length} mediciones\`}
        height={56}
        showPoints
        fitTarget={false}
      />
    </div>
  </div>
</section>`;

if (regex.test(content)) {
  content = content.replace(regex, newSection);
} else {
  console.log('Regex did not match.');
}

if (!content.includes('TooltipProvider')) {
  content = content.replace(
    'import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";',
    'import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";'
  );
}
if (!content.includes('import { Info } from')) {
    content = content.replace(
        'import { Search, Users, X, Eye, EyeOff, Bell } from "lucide-react";',
        'import { Search, Users, X, Eye, EyeOff, Bell, Info } from "lucide-react";'
    );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patched layout');
