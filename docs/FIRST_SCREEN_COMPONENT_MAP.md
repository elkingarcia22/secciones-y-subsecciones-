# Component Bindings: Survey Analytics Dashboard

**Status:** ⚠️ REVISED (Hotfix 8.3.1)  
**Date:** 2026-05-05  
**Phase:** 8.3 (Hotfix) → 8.4 (First Screen Build)  

---

## Screen Architecture

```
Survey Analytics Dashboard (src/screens/SurveyAnalyticsDashboard.tsx)
│
├─ Header Section
│  └─ PageHeader (from @/components/utility)
│
├─ Filter Section
│  ├─ DateFilterBar (from @/components/date)
│  └─ Segment selector (existing component)
│
├─ KPI Row (4 metric cards)
│  ├─ SurveyMetricCard x4
│  └─ Data: mockData.metrics array
│
├─ Favorability Section (2-column)
│  ├─ Column 1: FavorabilityDistributionCard
│  │  └─ Data: mockData.distribution.segments
│  └─ Column 2: ResponseStackedBarGroup
│     └─ Data: segment breakdown (TBD)
│
├─ Participation Section (2-column)
│  ├─ Column 1: ParticipationTrendCard
│  │  └─ Data: mockData.timeSeries
│  └─ Column 2: Card (secondary metrics)
│
├─ Timeline Section (full width)
│  └─ TrendMetricLineChart
│     └─ Data: mockData.timeSeries
│
├─ Insights Placeholder
│  └─ Card component (Phase 8.5)
│
└─ Footer Section
   └─ Metadata + timestamp
```

---

## Section Bindings (ACTUAL APIS)

### 1. Header Section

**Component:** `PageHeader`  
**Import Path:** ✅ `import { PageHeader } from '@/components/utility'`

**Props:**
- `title` (string, required): "Survey Analytics Dashboard"
- `description` (string): "Real-time sentiment tracking and response analysis"
- `breadcrumbs` (ReactNode): Optional breadcrumb navigation
- `actions` (ReactNode): Optional header actions

**Data Source:** Static

---

### 2. Filter Section

**Component:** `DateFilterBar`  
**Import:** `import { DateFilterBar } from '@/components/date'`

**Props:**
- `mode` ('period' | 'date' | 'range'): Active mode
- `onModeChange`: Mode change callback
- `period` (string): Period value when mode='period'
- `onPeriodChange`: Period change callback
- `date` (Date): Single date when mode='date'
- `onDateChange`: Date change callback
- `range` ({ from?: Date; to?: Date }): Date range when mode='range'
- `onRangeChange`: Range change callback

**⚠️ CRITICAL:** Uses `Date` objects, NOT ISO strings

---

### 3. KPI Row (SurveyMetricCard x4)

**Component:** `SurveyMetricCard`  
**Import:** `import { SurveyMetricCard } from '@/components/survey-analytics'`

**Data Source:** `mockData.metrics[]` array

**Structure:**
```typescript
interface MetricData {
  id: string              // "nps", "csat", "effort", "response_count"
  label: string
  value: number           // Current value
  previousValue: number   // Previous period
  delta: number           // Change amount
  deltaPercentage: number
  trend: 'up' | 'down' | 'neutral'
  unit?: string           // "%", "pts", ""
  description?: string
}
```

**Props per Card:**
```typescript
<SurveyMetricCard
  title={metric.label}            // "NPS Score", "CSAT", etc.
  value={metric.value}            // Required
  subtitle={metric.unit}          // "%", "pts"
  delta={metric.delta}
  deltaLabel={metric.delta.toString()}
  deltaTone={metric.delta > 0 ? 'positive' : 'negative'}
  trendDirection={metric.trend}
/>
```

**Grid Layout:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

**Loading:** 4x `<Skeleton className="h-24" />`

---

### 4. Favorability (Column 1)

**Component:** `FavorabilityDistributionCard`  
**Import:** `import { FavorabilityDistributionCard } from '@/components/survey-analytics'`

**Data Source:** `mockData.distribution`

**Props:**
```typescript
<FavorabilityDistributionCard
  title="Overall Sentiment"
  segments={mockData.distribution.segments}
  total={mockData.distribution.total}
  showLegend={true}
/>
```

**Structure:**
```typescript
interface ResponseSegment {
  id: string
  label: string           // "Promoter", "Passive", "Detractor"
  value: number           // Count
  percentage: number      // 0-100
  color: string           // Token: 'text-green-600'
  semanticTone?: 'positive' | 'neutral' | 'negative'
}
```

---

### 5. Favorability (Column 2)

**Component:** `ResponseStackedBarGroup`  
**Import:** `import { ResponseStackedBarGroup } from '@/components/survey-analytics'`

**Props:**
```typescript
<ResponseStackedBarGroup
  title="By Segment"
  items={segmentData}              // ResponseStackedBarItem[]
  showLegend={true}
  showPercentages={true}
/>

interface ResponseStackedBarItem {
  id: string
  label: string                    // "Region: US", etc.
  segments: ResponseSegment[]
  total?: number
  metadata?: string                // "N=450"
}
```

**⚠️ DATA GAP:** `mockData` has single `distribution`, not per-segment breakdown. Requires either:
- Separate query for segment breakdown
- Derivation from available data
- Placeholder if unavailable

---

### 6. Participation (Column 1)

**Component:** `ParticipationTrendCard`  
**Import:** `import { ParticipationTrendCard } from '@/components/survey-analytics'`

**Data Source:** `mockData.timeSeries` (filtered to participation)

**Props:**
```typescript
const participationSeries = mockData.timeSeries.find(s => s.id === 'participation')

<ParticipationTrendCard
  title="Response Rate Trend"
  series={participationSeries ? [participationSeries] : []}
  value={participationSeries?.data[participationSeries.data.length - 1]?.value}
  subtitle="%"
  showComparison={true}
/>
```

**Structure:**
```typescript
interface TrendMetricSeries {
  id: string
  label: string
  data: TrendMetricPoint[]
  tone?: LegendTone
}

interface TrendMetricPoint {
  label: string           // "Apr 5", "Week 1"
  value: number           // 0-100
  comparisonValue?: number
  metadata?: string
}
```

---

### 7. Participation (Column 2)

**Component:** `Card` (standard UI wrapper)  
**Import:** `import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'`

**Usage:**
```typescript
<Card>
  <CardHeader>
    <CardTitle className="text-base">Additional Metrics</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">Engagement Rate</span>
      <span className="font-semibold">{engagementRate}%</span>
    </div>
  </CardContent>
</Card>
```

**Data Source:** Derived or manual calculation

---

### 8. Timeline Section (Full Width)

**Component:** `TrendMetricLineChart`  
**Import:** `import { TrendMetricLineChart } from '@/components/survey-analytics'`

**Wrapper:**
```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>NPS, CSAT & Effort Trends</CardTitle>
    <CardDescription>Multi-metric comparison over selected date range</CardDescription>
  </CardHeader>
  <CardContent>
    <TrendMetricLineChart
      series={mockData.timeSeries}
      showLegend={true}
      height={350}
    />
  </CardContent>
</Card>
```

---

### 9. Insights Placeholder & Footer

**Components:** `Card`, footer metadata

See FIRST_SCREEN_BUILD_PROMPT.md for exact implementation

---

## Props Corrections Summary

| Component | Previous | ACTUAL |
|-----------|----------|--------|
| SurveyMetricCard | `label`, `previousValue`, `unit` | `title`, `value`, `delta`, `deltaLabel`, `deltaTone` |
| FavorabilityDistributionCard | `promoters`, `passives`, `detractors` | `segments: ResponseSegment[]` |
| ResponseStackedBarGroup | `data` prop | `items: ResponseStackedBarItem[]` |
| TrendMetricLineChart | `data`, `metrics` props | `series: TrendMetricSeries[]` |
| DateFilterBar | ISO string dates | `Date` objects |
| Card | Compound syntax | Separate exports |

---

## Key Implementation Notes

1. **Import paths matter:** `PageHeader` from `@/components/utility`, NOT `@/components/layout`
2. **Date handling:** DateFilterBar uses Date objects, screen must convert if needed
3. **No compound Card syntax:** Use `CardHeader`, `CardTitle`, `CardContent` as separate components
4. **Array vs object:** `metrics` is array, `distribution` is object with `segments` array
5. **Series data:** All trends come from `timeSeries` array, NOT separate `trends` property
6. **Loading/error states:** Each card supports `loading`, `empty`, `error` props

