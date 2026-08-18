# Mock Data Map: Survey Analytics Dashboard

**Status:** ⚠️ REVISED (Hotfix 8.3.1)  
**Date:** 2026-05-05  
**Phase:** 8.3 (Hotfix) → 8.4 (First Screen Build)  
**Screen:** Survey Analytics Dashboard  
**Mock Layer:** Phase 8.1 (Actual Implementation)

---

## Executive Summary

**HOTFIX NOTE:** Previous documentation listed incorrect data structure paths. This document now maps **actual** DashboardData interface (from `src/mocks/types.ts`) to screen components. No new mock functions needed. All data flows through existing Phase 8.1 query functions. Screen never calls mock layer directly — data passed top-down via props.

**Key Corrections:**
- ❌ `data.metrics.nps` (object properties) → ✅ `data.metrics[]` (array of MetricData)
- ❌ `data.segmentBreakdown` (separate property) → ✅ `data.distribution.segments[]` (nested in distribution)
- ❌ `data.participation` (separate property) → ✅ Derive from `data.timeSeries` filtered by participation
- ❌ `data.trends` (separate property) → ✅ `data.timeSeries[]` (contains all trend data)
- ❌ ISO date strings in filters → ✅ `Date` objects in FilterCriteria

---

## Actual DashboardData Structure

```typescript
// From src/mocks/types.ts
export interface DashboardData {
  metrics: MetricData[];              // ARRAY of metric objects
  distribution: {
    label: string;
    segments: ResponseSegment[];      // Segments array (not separate properties)
    total: number;
  };
  timeSeries: TimeSeriesData[];        // All temporal data (trends, participation)
  heatmapData?: HeatmapCell[];
  metadata: {
    lastUpdated: Date;
    source: string;
    period?: {
      start: Date;
      end: Date;
    };
  };
}
```

### Core Types

**MetricData** (for KPI cards):
```typescript
interface MetricData {
  id: string;                    // "nps", "csat", "effort", "response_count"
  label: string;                 // "NPS Score", "CSAT", etc.
  value: number;                 // Current value
  previousValue: number;         // Previous period value
  delta: number;                 // Change (current - previous)
  deltaPercentage: number;       // Percentage change
  trend: 'up' | 'down' | 'neutral';
  unit?: string;                 // "%", "pts", ""
  description?: string;
}
```

**ResponseSegment** (for distribution & stacked bars):
```typescript
interface ResponseSegment {
  id: string;
  label: string;                 // "Promoter", "Passive", "Detractor"
  value: number;                 // Count
  percentage: number;            // 0-100
  color: string;                 // e.g. 'text-primary', 'text-destructive'
  semanticTone?: 'positive' | 'neutral' | 'negative' | 'warning';
}
```

**TimeSeriesData** (for trend charts):
```typescript
interface TimeSeriesData {
  id: string;                    // "participation", "nps_trend", etc.
  label: string;                 // "Response Rate", "NPS Trend", etc.
  data: ChartDataPoint[];        // Time series points
  unit?: string;                 // "%", "pts"
  color?: string;
  comparison?: { label: string; data: ChartDataPoint[] };
}

interface ChartDataPoint {
  label: string;                 // "Apr 5", "Week 1", "2026-04-05"
  value: number;                 // Y-axis value
  secondaryValue?: number;       // For comparison
  category?: string;
  timestamp?: number;
}
```

**FilterCriteria** (for queries):
```typescript
interface FilterCriteria {
  dateRange?: {
    start: Date;                 // Date objects, NOT ISO strings
    end: Date;
  };
  segment?: string;
  region?: string;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

---

## Mock Data Query Architecture

```
Phase 8.4 Screen (SurveyAnalyticsDashboard.tsx)
│
├─ useEffect(() => {
│    const filters = getFiltersFromURL()         // Returns FilterCriteria with Date objects
│    const data = getMockSurveyDashboardData(filters)
│    setScreenData(data)
│  }, [filters])
│
└─ Pass data → Components via props
   ├─ SurveyMetricCard ← data.metrics[index]
   ├─ FavorabilityDistributionCard ← data.distribution
   ├─ ResponseStackedBarGroup ← derived from data.distribution.segments or separate query
   ├─ ParticipationTrendCard ← data.timeSeries.find(s => s.id === 'participation')
   └─ TrendMetricLineChart ← data.timeSeries
```

---

## Primary Query Function

### getMockSurveyDashboardData(filters: FilterCriteria)

**Location:** `src/mocks/index.ts`

**Purpose:** Complete dashboard data snapshot matching all components

**Input:**
```typescript
// FilterCriteria with Date objects (NOT ISO strings)
{
  dateRange: {
    start: new Date('2026-04-01'),
    end: new Date('2026-05-05')
  },
  segment?: 'us' | 'eu' | 'apac',
  region?: string,
  category?: string
}
```

**Output:**
```typescript
interface DashboardData {
  // KPI Row Section
  metrics: MetricData[]          // Array of 4 metrics: [NPS, CSAT, Effort, Response Count]
  
  // Favorability Section - Column 1
  distribution: {
    label: string;              // "Overall Sentiment"
    segments: ResponseSegment[]; // Array: [Promoter, Passive, Detractor]
    total: number;
  }
  
  // Timeline Section & Participation
  timeSeries: TimeSeriesData[]   // All temporal data (includes participation trend)
  
  // Metadata
  metadata: {
    lastUpdated: Date;
    source: string;
    period: { start: Date; end: Date };
  }
}
```

**Implementation Location:** `src/mocks/generators/surveyGenerators.ts::generateSurveyDashboardData()`

**Transformations Applied:**
- Date object handling (not ISO string conversion)
- Segment filtering (if specified)
- Metric delta calculation (current - previousValue)
- Time series aggregation (groups by time interval)

---

## Component-to-Data Bindings

### Section 1: KPI Row (4x SurveyMetricCard)

**Data Source:** `data.metrics` (MetricData array)

**Binding Map:**

| Card Index | Typical id | Data Path | Note |
|-----------|-----------|-----------|-------|
| 0 | "nps" | `data.metrics[0]` | NPS metric |
| 1 | "csat" | `data.metrics[1]` | CSAT metric |
| 2 | "effort" | `data.metrics[2]` | Effort metric |
| 3 | "response_count" | `data.metrics[3]` | Response count |

**ACTUAL Component Props** (from SurveyMetricCardProps):
```typescript
<SurveyMetricCard
  title={metric.label}           // "NPS Score", "CSAT", etc.
  value={metric.value}           // Current value (REQUIRED)
  subtitle={metric.unit}         // "%", "pts", ""
  delta={metric.delta}
  deltaLabel={metric.deltaPercentage.toString() + '%'}
  deltaTone={metric.delta > 0 ? 'positive' : 'negative'}
  trendDirection={metric.trend}  // 'up' | 'down' | 'neutral'
  description={metric.description}
/>
```

**Data Structure (MetricData):**
```typescript
interface MetricData {
  id: string;                    // "nps", "csat", "effort", "response_count"
  label: string;                 // "NPS Score", "CSAT Score", etc.
  value: number;                 // Current period value
  previousValue: number;         // Previous period (for comparison)
  delta: number;                 // Change: current - previous
  deltaPercentage: number;       // Percentage change
  trend: 'up' | 'down' | 'neutral';
  unit?: string;                 // "%", "pts", ""
  description?: string;
}
```

**Example from mockData:**
```typescript
{
  id: "nps",
  label: "NPS Score",
  value: 72,                     // Current
  previousValue: 68,
  delta: 4,                       // 72 - 68
  deltaPercentage: 5.9,
  trend: "up",
  unit: "pts"
}
```

---

### Section 2: Favorability (Column 1 - FavorabilityDistributionCard)

**Data Source:** `data.distribution` (object with segments array)

**ACTUAL Component Props** (from FavorabilityDistributionCardProps):
```typescript
<FavorabilityDistributionCard
  title="Overall Sentiment"
  segments={dashboardData.distribution.segments}  // ResponseSegment[] (REQUIRED)
  total={dashboardData.distribution.total}
  showLegend={true}
/>
```

**Data Structure:**
```typescript
interface Distribution {
  label: string;                   // "Overall Sentiment", etc.
  segments: ResponseSegment[];     // Array of sentiment categories
  total: number;                   // Sum of all segment values
}

interface ResponseSegment {
  id: string;                      // "promoter", "passive", "detractor"
  label: string;                   // "Promoter", "Passive", "Detractor"
  value: number;                   // Count
  percentage: number;              // 0-100 (calculated from value/total)
  color: string;                   // e.g. 'text-green-600', 'text-yellow-500'
  semanticTone?: 'positive' | 'neutral' | 'negative' | 'warning';
}
```

**Example from mockData:**
```typescript
{
  label: "Overall Sentiment",
  segments: [
    {
      id: "promoter",
      label: "Promoter",
      value: 450,
      percentage: 56.25,
      color: "text-green-600",
      semanticTone: "positive"
    },
    {
      id: "passive",
      label: "Passive",
      value: 250,
      percentage: 31.25,
      color: "text-yellow-500",
      semanticTone: "neutral"
    },
    {
      id: "detractor",
      label: "Detractor",
      value: 100,
      percentage: 12.5,
      color: "text-destructive",
      semanticTone: "negative"
    }
  ],
  total: 800
}
```

**Component Behavior:**
- Renders stacked bar visualization from segments array
- Displays legend with segment labels and colors
- Shows percentages calculated from value/total

---

### Section 3: Favorability (Column 2 - ResponseStackedBarGroup)

**Data Source:** `data.distribution.segments` OR separate segment breakdown query

**⚠️ DATA GAP:** Current mockData provides single `distribution` (overall sentiment), not per-segment breakdown. Options:
1. Use same segments array as Column 1 (less useful—duplicates distribution)
2. Derive from separate segment dimension (requires separate query)
3. Leave as placeholder until segment breakdown data available

**ACTUAL Component Props** (from ResponseStackedBarGroupProps):
```typescript
<ResponseStackedBarGroup
  items={segmentBreakdownItems}  // ResponseStackedBarItem[] (REQUIRED)
  title="By Segment"
  showLegend={true}
  showPercentages={true}
/>
```

**Data Structure:**
```typescript
interface ResponseStackedBarItem {
  id: string;                    // "us", "eu", "apac"
  label: string;                 // "Region: US", "Segment: New", etc.
  segments: ResponseSegment[];   // Same as distribution.segments (promoter/passive/detractor)
  total?: number;
  metadata?: string;             // "N=450" (sample size)
}
```

**Example (if derived from available data):**
```typescript
[
  {
    id: "us",
    label: "Region: US",
    segments: [
      { id: "promoter", label: "Promoter", value: 180, percentage: 60, color: "text-green-600" },
      { id: "passive", label: "Passive", value: 90, percentage: 30, color: "text-yellow-500" },
      { id: "detractor", label: "Detractor", value: 30, percentage: 10, color: "text-destructive" }
    ],
    total: 300,
    metadata: "N=300"
  },
  // ... more segments
]
```

**Component Behavior:**
- Each item becomes one horizontal stacked bar
- Stacks show distribution of promoter/passive/detractor per category
- Shared legend shows colors across all bars
- Optional percentages displayed on each segment

---

### Section 4: Participation (Column 1 - ParticipationTrendCard)

**Data Source:** `data.timeSeries` (filtered by id='participation')

**ACTUAL Component Props** (from ParticipationTrendCardProps):
```typescript
const participationSeries = dashboardData.timeSeries.find(s => s.id === 'participation')

<ParticipationTrendCard
  title="Response Rate Trend"
  series={participationSeries ? [participationSeries] : []}  // TrendMetricSeries[] (REQUIRED)
  value={participationSeries?.data[participationSeries.data.length - 1]?.value}  // Latest value
  subtitle="%"
  delta={calculateDelta(participationSeries)}
  showComparison={true}
/>
```

**Data Structure:**
```typescript
interface TimeSeriesData {
  id: string;                    // "participation"
  label: string;                 // "Response Rate Trend"
  data: ChartDataPoint[];        // Array of time points
  unit?: string;                 // "%"
  color?: string;
  comparison?: {
    label: string;
    data: ChartDataPoint[];      // For comparison (e.g., previous period)
  };
}

interface ChartDataPoint {
  label: string;                 // "Apr 5", "Week 1", "2026-04-05"
  value: number;                 // Response rate percentage (0-100)
  secondaryValue?: number;       // Engagement rate or other metric
  category?: string;
  timestamp?: number;
}
```

**Example from mockData:**
```typescript
{
  id: "participation",
  label: "Response Rate Trend",
  data: [
    { label: "Apr 5", value: 38, secondaryValue: 72 },   // 38% response, 72% engaged
    { label: "Apr 12", value: 42, secondaryValue: 75 },
    { label: "Apr 19", value: 45, secondaryValue: 78 },
    { label: "Apr 26", value: 43, secondaryValue: 76 },
    { label: "May 3", value: 47, secondaryValue: 80 }
  ],
  unit: "%",
  color: "text-blue-600"
}
```

**Component Behavior:**
- Renders trend line from data array
- Shows latest value as KPI metric
- Optional comparison line if comparison data provided
- Shows percentage change (delta) from first to last point

---

### Section 5: Timeline (Full Width - TrendMetricLineChart)

**Data Source:** `data.timeSeries` (multiple trend series)

**ACTUAL Component Props** (from TrendMetricLineChartProps):
```typescript
<TrendMetricLineChart
  series={dashboardData.timeSeries}           // TrendMetricSeries[] (REQUIRED)
  height={350}
  showLegend={true}
  showComparison={true}
/>
```

**Data Structure:**
```typescript
interface TimeSeriesData {
  id: string;                    // "nps_trend", "csat_trend", "effort_trend"
  label: string;                 // "NPS", "CSAT", "Effort Score"
  data: ChartDataPoint[];        // Array of time points
  unit?: string;                 // "%", "pts", "score"
  color?: string;                // Tailwind token (e.g., 'text-blue-600')
  comparison?: {
    label: string;               // "Previous Period"
    data: ChartDataPoint[];
  };
}

interface ChartDataPoint {
  label: string;                 // "Apr 1", "Week 1", "2026-04-01"
  value: number;                 // Metric value
  secondaryValue?: number;       // For comparison
  category?: string;
  timestamp?: number;
}
```

**Example from mockData:**
```typescript
[
  {
    id: "nps_trend",
    label: "NPS",
    data: [
      { label: "Apr 1", value: 68 },
      { label: "Apr 2", value: 69 },
      { label: "Apr 3", value: 70 },
      // ... more points
    ],
    unit: "pts",
    color: "text-blue-600"
  },
  {
    id: "csat_trend",
    label: "CSAT",
    data: [
      { label: "Apr 1", value: 82 },
      { label: "Apr 2", value: 81 },
      { label: "Apr 3", value: 83 },
      // ... more points
    ],
    unit: "%",
    color: "text-green-600"
  },
  {
    id: "effort_trend",
    label: "Effort",
    data: [
      { label: "Apr 1", value: 7 },
      { label: "Apr 2", value: 7 },
      { label: "Apr 3", value: 6 },
      // ... more points
    ],
    unit: "score",
    color: "text-orange-600"
  }
]
```

**Component Behavior:**
- Renders multiple line series from timeSeries array
- Each series becomes separate line with distinct color
- X-axis: date/time labels from ChartDataPoint.label
- Y-axis: metric values (auto-scaled per series)
- Legend shows all series with color indicators
- Tooltip shows all metrics at selected point
- Optional comparison lines if comparison data present

---

## Data Transformation Pipeline

```
URL Query Params (?from=...&to=...&segments=...)
        ↓
Parse to FilterCriteria { dateRange: { start: Date, end: Date }, segment?: string, ... }
        ↓
getMockSurveyDashboardData(criteria)
        ↓
Raw Mock Data + Applied Filters
        ↓
Return DashboardData { metrics[], distribution, timeSeries[], metadata }
        ↓
Components (Via props only)
```

### Filter Criteria Handling

**Input (FilterCriteria with Date objects):**
```typescript
{
  dateRange: {
    start: new Date('2026-04-01'),    // NOT ISO string
    end: new Date('2026-05-05')
  },
  segment?: 'us' | 'eu' | 'apac',
  region?: string,
  category?: string
}
```

**Inside getMockSurveyDashboardData():**
1. Filter metrics array to selected segment (if specified)
2. Filter timeSeries data points to within dateRange
3. Filter distribution segments to selected segment (if specified)
4. Calculate deltas from previousValue
5. Return complete DashboardData structure

**Output (DashboardData):**
```typescript
{
  metrics: MetricData[],              // Filtered by segment
  distribution: { label, segments, total },  // Filtered by segment
  timeSeries: TimeSeriesData[],       // Filtered by date range
  metadata: { lastUpdated, source, period }
}
```

---

## Filter State to Data Flow

### From URL to Mock Query with Date Objects

```
URL Query Params
  ├─ ?from=2026-04-01
  ├─ &to=2026-05-05
  └─ &segment=us
        ↓
useSearchParams() in screen
        ↓
Parse to FilterCriteria (convert ISO strings → Date objects)
  {
    dateRange: {
      start: new Date('2026-04-01'),     // NOT ISO string
      end: new Date('2026-05-05')
    },
    segment: 'us'
  }
        ↓
getMockSurveyDashboardData(criteria)
        ↓
DashboardData { metrics[], distribution, timeSeries[], metadata }
        ↓
Pass to Components via Props
```

### Implementation Example

**URL:** `?from=2026-04-01&to=2026-05-05&segment=us`

**Step 1: Parse and Convert to Date Objects**
```typescript
const searchParams = useSearchParams()

const criteria: FilterCriteria = {
  dateRange: {
    start: new Date(searchParams.get('from') || ''),  // String → Date
    end: new Date(searchParams.get('to') || '')
  },
  segment: searchParams.get('segment') || undefined
}
```

**Step 2: Query Mock Data**
```typescript
const dashboardData = getMockSurveyDashboardData(criteria)
// Returns DashboardData with filtered metrics, distribution, timeSeries
```

**Step 3: Render Components**
```typescript
// KPI Row
<div className="grid grid-cols-4">
  {dashboardData.metrics.map(metric => (
    <SurveyMetricCard
      key={metric.id}
      title={metric.label}
      value={metric.value}
      delta={metric.delta}
      subtitle={metric.unit}
    />
  ))}
</div>

// Favorability
<FavorabilityDistributionCard
  segments={dashboardData.distribution.segments}
  total={dashboardData.distribution.total}
/>

// Timeline
<TrendMetricLineChart
  series={dashboardData.timeSeries}
/>
```

---

## Fallback & Error Handling

### Empty Data States

**Scenario:** No responses for selected date range

**Handling:** Components should check `data.metrics.length === 0` or `data.distribution.total === 0`

**Example Empty DashboardData:**
```typescript
{
  metrics: [],  // Empty array
  distribution: { label: "", segments: [], total: 0 },
  timeSeries: [],  // Empty array
  metadata: { lastUpdated: now, source: "mock", period: { start, end } }
}
```

**Component Display:** Shows `empty={true}` prop → EmptyState message in each card

### Error States

**Scenario:** Mock function encounters error (invalid filters, corrupted state)

**Handling:** Wrap `getMockSurveyDashboardData()` in try-catch

**Example Error Handling:**
```typescript
try {
  const data = getMockSurveyDashboardData(criteria)
  setDashboardData(data)
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  setError(errorMessage)
}
```

**Component Display:** Shows `error={message}` prop → Alert component

### Loading States

**Scenario:** Data is being fetched/processed

**Handling:** Set `loading={true}` on individual components while data fetches

**Pattern:** Skeleton placeholders (Skeleton component) while fetching
- SurveyMetricCard: `<Skeleton className="h-24" />`
- FavorabilityDistributionCard: `<Skeleton className="h-48" />`
- TrendMetricLineChart: `<Skeleton className="h-96" />`

---

## Testing Data Scenarios

### Scenario 1: Standard Dataset (30 days, All Segments)

**Request:**
```typescript
const criteria: FilterCriteria = {
  dateRange: {
    start: new Date('2026-04-05'),
    end: new Date('2026-05-05')
  }
  // No segment filter → all segments
}
const data = getMockSurveyDashboardData(criteria)
```

**Expected Response:**
- metrics: 4 items (NPS, CSAT, Effort, ResponseCount) with values, deltas, trends
- distribution: 3 segments (Promoter/Passive/Detractor) with percentages
- timeSeries: Multiple series (participation, nps_trend, csat_trend, effort_trend) with 30 data points each
- Full dashboard rendering

### Scenario 2: Single Day, Single Segment

**Request:**
```typescript
const criteria: FilterCriteria = {
  dateRange: {
    start: new Date('2026-05-05'),
    end: new Date('2026-05-05')
  },
  segment: 'us'
}
const data = getMockSurveyDashboardData(criteria)
```

**Expected Response:**
- metrics: 4 items (filtered to US only)
- distribution: 3 segments (aggregated for US)
- timeSeries: Multiple series with 1 data point each
- Single-day dashboard rendering

### Scenario 3: Long Range (90 days)

**Request:**
```typescript
const criteria: FilterCriteria = {
  dateRange: {
    start: new Date('2026-02-05'),
    end: new Date('2026-05-05')
  }
}
const data = getMockSurveyDashboardData(criteria)
```

**Expected Response:**
- metrics: 4 items (aggregated over 90 days)
- distribution: 3 segments (aggregated summary)
- timeSeries: Multiple series with ~90 data points each (daily or weekly aggregation)
- Full dashboard with smooth trend lines

### Scenario 4: Empty Result (Future Date)

**Request:**
```typescript
const criteria: FilterCriteria = {
  dateRange: {
    start: new Date('2026-12-01'),
    end: new Date('2026-12-31')
  }
}
const data = getMockSurveyDashboardData(criteria)
```

**Expected Response:**
- metrics: Empty array `[]`
- distribution: `{ segments: [], total: 0 }`
- timeSeries: Empty array `[]`
- All components show empty state

### Scenario 5: Invalid Date Range

**Request:**
```typescript
const criteria: FilterCriteria = {
  dateRange: {
    start: new Date('2026-05-05'),
    end: new Date('2026-04-05')  // end before start!
  }
}
const data = getMockSurveyDashboardData(criteria)
```

**Expected Response:** Error thrown or invalid result
- Handle with try-catch in screen
- Show error alert to user

---

## Data Consistency Rules

### Invariants (Must Always Hold)

1. **Distribution Total:** `sum(segment.value) === distribution.total`
2. **Distribution Percentages:** `segment.percentage === (segment.value / total) * 100`
3. **Metric Deltas:** `delta === value - previousValue`
4. **Trend Chronological Order:** Chart data points sorted by date ascending
5. **Metric Value Ranges:** 
   - NPS: 0-100
   - CSAT: 0-100
   - Effort: 0-10
   - Response Count: ≥ 0 (integer)
6. **TimeSeries Label Consistency:** All data points in same series have consistent label format
7. **No null/undefined Required Fields:** All required props must have values

### QA Validation Checklist

- [ ] All MetricData objects have required fields: `id, label, value, previousValue, delta, trend`
- [ ] Distribution segments array non-empty OR explicitly empty (not null)
- [ ] Distribution percentages sum to ~100% (within floating-point precision)
- [ ] All ChartDataPoint objects in timeSeries have `label` and `value`
- [ ] Trend dates in chronological order (oldest → newest)
- [ ] No negative values for counts (metrics, responses, segments)
- [ ] Delta calculations correct: `current - previous`
- [ ] Color tokens exist in design system (text-green-600, text-destructive, etc.)
- [ ] Unit labels consistent across metric type (% for CSAT, pts for NPS)

---

## Existing Mock Functions (Phase 8.1)

All required functions already exist in `src/mocks/index.ts`:

- ✅ `getMockSurveyDashboardData(criteria: FilterCriteria): DashboardData` — Main query function for dashboard
- ✅ Supporting generators in `src/mocks/generators/` for metrics, distributions, trends
- ✅ Type definitions in `src/mocks/types.ts` (MetricData, ResponseSegment, TimeSeriesData, etc.)

**New Functions:** ❌ NONE NEEDED

All required data structures and queries already exist. Phase 8.4 screen build only needs to:
1. Call existing mock functions
2. Map returned data to component props
3. Implement state and error handling

---

## Critical Differences from Previous Documentation

| Item | ❌ Previous Doc | ✅ ACTUAL |
|------|------------|--------|
| metrics | `object { nps, csat, effort, responseCount }` | `MetricData[]` array |
| distribution | `{ promoters, passives, detractors, total }` | `{ label, segments[], total }` |
| segmentBreakdown | Separate `data.segmentBreakdown` property | Derived from `distribution.segments` OR separate query |
| participation | Separate `data.participation` property | Filtered from `data.timeSeries` by id |
| trends | Separate `data.trends` property | `data.timeSeries` contains all trends |
| Date handling | ISO date strings (YYYY-MM-DD) | Date objects (new Date()) |
| Card.Header | Compound syntax `Card.Header` | Named export `CardHeader` |
| PageHeader location | `@/components/layout` | `@/components/utility` |

---

## Implementation Checklist (Phase 8.4)

- [ ] Create `src/screens/SurveyAnalyticsDashboard.tsx`
- [ ] Import `getMockSurveyDashboardData` from `src/mocks`
- [ ] Parse URL filters with `useSearchParams()` → convert to `FilterCriteria` with Date objects
- [ ] Call `getMockSurveyDashboardData(criteria)` on filter change
- [ ] Bind returned `DashboardData` to components:
  - [ ] Pass `data.metrics[i]` to each SurveyMetricCard
  - [ ] Pass `data.distribution.segments` to FavorabilityDistributionCard
  - [ ] Pass `data.distribution.segments` or derived data to ResponseStackedBarGroup
  - [ ] Pass `data.timeSeries` filtered by id to ParticipationTrendCard
  - [ ] Pass `data.timeSeries` to TrendMetricLineChart
- [ ] Implement loading state (show Skeleton components while loading)
- [ ] Implement error boundary with try-catch
- [ ] Verify data flows top-down only (no component-level API calls)
- [ ] No hardcoded mock data in components
- [ ] QA validates data consistency (all invariants met)
- [ ] Responsive grid layout (375/768/1024/1440px)
- [ ] WCAG 2.1 AA accessibility
- [ ] Complete 18-item QA checklist

---

## Data Flow Diagram

```
SurveyAnalyticsDashboard.tsx
│
├─ useSearchParams()
│  └─ Parse URL params → FilterCriteria { dateRange: Date objects, segment?, ... }
│
├─ useEffect([criteria])
│  └─ getMockSurveyDashboardData(criteria)
│     └─ Returns: DashboardData { metrics[], distribution, timeSeries[], metadata }
│
├─ State: { data, loading, error }
│
└─ Render Sections
   ├─ PageHeader (static)
   ├─ DateFilterBar (state management)
   ├─ KPI Row
   │  └─ {data.metrics.map(m => <SurveyMetricCard metric={m} />)}
   ├─ Favorability Section
   │  ├─ <FavorabilityDistributionCard segments={data.distribution.segments} />
   │  └─ <ResponseStackedBarGroup items={derivedSegmentBreakdown} />
   ├─ Participation Section
   │  ├─ <ParticipationTrendCard series={data.timeSeries.filter(s => s.id === 'participation')} />
   │  └─ Secondary metrics card
   ├─ Timeline Section
   │  └─ <TrendMetricLineChart series={data.timeSeries.filter(notParticipation)} />
   └─ Footer
```

---

**Status:** ✅ HOTFIX 8.3.1 COMPLETE  
**Phase:** 8.3 (Hotfix) → 8.4 Ready  
**Dependencies:** src/mocks/ Phase 8.1 ✅ Complete  
**Next:** FIRST_SCREEN_BUILD_PROMPT.md (updated with actual APIs)  

Updated: 2026-05-05 (Hotfix 8.3.1)
