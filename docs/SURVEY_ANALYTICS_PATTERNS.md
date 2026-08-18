# Survey Analytics Patterns

**Referencia:** Patrones visuales recurrentes en dashboards de encuestas, reportes analíticos y cards comparativas enterprise.

---

## Introducción

En interfaces B2B enterprise para análisis de encuestas, reportes y comparativos, hay patrones visuales y de datos que se repiten constantemente:

- **Favorabilidad**: distribución de respuestas (Muy favorable → Favorable → Neutral → Desfavorable).
- **Participación**: evolución de participantes a lo largo del tiempo.
- **Tendencia**: cambio de métrica en periodos (Q1, Q2, Q3).
- **Comparativos**: Base vs Periodo anterior vs Periodo actual (con deltas).
- **Deltas**: cambios positivos/negativos con iconografía (↑ ↓).

**Objetivo:** Estandarizar componentes reutilizables para estos patrones en Fase 7D.5.

---

## Patrones Visuales

### 1. FavorabilityDistributionCard

**Uso:** Mostrar distribución de respuestas de una pregunta en una encuesta.

**Patrón Visual:**

```
┌─────────────────────────────────────────┐
│ ¿Recomendarías el producto?              │
│ Favorabilidad: 78% (vs 75% Q1)          │ ← MetricComparisonFooter
├─────────────────────────────────────────┤
│                                         │
│ ███████████░░ Muy Favorable     32%    │  ← ResponseStackedBar
│ ██████░░░░░░ Favorable         24%    │
│ ██░░░░░░░░░░ Neutral            8%    │
│ █░░░░░░░░░░░ Desfavorable       4%    │
│ ░░░░░░░░░░░░ No aplica          32%   │
│                                         │
│ Base: 500 respondientes | Periodo: Q2 │ ← InlineLegend / Footer
└─────────────────────────────────────────┘
```

**Componentes Necesarios:**
- `Card` (contenedor).
- `ResponseStackedBar` (barra segmentada 100%).
- `MetricComparisonFooter` (footer comparativo).
- `InlineLegend` (leyenda).

**Props:**
```typescript
interface FavorabilityDistributionCardProps {
  title: string
  segments: Array<{
    label: string
    value: number
    color: string
  }>
  total: number
  currentValue: number
  previousValue?: number
  currentPeriod: string
  basePeriod?: string
}
```

---

### 2. ParticipationTrendCard

**Uso:** Mostrar evolución de participación a lo largo del tiempo.

**Patrón Visual:**

```
┌─────────────────────────────────────────┐
│ Participación                            │
│ 524 participantes ↑ 8% vs Q1           │ ← DeltaPill
├─────────────────────────────────────────┤
│         ╱╲                              │
│    ╱╲  ╱  ╲  ╱╲                        │
│  ╱  ╲╱    ╲╱  ╲                       │
│ ╱                ╲╱╲╱                │  ← TrendMetricLineChart
│                                         │
│ Q1    Q2    Q3    Q4    Q1             │
│                                         │
│ Q2 Línea de Tendencia: tendencia al    │ ← InlineLegend
│ alza promedio 15 participantes/mes    │
└─────────────────────────────────────────┘
```

**Componentes Necesarios:**
- `Card` (contenedor).
- `TrendMetricLineChart` (ECharts LineChart + areaStyle).
- `DeltaPill` (indicador ↑ ↓).
- `InlineLegend` (descripción).

**Props:**
```typescript
interface ParticipationTrendCardProps {
  title: string
  currentValue: number
  previousValue: number
  data: Array<{ period: string; value: number }>
  showArea?: boolean
  showPoints?: boolean
  color?: string
  trendDescription?: string
}
```

---

### 3. SurveyMetricCard

**Uso:** Card analítica completa que combina métrica, gráfico, comparativo y selector de periodo.

**Patrón Visual:**

```
┌────────────────────────────────────────────────┐
│ Satisfacción General                           │
│ ┌──────────────┬──────────────┬──────────────┐│
│ │ Q1           │ Q2           │ Q3           ││ ← ChartSegmentedTabs
│ └──────────────┴──────────────┴──────────────┘│
├────────────────────────────────────────────────┤
│                                                │
│  Métrica Actual: 8.2/10                       │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │         ╱╲                                │ │
│  │    ╱╲  ╱  ╲  ╱╲                         │ │
│  │  ╱  ╲╱    ╲╱  ╲                        │ │
│  │ ╱                ╲╱╲╱                  │ │
│  │                                        │ │
│  │  Q1      Q2      Q3      Q4      Q1    │ │  ← TrendMetricLineChart
│  └──────────────────────────────────────────┘ │
│                                                │
│ 8.2 ↑ 0.3 vs Q1 | ↑ 0.6 vs Q2             │ ← MetricComparisonFooter
│ Base: 524 respondientes                     │
└────────────────────────────────────────────────┘
```

**Componentes Necesarios:**
- `Card` (contenedor).
- `ChartSegmentedTabs` (selector de período).
- `TrendMetricLineChart` (gráfico principal).
- `MetricComparisonFooter` (comparativo).

**Props:**
```typescript
interface SurveyMetricCardProps {
  title: string
  metric: {
    name: string
    value: number
    unit?: string
  }
  data: Array<{
    period: string
    value: number
  }>
  periods: string[]
  currentPeriod: string
  onPeriodChange: (period: string) => void
  comparisons?: Array<{
    label: string
    value: number
    delta?: number
  }>
  base?: number
  basePeriod?: string
}
```

---

## Componentes Especializados

### DeltaPill
- **Estado:** ✅ Implementado (7D.5A).
- **Uso:** Indicador de cambio positivo/negativo.
- **Variantes:**
  - **Positivo:** ↑ en color verde (`success`).
  - **Negativo:** ↓ en color rojo (`destructive`).
  - **Neutral:** — en color gris.

### MetricComparisonFooter
- **Estado:** ✅ Implementado (7D.5A).
- **Uso:** Footer que muestra comparativos con múltiples períodos.

### InlineLegend
- **Estado:** ✅ Implementado (7D.5A).
- **Uso:** Leyenda posicionada inline en gráficos o áreas de descripción.

### ResponseStackedBar
- **Estado:** ✅ Implementado (7D.5B).
- **Uso:** Barra horizontal 100% segmentada (HTML/CSS nativo).
- **Reglas:**
  - Máximo control visual en segmentos.
  - Accesibilidad: `role="img"` + `aria-label`.
  - Colores semánticos UBITS.

### ResponseStackedBarGroup
- **Estado:** ✅ Implementado (7D.5B).
- **Uso:** Grupo de barras apiladas para comparativas grupales o escalas Likert.

### TrendMetricLineChart
- **Estado:** ✅ Implementado (7D.5C).
- **Uso:** Gráfico de tendencia especializado (ECharts preset).
- **Reglas:**
  - Uso de infraestructura `ChartCard` + `EChart`.
  - Soporte para múltiples series temporales.
  - Visualización de área sutil (0.05 opacity) y símbolos (circles).
  - Tooltips interactivos multiserie.
  - **Comparativos:** Si `showComparison={true}` y los puntos tienen `comparisonValue`, se genera automáticamente una serie secundaria con línea punteada (`dashed`) para referencia histórica o benchmark.

---

## Componentes de Composición (7D.5D)

### [SurveyMetricCard](file:///src/components/survey-analytics/SurveyMetricCard.tsx)
- **Estado:** ✅ Implementado (7D.5D).
- **Propósito:** Resumen de métricas clave (NPS, Satisfacción, Participación) en una tarjeta KPI especializada.
- **Composición:** `Card` + `DeltaPill` + `MetricComparisonFooter`.
- **Reglas:**
  - Título en uppercase tracking-widest (10px).
  - Valor destacado (30px).
  - Soporte para footer sutil con metadata (N=1200).

### [FavorabilityDistributionCard](file:///src/components/survey-analytics/FavorabilityDistributionCard.tsx)
- **Estado:** ✅ Implementado (7D.5D).
- **Propósito:** Visualización de distribución de respuestas Likert para preguntas específicas.
- **Composición:** `Card` + `ResponseStackedBar` + `MetricComparisonFooter`.
- **Reglas:**
  - Título con peso semántico medio.
  - Leyenda interactiva integrada.
  - Pie de página con comparativas porcentuales.

### [ParticipationTrendCard](file:///src/components/survey-analytics/ParticipationTrendCard.tsx)
- **Estado:** ✅ Implementado (7D.5D).
- **Propósito:** Evolución temporal de participación o métricas con destaque de KPI actual.
- **Composición:** `Card` + `TrendMetricLineChart` + `DeltaPill`.
- **Reglas:**
  - Layout dual: KPI highlight arriba, gráfico de tendencia abajo.
  - Sincronización de tonos entre KPI y serie principal.

---

## Oportunidades IA-First (Futuro)
- **Insights de Caída**: Alerta automática cuando el Delta es negativo significativo.
- **Recomendaciones de Acción**: Sugerencias basadas en la distribución de detractores.
- **Predicción de Riesgo**: Lectura temprana de tendencias de participación bajas para mitigar impacto en ARR/Retención.
- **Contribución Estratégica**: Vínculo entre métricas de satisfacción y valor de vida del cliente (CLV).

---

## Reglas Visuales UBITS

### Colores por Concepto

| Concepto | Color Token | Hex | Uso |
|---|---|---|---|
| Favorable | --color-positive | #328e2c | ResponseStackedBar, DeltaPill ↑ |
| Desfavorable | --color-negative | #e9343c | ResponseStackedBar, DeltaPill ↓ |
| Neutral/Warning | --color-warning | #EC9907 | ResponseStackedBar, neutral |
| Info/Trend | --color-info | #4a74ee | TrendMetricLineChart, línea |
| Neutro | --color-text-muted | #979ba3 | DeltaPill neutral |

### Tipografía

- **Título métrica:** `font-size: 14px, font-weight: 600` (SectionHeader style).
- **Valor métrica:** `font-size: 28px, font-weight: 700` (bold).
- **Labels gráfico:** `font-size: 12px, font-weight: 500`.
- **Footer comparativo:** `font-size: 12px, font-weight: 400`.

---

## Accesibilidad

### Estructura ARIA

**ResponseStackedBar:**
```html
<div role="img" aria-label="Distribución: Favorable 32%, Neutral 24%...">
  ...
</div>
```

**TrendMetricLineChart:**
```html
<div role="img" aria-label="Tendencia de satisfacción Q1-Q1">
  <p aria-describedby="trend-desc">Gráfico de línea mostrando evolución</p>
  <p id="trend-desc">Tendencia al alza: 7.6 → 8.2 (+0.6 puntos)</p>
</div>
```

**DeltaPill:**
```html
<div aria-label="Incremento de 8 por ciento">+8%</div>
```
