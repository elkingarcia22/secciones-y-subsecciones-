const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-results/ParticipationTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const regex = /<ResultsSummaryCard[\s\S]*?\/>/;

const newCard = `<section className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card shrink-0">
  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/40">
    <div className="flex items-center gap-2">
      <span aria-hidden className="h-4 w-1 shrink-0 rounded-full bg-primary" />
      <h2 className="text-[14px] font-bold text-text-primary">Total de participación</h2>
      <span className="text-[12px] font-medium text-text-muted ml-2">
        {formatCount(completed)} de {formatCount(invited)} invitados · meta {PARTICIPATION_TARGET}%
      </span>
    </div>
  </div>

  <div className="flex flex-wrap lg:flex-nowrap items-center justify-around gap-6 p-6">
    {/* Circle 1: Participación */}
    <div className="flex flex-col items-center gap-3">
      <div className="relative text-primary">
        <RingGauge value={results.participation.rate} ariaLabel="Tasa de participación" size={88} strokeWidth={8} />
        <span className="absolute inset-0 flex items-center justify-center text-[18px] font-extrabold text-text-primary">
          {formatPercent(results.participation.rate)}
        </span>
      </div>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[13px] font-bold text-text-secondary">Participación</span>
        <span className="text-[11px] font-medium text-text-muted">{formatCount(completed + inProgress)}</span>
      </div>
    </div>

    {/* Circle 2: Completadas */}
    <div className="flex flex-col items-center gap-3">
      <div className="relative text-status-positive">
        <RingGauge value={(completed / invited) * 100} ariaLabel="Completadas" size={88} strokeWidth={8} />
        <span className="absolute inset-0 flex items-center justify-center text-[18px] font-extrabold text-text-primary">
          {Math.round((completed / invited) * 100)}%
        </span>
      </div>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[13px] font-bold text-text-secondary">Completadas</span>
        <span className="text-[11px] font-medium text-text-muted">{formatCount(completed)}</span>
      </div>
    </div>

    {/* Circle 3: En progreso */}
    <div className="flex flex-col items-center gap-3">
      <div className="relative text-[#EAB308]">
        <RingGauge value={(inProgress / invited) * 100} ariaLabel="En progreso" size={88} strokeWidth={8} />
        <span className="absolute inset-0 flex items-center justify-center text-[18px] font-extrabold text-text-primary">
          {Math.round((inProgress / invited) * 100)}%
        </span>
      </div>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[13px] font-bold text-text-secondary">En progreso</span>
        <span className="text-[11px] font-medium text-text-muted">{formatCount(inProgress)}</span>
      </div>
    </div>

    {/* Circle 4: Faltan */}
    <div className="flex flex-col items-center gap-3">
      <div className="relative text-status-negative">
        <RingGauge value={(missing / invited) * 100} ariaLabel="Faltan" size={88} strokeWidth={8} />
        <span className="absolute inset-0 flex items-center justify-center text-[18px] font-extrabold text-text-primary">
          {Math.round((missing / invited) * 100)}%
        </span>
      </div>
      <div className="flex flex-col items-center leading-tight">
        <span className="text-[13px] font-bold text-text-secondary">Faltan</span>
        <span className="text-[11px] font-medium text-text-muted">{formatCount(missing)}</span>
      </div>
    </div>
  </div>

  <div className="flex flex-wrap items-center justify-center gap-3 pb-6 border-b border-border/40 px-6">
    {[
      { id: "completed", label: "Completadas", value: completed, color: POSITIVE, active: estadoFilter.has("Completado"), onClick: () => toggleEstadoFilter("Completado") },
      { id: "inProgress", label: "En progreso", value: inProgress, color: YELLOW, active: estadoFilter.has("En progreso"), onClick: () => toggleEstadoFilter("En progreso") },
      { id: "missing", label: "Faltan", value: missing, color: NEGATIVE, active: estadoFilter.has("Falta"), onClick: () => toggleEstadoFilter("Falta") },
    ].map((item) => (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        aria-pressed={item.active}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          item.active
            ? "border-primary bg-primary/[0.08] text-primary"
            : "border-border/70 bg-surface-muted/60 text-text-secondary hover:border-primary/40 hover:text-text-primary"
        )}
      >
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
        {item.label}
        <span className="font-bold tabular-nums text-text-primary">{formatCount(item.value)}</span>
      </button>
    ))}
  </div>

  <div className="relative mt-2 flex flex-col text-primary">
    <div className="flex items-baseline justify-between text-[11px] font-semibold tabular-nums text-text-muted px-6">
      <span>Tendencia por medición</span>
      <span>{results.trend[0]?.label ?? ""} → {results.trend[results.trend.length - 1]?.label ?? ""}</span>
    </div>
    <div className="mt-2">
      <Sparkline
        points={results.trend.map((point) => ({ id: point.label, name: point.label, value: point.participation }))}
        target={PARTICIPATION_TARGET}
        format={formatPercent}
        ariaLabel={\`Participación de las últimas \${results.trend.length} mediciones\`}
        height={64}
        showPoints
        fitTarget={false}
      />
    </div>
  </div>
</section>`;

content = content.replace(regex, newCard);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patched Tab');
