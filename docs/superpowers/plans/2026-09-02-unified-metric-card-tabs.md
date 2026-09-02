# Unified Metric Card for All Tabs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate the ParticipationTab's 3-column metric card layout (big number + ring gauges + top 3 areas) across Favorabilidad, Preguntas, eNPS, and Análisis con IA tabs.

**Architecture:** Extract a shared `MetricSummaryCard` component from ParticipationTab's inline card, then swap each tab's `ResultsSummaryCard` for it. Each tab provides its own rings, top-3 list, and sparkline via props. No data model changes — all derived from existing `SurveyResults` and `SectionResult[]`.

**Tech Stack:** React, TypeScript, Tailwind CSS, existing `RingGauge`/`Progress`/`Sparkline` from `pulseCharts`, existing `FormulaBlock`.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/survey-results/MetricSummaryCard.tsx` | **Create** | Shared 3-column card component |
| `src/components/survey-results/ParticipationTab.tsx` | **Modify** | Replace inline card with `MetricSummaryCard` |
| `src/components/survey-results/FavorabilityTab.tsx` | **Modify** | Replace `ResultsSummaryCard` with `MetricSummaryCard` |
| `src/components/survey-results/QuestionsTab.tsx` | **Modify** | Add `MetricSummaryCard` above the detail table |
| `src/components/survey-results/NpsTab.tsx` | **Modify** | Replace `ResultsSummaryCard` with `MetricSummaryCard` |
| `src/components/survey-results/AiAnalysisTab.tsx` | **Modify** | Replace `ResultsSummaryCard` with `MetricSummaryCard` |

---

## Task 1: Create `MetricSummaryCard` shared component

**Files:**
- Create: `src/components/survey-results/MetricSummaryCard.tsx`

- [ ] **Step 1: Create the component file**

```tsx
import * as React from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { FormulaBlock } from "./FormulaBlock";

interface TopArea {
  id: string;
  label: string;
  value: number;
  /** Display value formatted (e.g. "78,3%") */
  displayValue: string;
}

interface RingItem {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
  count: number;
  /** Whether this ring is currently toggled on */
  active: boolean;
  onToggle: () => void;
}

interface MetricSummaryCardProps {
  /** Section title accent bar color */
  accentColor?: string;
  /** Title text */
  title: string;
  /** Tooltip content explaining the metric */
  hint?: React.ReactNode;
  /** Big number */
  bigValue: string;
  /** Caption below the big number */
  caption: string;
  /** Ring gauge items (3-4 rings) */
  rings: readonly RingItem[];
  /** Label for the rings section */
  ringsLabel: string;
  /** Total count for rings section header */
  ringsTotal: string;
  /** Top areas on the right side */
  topAreasTitle: string;
  topAreas: readonly TopArea[];
  /** Sparkline trend chart */
  chartTitle?: string;
  chart?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * 3-column metric card matching ParticipationTab's layout:
 * - Left: Big number + caption
 * - Middle: Ring gauges with toggle buttons
 * - Right: Top 3 areas with progress bars
 * - Below: Sparkline chart (optional)
 */
export function MetricSummaryCard({
  accentColor = "bg-primary",
  title,
  hint,
  bigValue,
  caption,
  rings,
  ringsLabel,
  ringsTotal,
  topAreasTitle,
  topAreas,
  chartTitle,
  chart,
  children,
}: MetricSummaryCardProps) {
  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card shrink-0">
      <div className="grid gap-x-8 gap-y-6 px-6 pt-5 pb-4 lg:grid-cols-[minmax(250px,1fr)_minmax(0,1.2fr)_minmax(320px,1fr)]">
        {/* Left Column: Big Number */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span aria-hidden className={cn("h-3.5 w-[3px] shrink-0 rounded-full", accentColor)} />
              <h2 className="text-[12.5px] font-semibold text-text-primary">{title}</h2>
              {hint && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md">
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                      {hint}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <span className="text-[34px] font-extrabold leading-none tracking-tight tabular-nums text-text-primary">
              {bigValue}
            </span>
            <span className="text-[11px] font-medium text-text-muted">{caption}</span>
          </div>
        </div>

        {/* Middle Column: Ring Gauges */}
        <div className="flex flex-col">
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-[11px] font-semibold text-text-muted">{ringsLabel}</span>
            <span className="text-[11px] font-medium tabular-nums text-text-muted">{ringsTotal}</span>
          </div>

          <div className="flex flex-1 items-center justify-between gap-2">
            {rings.map((ring) => (
              <div key={ring.id} className="flex flex-col items-center gap-2.5">
                <div className="relative" style={{ color: ring.color }}>
                  <svg width="72" height="72" viewBox="0 0 72 72" aria-label={ring.label}>
                    <circle
                      cx="36" cy="36" r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6.5"
                      strokeOpacity="0.15"
                    />
                    <circle
                      cx="36" cy="36" r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6.5"
                      strokeDasharray={`${(ring.percentage / 100) * 188.5} 188.5`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      transform="rotate(-90 36 36)"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[15px] font-extrabold text-text-primary">
                    {ring.percentage}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={ring.onToggle}
                  aria-pressed={ring.active}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    ring.active
                      ? "border-primary bg-primary/[0.08] text-primary"
                      : "border-border/70 bg-surface-muted/60 text-text-secondary hover:border-primary/40 hover:text-text-primary"
                  )}
                >
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ring.color }} />
                  {ring.label}
                  <span className="font-bold tabular-nums text-text-primary ml-0.5">{ring.count}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top 3 Areas */}
        <div className="flex flex-col min-w-[320px] lg:border-l lg:border-border/40 lg:pl-6">
          <span className="text-[11px] font-semibold text-text-muted mb-4 whitespace-nowrap">{topAreasTitle}</span>
          <div className="flex flex-col gap-3">
            {topAreas.map((area) => (
              <div key={area.id} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-end text-[11px] leading-none">
                  <span className="text-text-secondary truncate pr-2 font-medium">{area.label}</span>
                  <span className="text-text-primary font-bold tabular-nums">{area.displayValue}</span>
                </div>
                <Progress value={area.value} color="primary" className="h-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optional sparkline chart */}
      {chart && (
        <div className="relative mt-2 flex flex-col text-primary">
          <div className="flex items-baseline justify-between text-[10.5px] font-semibold tabular-nums text-text-muted px-6">
            <span>{chartTitle}</span>
          </div>
          <div className="mt-1">{chart}</div>
        </div>
      )}

      {children}
    </section>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors in the new file (other pre-existing errors are fine)

- [ ] **Step 3: Commit**

```bash
git add src/components/survey-results/MetricSummaryCard.tsx
git commit -m "feat: add shared MetricSummaryCard component"
```

---

## Task 2: Refactor ParticipationTab to use MetricSummaryCard

**Files:**
- Modify: `src/components/survey-results/ParticipationTab.tsx`

- [ ] **Step 1: Replace the inline card section (lines 280–438) with MetricSummaryCard**

Remove the entire `<section>` block from line 280 to line 438 and replace with:

```tsx
<MetricSummaryCard
  title="Total de participación"
  hint={
    <div className="flex flex-col gap-3 items-start leading-relaxed">
      <p className="text-[12px]"><strong>Participación:</strong><br/>Es el porcentaje de personas invitadas que completaron la encuesta.</p>
      <FormulaBlock numerator="Personas que completaron" denominator="Personas invitadas" result="% de participación" />
    </div>
  }
  bigValue={formatPercent(results.participation.rate)}
  caption={`${formatCount(completed)} de {formatCount(invited)} invitados · meta ${PARTICIPATION_TARGET}%`}
  ringsLabel="Estado de los invitados"
  ringsTotal={`${formatCount(invited)} en total`}
  rings={[
    {
      id: "completed",
      label: "Completadas",
      value: completed,
      percentage: Math.round((completed / invited) * 100),
      color: POSITIVE,
      count: formatCount(completed),
      active: estadoFilter.has("Completado"),
      onToggle: () => toggleEstadoFilter("Completado"),
    },
    {
      id: "inProgress",
      label: "En progreso",
      value: inProgress,
      percentage: Math.round((inProgress / invited) * 100),
      color: YELLOW,
      count: formatCount(inProgress),
      active: estadoFilter.has("En progreso"),
      onToggle: () => toggleEstadoFilter("En progreso"),
    },
    {
      id: "missing",
      label: "Faltan",
      value: missing,
      percentage: Math.round((missing / invited) * 100),
      color: NEGATIVE,
      count: formatCount(missing),
      active: estadoFilter.has("Falta"),
      onToggle: () => toggleEstadoFilter("Falta"),
    },
  ]}
  topAreasTitle="Top 3 área mayor participación"
  topAreas={[...rows].sort((a, b) => b.rate - a.rate).slice(0, 3).map(r => ({
    id: r.id,
    label: r.label,
    value: r.rate,
    displayValue: formatPercent(r.rate),
  }))}
  chartTitle="Tendencia por medición"
  chart={
    <Sparkline
      points={results.trend.map((point) => ({ id: point.label, name: point.label, value: point.participation }))}
      target={PARTICIPATION_TARGET}
      format={formatPercent}
      ariaLabel={`Participación de las últimas ${results.trend.length} mediciones`}
      height={56}
      showPoints
      fitTarget={false}
    />
  }
/>
```

- [ ] **Step 2: Add the MetricSummaryCard import**

At the top of the file, add:
```tsx
import { MetricSummaryCard } from "./MetricSummaryCard";
```

Remove the now-unused imports: `RingGauge` from pulseCharts (if no longer used elsewhere in the file).

- [ ] **Step 3: Verify it compiles and renders**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Open the app and verify the Participation tab looks identical.

- [ ] **Step 4: Commit**

```bash
git add src/components/survey-results/ParticipationTab.tsx
git commit -m "refactor: ParticipationTab uses shared MetricSummaryCard"
```

---

## Task 3: Refactor FavorabilityTab to use MetricSummaryCard

**Files:**
- Modify: `src/components/survey-results/FavorabilityTab.tsx`

- [ ] **Step 1: Replace ResultsSummaryCard with MetricSummaryCard**

Replace the entire `<ResultsSummaryCard>` block (lines 57–94) with:

```tsx
<MetricSummaryCard
  accentColor="bg-status-positive"
  title="Total de favorabilidad"
  hint={
    <div className="flex flex-col gap-3 items-start leading-relaxed">
      <p className="text-[12px]"><strong>Favorabilidad:</strong><br/>La favorabilidad es el porcentaje de respuestas favorables en una escala de 1 a 5, donde se consideran "favorables" las respuestas de 4 y 5.</p>
      <FormulaBlock
        numerator="Respuestas favorables"
        denominator="Total de respuestas"
        result="% de favorabilidad"
      />
    </div>
  }
  bigValue={formatPercent(results.favorability)}
  caption={`Meta ${FAVORABILITY_TARGET}% · ${results.trend.length} mediciones`}
  ringsLabel="Distribución de respuestas"
  ringsTotal={`${formatCount(results.rankedQuestions.reduce((sum, q) => sum + q.n, 0) + nsNrCount)} en total`}
  rings={[
    {
      id: "favorable",
      label: "Favorables",
      value: favorableCount,
      percentage: Math.round((favorableCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
      color: POSITIVE,
      count: formatCount(favorableCount),
      active: filtersState.tierBands.has("favorable"),
      onToggle: () => filtersState.toggleTierBand("favorable"),
    },
    {
      id: "neutral",
      label: "Neutrales",
      value: neutralCount,
      percentage: Math.round((neutralCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
      color: YELLOW,
      count: formatCount(neutralCount),
      active: filtersState.tierBands.has("neutral"),
      onToggle: () => filtersState.toggleTierBand("neutral"),
    },
    {
      id: "unfavorable",
      label: "Desfavorables",
      value: unfavorableCount,
      percentage: Math.round((unfavorableCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
      color: NEGATIVE,
      count: formatCount(unfavorableCount),
      active: filtersState.tierBands.has("unfavorable"),
      onToggle: () => filtersState.toggleTierBand("unfavorable"),
    },
    {
      id: "nsnr",
      label: "No sabe / No responde",
      value: nsNrCount,
      percentage: Math.round((nsNrCount / (favorableCount + neutralCount + unfavorableCount + nsNrCount)) * 100),
      color: NSNR,
      count: formatCount(nsNrCount),
      active: filtersState.tierBands.has("nsnr"),
      onToggle: () => filtersState.toggleTierBand("nsnr"),
    },
  ]}
  topAreasTitle="Top 3 áreas con mayor favorabilidad"
  topAreas={
    results.sections
      .filter(s => s.n > 0)
      .sort((a, b) => b.favorability - a.favorability)
      .slice(0, 3)
      .map(s => ({
        id: s.id,
        label: s.title,
        value: s.favorability,
        displayValue: formatPercent(s.favorability),
      }))
  }
  chartTitle="Tendencia por medición"
  chart={
    <Sparkline
      points={results.trend.map((point) => ({ id: point.label, name: point.label, value: point.favorability }))}
      target={FAVORABILITY_TARGET}
      format={formatPercent}
      ariaLabel={`Favorabilidad de las últimas ${results.trend.length} mediciones`}
      height={56}
      showPoints
      fitTarget={false}
    />
  }
/>
```

- [ ] **Step 2: Update imports**

Remove `ResultsSummaryCard` import (if no longer used). Add `MetricSummaryCard`. Keep `FormulaBlock`, `Sparkline`, `formatPercent`, `POSITIVE`, `YELLOW`, `NEGATIVE`, `NSNR`, `FAVORABILITY_TARGET`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Open the app, verify the Favorability tab has the new card layout.

- [ ] **Step 4: Commit**

```bash
git add src/components/survey-results/FavorabilityTab.tsx
git commit -m "refactor: FavorabilityTab uses MetricSummaryCard with rings and top 3 areas"
```

---

## Task 4: Add MetricSummaryCard to QuestionsTab

**Files:**
- Modify: `src/components/survey-results/QuestionsTab.tsx`

- [ ] **Step 1: Add the MetricSummaryCard above the detail sections**

Inside the `QuestionsTab` component, before the `<div className="flex flex-col gap-4">` (line 192), insert:

```tsx
<MetricSummaryCard
  accentColor="bg-status-positive"
  title="Total de favorabilidad por preguntas"
  hint={
    <div className="flex flex-col gap-3 items-start leading-relaxed">
      <p className="text-[12px]"><strong>Favorabilidad:</strong><br/>Promedio de favorabilidad de todas las preguntas con escala 1-5.</p>
    </div>
  }
  bigValue={(() => {
    const scored = sections.flatMap(s => [...s.questions, ...flattenChildren(s)].filter(q => q.scored && q.favorability !== null));
    const avg = scored.length > 0 ? scored.reduce((sum, q) => sum + (q.favorability ?? 0), 0) / scored.length : 0;
    return formatPercent(avg);
  })()}
  caption={`${totalQuestions} preguntas con escala`}
  ringsLabel="Distribución general"
  ringsTotal={`${totalQuestions} preguntas`}
  rings={[
    {
      id: "favorable",
      label: "Favorables",
      value: 0,
      percentage: Math.round((sections.reduce((sum, s) => sum + s.questions.filter(q => q.scored && (q.favorability ?? 0) >= 70).length, 0) / Math.max(totalQuestions, 1)) * 100),
      color: POSITIVE,
      count: String(sections.reduce((sum, s) => sum + s.questions.filter(q => q.scored && (q.favorability ?? 0) >= 70).length, 0)),
      active: filtersState.tierBands.has("favorable"),
      onToggle: () => filtersState.toggleTierBand("favorable"),
    },
    {
      id: "neutral",
      label: "Neutrales",
      value: 0,
      percentage: Math.round((sections.reduce((sum, s) => sum + s.questions.filter(q => q.scored && (q.favorability ?? 0) >= 50 && (q.favorability ?? 0) < 70).length, 0) / Math.max(totalQuestions, 1)) * 100),
      color: YELLOW,
      count: String(sections.reduce((sum, s) => sum + s.questions.filter(q => q.scored && (q.favorability ?? 0) >= 50 && (q.favorability ?? 0) < 70).length, 0)),
      active: filtersState.tierBands.has("neutral"),
      onToggle: () => filtersState.toggleTierBand("neutral"),
    },
    {
      id: "unfavorable",
      label: "Desfavorables",
      value: 0,
      percentage: Math.round((sections.reduce((sum, s) => sum + s.questions.filter(q => q.scored && (q.favorability ?? 0) < 50).length, 0) / Math.max(totalQuestions, 1)) * 100),
      color: NEGATIVE,
      count: String(sections.reduce((sum, s) => sum + s.questions.filter(q => q.scored && (q.favorability ?? 0) < 50).length, 0)),
      active: filtersState.tierBands.has("unfavorable"),
      onToggle: () => filtersState.toggleTierBand("unfavorable"),
    },
  ]}
  topAreasTitle="Top 3 áreas con más sentimiento negativo"
  topAreas={
    sections
      .filter(s => s.n > 0)
      .sort((a, b) => a.favorability - b.favorability)
      .slice(0, 3)
      .map(s => ({
        id: s.id,
        label: s.title,
        value: 100 - s.favorability,
        displayValue: formatPercent(100 - s.favorability),
      }))
  }
/>
```

- [ ] **Step 2: Add a helper to flatten children recursively**

Add inside the file (before the `QuestionsTab` function):

```tsx
function flattenChildren(section: SectionResult): readonly QuestionResult[] {
  return section.children.flatMap(child => [...child.questions, ...flattenChildren(child)]);
}
```

- [ ] **Step 3: Add imports**

Add `MetricSummaryCard` and `flattenChildren` is local so no import needed. Ensure `formatPercent`, `POSITIVE`, `YELLOW`, `NEGATIVE` are imported from `favorabilityScale`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 5: Commit**

```bash
git add src/components/survey-results/QuestionsTab.tsx
git commit -m "feat: QuestionsTab adds MetricSummaryCard with top 3 negative areas"
```

---

## Task 5: Refactor NpsTab to use MetricSummaryCard

**Files:**
- Modify: `src/components/survey-results/NpsTab.tsx`

- [ ] **Step 1: Replace ResultsSummaryCard with MetricSummaryCard**

Replace the `<ResultsSummaryCard>` block (lines 664–708) with:

```tsx
<MetricSummaryCard
  accentColor={toneForNps(nps.score) === "positive" ? "bg-status-positive" : toneForNps(nps.score) === "warning" ? "bg-status-warning" : "bg-status-negative"}
  title="Puntaje eNPS"
  hint={
    <div className="flex flex-col gap-3 items-start leading-relaxed">
      <p className="text-[12px]"><strong>Puntaje eNPS:</strong><br/>La fórmula del eNPS resta el porcentaje de detractores al de promotores.</p>
      <div className="flex w-full flex-col gap-1 mt-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">Fórmula</span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-[13px]">{Math.round((counts.promoter / nps.n) * 100)}% Promotores</span>
          <span className="text-[13px] font-semibold opacity-80">−</span>
          <span className="font-semibold text-[13px]">{Math.round((counts.detractor / nps.n) * 100)}% Detractores</span>
          <span className="text-[13px] font-semibold opacity-80">=</span>
          <span className="font-semibold text-[13px]">{nps.score > 0 ? "+" : ""}{nps.score} eNPS</span>
        </div>
      </div>
    </div>
  }
  bigValue={`${nps.score > 0 ? "+" : ""}${nps.score}`}
  caption={`${formatCount(nps.n)} respuestas · escala de -100 a +100`}
  ringsLabel="Distribución de respuestas"
  ringsTotal={`${formatCount(nps.n)} en total`}
  rings={[
    {
      id: "promoter",
      label: "Promotores",
      value: counts.promoter,
      percentage: Math.round((counts.promoter / nps.n) * 100),
      color: POSITIVE,
      count: formatCount(counts.promoter),
      active: tierBands.has("promoter"),
      onToggle: () => toggleTierBand("promoter"),
    },
    {
      id: "passive",
      label: "Neutros",
      value: counts.passive,
      percentage: Math.round((counts.passive / nps.n) * 100),
      color: YELLOW,
      count: formatCount(counts.passive),
      active: tierBands.has("passive"),
      onToggle: () => toggleTierBand("passive"),
    },
    {
      id: "detractor",
      label: "Detractores",
      value: counts.detractor,
      percentage: Math.round((counts.detractor / nps.n) * 100),
      color: NEGATIVE,
      count: formatCount(counts.detractor),
      active: tierBands.has("detractor"),
      onToggle: () => toggleTierBand("detractor"),
    },
  ]}
  topAreasTitle="Top 3 áreas más detractoras"
  topAreas={
    dimensionsData
      .filter(s => s.n > 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map(s => ({
        id: s.id,
        label: s.title,
        value: Math.max(0, 100 + s.score),
        displayValue: `${s.score > 0 ? "+" : ""}${Math.round(s.score)}`,
      }))
  }
  heroChart={<DialGauge value={nps.score} ariaLabel={`eNPS ${nps.score > 0 ? "+" : ""}${nps.score}`} className="w-[128px]" />}
/>
```

- [ ] **Step 2: Update imports**

Add `MetricSummaryCard` import. Remove `ResultsSummaryCard` import if no longer used. Keep `DialGauge`, `BarStrip`, `formatCount`, `toneForNps`, `POSITIVE`, `YELLOW`, `NEGATIVE`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add src/components/survey-results/NpsTab.tsx
git commit -m "refactor: NpsTab uses MetricSummaryCard with rings and top 3 detractor areas"
```

---

## Task 6: Refactor AiAnalysisTab to use MetricSummaryCard

**Files:**
- Modify: `src/components/survey-results/AiAnalysisTab.tsx`

- [ ] **Step 1: Replace ResultsSummaryCard with MetricSummaryCard**

Replace the `<ResultsSummaryCard>` block (lines 210–239) with:

```tsx
<MetricSummaryCard
  accentColor="bg-primary"
  title="Lecturas de la IA"
  hint={
    <div className="flex flex-col gap-3 items-start leading-relaxed">
      <p className="text-[12px]"><strong>Análisis con IA:</strong><br/>Lecturas generadas automáticamente a partir de los resultados de la medición.</p>
    </div>
  }
  bigValue={formatCount(counts.total)}
  caption={`${counts.solidShare}% con confiabilidad alta`}
  ringsLabel="Qué contiene la lectura"
  ringsTotal={`${formatCount(counts.total)} en total`}
  rings={[
    {
      id: "finding",
      label: "Hallazgos",
      value: counts.finding,
      percentage: Math.round((counts.finding / Math.max(counts.total, 1)) * 100),
      color: "var(--color-brand)",
      count: formatCount(counts.finding),
      active: kindFilter.has("finding"),
      onToggle: () => toggleKind("finding"),
    },
    {
      id: "risk",
      label: "Riesgos",
      value: counts.risk,
      percentage: Math.round((counts.risk / Math.max(counts.total, 1)) * 100),
      color: NEGATIVE,
      count: formatCount(counts.risk),
      active: kindFilter.has("risk"),
      onToggle: () => toggleKind("risk"),
    },
    {
      id: "recommendation",
      label: "Acciones sugeridas",
      value: counts.recommendation,
      percentage: Math.round((counts.recommendation / Math.max(counts.total, 1)) * 100),
      color: POSITIVE,
      count: formatCount(counts.recommendation),
      active: kindFilter.has("recommendation"),
      onToggle: () => toggleKind("recommendation"),
    },
  ]}
  topAreasTitle="Top 3 secciones con mayor foco accionable"
  topAreas={
    results.sections
      .filter(s => s.n > 0)
      .sort((a, b) => a.favorability - b.favorability)
      .slice(0, 3)
      .map(s => ({
        id: s.id,
        label: s.title,
        value: 100 - s.favorability,
        displayValue: formatPercent(100 - s.favorability),
      }))
  }
/>
```

- [ ] **Step 2: Update imports**

Add `MetricSummaryCard` import. Remove `ResultsSummaryCard`, `RingGauge`, `MeterRow` if no longer used. Keep `AnimatedNumber`, `formatCount`, `POSITIVE`, `NEGATIVE`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`

- [ ] **Step 4: Commit**

```bash
git add src/components/survey-results/AiAnalysisTab.tsx
git commit -m "refactor: AiAnalysisTab uses MetricSummaryCard with rings and top 3 actionable sections"
```

---

## Task 7: Full build verification

- [ ] **Step 1: Run full typecheck**

Run: `npx tsc --noEmit --pretty`
Expected: No new errors (pre-existing errors OK)

- [ ] **Step 2: Run dev server and visually verify all tabs**

Run: `npm run dev`
Check each tab:
- Participación: 3-column card with rings + top 3 areas + sparkline ✓
- Favorabilidad: 3-column card with 4 rings (Fav/Neu/Des/NSNR) + top 3 favorable areas ✓
- Preguntas: 3-column card above the detail table + top 3 negative areas ✓
- eNPS: 3-column card with 3 rings (Prom/Neu/Det) + top 3 detractor areas ✓
- Análisis con IA: 3-column card with 3 rings (Hall/Ries/Acc) + top 3 actionable areas ✓

- [ ] **Step 3: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "fix: visual tweaks across metric cards"
```
