# Component Decision Gate: Survey Analytics Dashboard

**Status:** ⚠️ REQUIRES REVISION  
**Date:** 2026-05-05 (Hotfix 8.3.1)  
**Phase:** 8.3 (Decision Gate) - Hotfix  
**Screen:** Survey Analytics Dashboard  

---

## Executive Summary

Previous component specifications in Phase 8.3 contained API inaccuracies. This hotfix documents **actual component APIs** as implemented in the codebase. All 12 approved components exist and are usable, but their props and usage patterns differ from prior documentation.

**Components Verified:** 12/12 exist  
**API Accuracy Status:** ⚠️ REVISED  
**Phase 8.4 Readiness:** 🟡 BLOCKED until build prompt updated  

---

## Component Verification (ACTUAL APIS)

### Survey Analytics Components

#### 1. SurveyMetricCard ✅

**File:** `src/components/survey-analytics/SurveyMetricCard.tsx`

**Purpose:** Display single KPI with delta and comparison metrics

**ACTUAL Props:**
```typescript
interface SurveyMetricCardProps {
  title?: string                     // Card title (required for UX)
  description?: string               // Secondary description
  value: string | number             // Main value (REQUIRED)
  subtitle?: string                  // Unit/label for value
  delta?: number                     // Numeric delta (e.g., 4, -2)
  deltaLabel?: string                // Custom delta text (e.g., "+5%")
  deltaTone?: "positive" | "negative" | "neutral"  // Color of delta
  trendDirection?: "up" | "down" | "flat"         // Delta direction icon
  comparisonItems?: ComparisonItem[] // Footer comparison metrics
  actions?: React.ReactNode          // Header actions
  footer?: React.ReactNode           // Custom footer
  loading?: boolean                  // Loading state
  error?: string                     // Error message
  className?: string                 // Custom CSS
}
```

**States:**
- ✅ Loaded: Displays value + delta with tone-based color
- ✅ Loading: Shows skeleton placeholder
- ✅ Error: Shows Alert with error message

**Import:** `import { SurveyMetricCard } from '@/components/survey-analytics'`

**Responsive:** ✅ Tested at 375px, 768px, 1440px  
**Dark Mode:** ✅ Uses UBITS token system  
**Accessibility:** ✅ WCAG 2.1 AA

**PREVIOUS DOC ERROR:**
- ❌ Documented as expecting `label`, `previousValue`, `unit`, `icon`
- ✅ ACTUAL: Expects `title`, `value` (required), `subtitle`, `delta`, `deltaLabel`

**Verdict:** ✅ **APPROVED - USE WITH ACTUAL PROPS**

---

#### 2. FavorabilityDistributionCard ✅

**File:** `src/components/survey-analytics/FavorabilityDistributionCard.tsx`

**Purpose:** Display sentiment/response distribution using stacked bar visualization

**ACTUAL Props:**
```typescript
interface FavorabilityDistributionCardProps {
  title?: string                     // Card title
  description?: string               // Card description
  segments: ResponseSegment[]        // Distribution segments (REQUIRED)
  total?: number                     // Total for percentage calc
  showLegend?: boolean               // Show legend (default: true)
  showComparisonFooter?: boolean     // Show comparison metrics
  comparisonItems?: ComparisonItem[] // Comparison data
  actions?: React.ReactNode          // Header actions
  footer?: React.ReactNode           // Custom footer
  loading?: boolean                  // Loading state
  empty?: boolean                    // Empty state
  error?: string                     // Error message
  className?: string                 // Custom CSS
}

// ResponseSegment shape (from mocks):
interface ResponseSegment {
  id: string
  label: string
  value: number
  percentage: number
  color: string                      // e.g. 'text-primary', 'text-destructive'
  semanticTone?: 'positive' | 'neutral' | 'negative' | 'warning'
}
```

**States:**
- ✅ Loaded: Stacked bar visualization with legend
- ✅ Loading: Skeleton placeholder
- ✅ Empty: "No data" message
- ✅ Error: Alert with error message

**Import:** `import { FavorabilityDistributionCard } from '@/components/survey-analytics'`

**Data Source:** Maps to `mockData.distribution.segments` (not individual promoters/passives/detractors)

**PREVIOUS DOC ERROR:**
- ❌ Documented as expecting individual `promoters`, `passives`, `detractors` props
- ✅ ACTUAL: Expects `segments: ResponseSegment[]` array

**Verdict:** ✅ **APPROVED - USE WITH ACTUAL PROPS**

---

#### 3. ResponseStackedBarGroup ✅

**File:** `src/components/survey-analytics/ResponseStackedBarGroup.tsx`

**Purpose:** Display multiple stacked bars for segment/category comparison

**ACTUAL Props:**
```typescript
interface ResponseStackedBarGroupProps {
  items: ResponseStackedBarItem[]  // Array of bars (REQUIRED)
  title?: string                   // Group title
  description?: string             // Group description
  showLegend?: boolean             // Show shared legend
  showPercentages?: boolean        // Show % labels
  size?: "sm" | "md"              // Bar height
  className?: string               // Custom CSS
}

// Each item:
interface ResponseStackedBarItem {
  id: string
  label: string                    // Bar label (e.g., "Region: US")
  segments: ResponseSegment[]      // Segment breakdown
  total?: number
  description?: string
  metadata?: string                // e.g., "N=450"
}
```

**States:**
- ✅ Loaded: Multiple bars stacked by segments
- ✅ Loading: Skeleton bars
- ✅ Empty: "No data" message

**Import:** `import { ResponseStackedBarGroup } from '@/components/survey-analytics'`

**PREVIOUS DOC ERROR:**
- ❌ Documented as expecting `data` prop with different shape
- ✅ ACTUAL: Expects `items: ResponseStackedBarItem[]`

**Verdict:** ✅ **APPROVED - USE WITH ACTUAL PROPS**

---

#### 4. TrendMetricLineChart ✅

**File:** `src/components/survey-analytics/TrendMetricLineChart.tsx`

**Purpose:** Display multi-metric trend lines over time (using ECharts)

**ACTUAL Props:**
```typescript
interface TrendMetricLineChartProps {
  title?: string                   // Chart title
  description?: string             // Chart description
  series: TrendMetricSeries[]      // Line series data (REQUIRED)
  height?: number                  // Chart height in px
  showLegend?: boolean             // Show legend
  showComparison?: boolean         // Show comparison markers
  loading?: boolean                // Loading state
  empty?: boolean                  // Empty state
  error?: string                   // Error message
  actions?: React.ReactNode        // Header actions
  footer?: React.ReactNode         // Custom footer
  ariaLabel?: string               // Accessibility label
  summary?: string                 // Screen reader summary
  className?: string               // Custom CSS
}

// Series data:
interface TrendMetricSeries {
  id: string
  label: string                    // Series name (e.g., "NPS")
  data: TrendMetricPoint[]         // Data points
  tone?: LegendTone                // Visual color
}

interface TrendMetricPoint {
  label: string                    // X-axis label (e.g., "Jan", "Q1")
  value: number                    // Y-axis value
  comparisonValue?: number         // Optional comparison
  metadata?: string                // Tooltip data
}
```

**States:**
- ✅ Loaded: Multi-line chart with legend
- ✅ Loading: Skeleton placeholder
- ✅ Empty: "No data" message
- ✅ Error: Error message

**Import:** `import { TrendMetricLineChart } from '@/components/survey-analytics'`

**Data Source:** Maps to `mockData.timeSeries` (not `mockData.trends`)

**PREVIOUS DOC ERROR:**
- ❌ Documented as expecting `data` and `metrics` props
- ✅ ACTUAL: Expects `series: TrendMetricSeries[]`

**Verdict:** ✅ **APPROVED - USE WITH ACTUAL PROPS**

---

#### 5. ParticipationTrendCard ✅

**File:** `src/components/survey-analytics/ParticipationTrendCard.tsx`

**Purpose:** Show participation trend with optional KPI highlight (value + delta)

**ACTUAL Props:**
```typescript
interface ParticipationTrendCardProps {
  title?: string                   // Card title
  description?: string             // Card description
  series: TrendMetricSeries[]      // Trend data (REQUIRED)
  value?: string | number          // Optional KPI highlight value
  subtitle?: string                // KPI subtitle/unit
  delta?: number                   // KPI delta
  deltaLabel?: string              // Custom delta label
  deltaTone?: DeltaTone            // Delta color tone
  showComparison?: boolean         // Show comparison in chart
  actions?: React.ReactNode        // Header actions
  footer?: React.ReactNode         // Custom footer
  loading?: boolean                // Loading state
  empty?: boolean                  // Empty state
  error?: string                   // Error message
  className?: string               // Custom CSS
}
```

**States:**
- ✅ Loaded: Chart with optional KPI card
- ✅ Loading: Skeleton placeholder
- ✅ Empty: "No data" message
- ✅ Error: Error message

**Import:** `import { ParticipationTrendCard } from '@/components/survey-analytics'`

**Data Source:** Maps to `mockData.timeSeries` (for chart series)

**Verdict:** ✅ **APPROVED - USE WITH ACTUAL PROPS**

---

### Standard UI Components

#### 6. DateFilterBar ✅

**File:** `src/components/date/DateFilterBar.tsx`

**Purpose:** Date range/period selection with mode switching

**ACTUAL Props:**
```typescript
interface DateFilterBarProps {
  period?: string                  // Selected period value
  onPeriodChange?: (value: string) => void
  date?: Date                      // Selected single date
  onDateChange?: (date?: Date) => void
  range?: { from?: Date; to?: Date }  // Date range
  onRangeChange?: (range?: { from?: Date; to?: Date }) => void
  mode?: 'period' | 'date' | 'range'  // Current mode
  onModeChange?: (mode: DateFilterMode) => void
  disabled?: boolean
  className?: string
}
```

**Modes:**
- ✅ `period`: Select preset periods (Last 7d, 30d, 90d, etc.)
- ✅ `date`: Select single date
- ✅ `range`: Select date range

**Import:** `import { DateFilterBar } from '@/components/date'`

**PREVIOUS DOC ERROR:**
- ❌ Documented with `selectedRange` (ISO strings), `defaultPreset`
- ✅ ACTUAL: Expects Date objects in callbacks, mode-based UI

**Verdict:** ✅ **APPROVED - USE WITH ACTUAL PROPS**

---

#### 7. PageHeader ✅

**File:** `src/components/utility/PageHeader.tsx` (NOT `@/components/layout`)

**Purpose:** Page title, description, breadcrumbs, and actions header

**ACTUAL Props:**
```typescript
interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string                    // Page title (REQUIRED)
  description?: string             // Subtitle description
  breadcrumbs?: React.ReactNode    // Breadcrumb navigation
  actions?: React.ReactNode        // Header actions (buttons, etc.)
  meta?: React.ReactNode           // Metadata line (right-aligned)
}
```

**Import Path:** ✅ `import { PageHeader } from '@/components/utility'`
❌ NOT from `@/components/layout` (as previously documented)

**States:** Single rendered state (no loading/error states)

**PREVIOUS DOC ERROR:**
- ❌ Import path listed as `@/components/layout`
- ✅ ACTUAL: Import from `@/components/utility`

**Verdict:** ✅ **APPROVED - USE FROM CORRECT IMPORT PATH**

---

#### 8. Card Components ✅

**File:** `src/components/ui/card.tsx`

**Purpose:** Layout containers and section dividers

**ACTUAL Exports (NOT compound syntax):**
```typescript
// Separate named exports:
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

// Usage:
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer here</CardFooter>
</Card>
```

**Styles:** All use UBITS tokens for spacing, borders, shadows

**PREVIOUS DOC ERROR:**
- ❌ Documented as compound syntax `Card.Header`, `Card.Content`
- ✅ ACTUAL: Separate named exports used as sibling components

**Verdict:** ✅ **APPROVED - USE SEPARATE NAMED EXPORTS**

---

#### 9. Alert ✅

**File:** `src/components/ui/alert.tsx`

**Purpose:** Display error, warning, info messages

**ACTUAL Components:**
```typescript
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

<Alert variant="default|destructive">
  <AlertTitle>Title</AlertTitle>
  <AlertDescription>Description</AlertDescription>
</Alert>
```

**Variants:** `default`, `destructive`

**Import:** `import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'`

**Verdict:** ✅ **APPROVED - USE AS-IS**

---

#### 10. Skeleton ✅

**File:** `src/components/ui/skeleton.tsx`

**Purpose:** Loading state placeholder

**ACTUAL Usage:**
```typescript
import { Skeleton } from '@/components/ui/skeleton'

<Skeleton className="h-12 w-12 rounded-full" />
```

**Import:** `import { Skeleton } from '@/components/ui/skeleton'`

**Verdict:** ✅ **APPROVED - USE AS-IS**

---

#### 11. Button ✅

**File:** `src/components/ui/button.tsx`

**Purpose:** Interactive button component

**Import:** `import { Button } from '@/components/ui/button'`

**Verdict:** ✅ **APPROVED - USE AS-IS**

---

#### 12. Badge ✅

**File:** `src/components/ui/badge.tsx`

**Purpose:** Tag/label component

**Import:** `import { Badge } from '@/components/ui/badge'`

**Verdict:** ✅ **APPROVED - USE AS-IS**

---

## Critical API Corrections Summary

| Component | Previous Doc | ACTUAL API | Status |
|-----------|--------------|-----------|--------|
| SurveyMetricCard | `label`, `previousValue`, `unit`, `icon` | `title`, `value`, `subtitle`, `delta`, `deltaLabel` | ⚠️ REVISED |
| FavorabilityDistributionCard | `promoters`, `passives`, `detractors` | `segments: ResponseSegment[]` | ⚠️ REVISED |
| DateFilterBar | `selectedRange` (ISO strings) | `range: { from?: Date; to?: Date }`, mode-based | ⚠️ REVISED |
| PageHeader | Import from `@/components/layout` | Import from `@/components/utility` | ⚠️ REVISED |
| Card | Compound syntax `Card.Header` | Separate exports: `CardHeader` | ⚠️ REVISED |
| ResponseStackedBarGroup | `data` prop | `items: ResponseStackedBarItem[]` | ⚠️ REVISED |
| TrendMetricLineChart | `data`, `metrics` | `series: TrendMetricSeries[]` | ⚠️ REVISED |

---

## Approval Verdict

✅ **All 12 components are production-ready**  
✅ **No component modifications needed**  
✅ **All 12 exist in codebase**  

⚠️ **Phase 8.4 BLOCKED until:**
1. Build prompt updated with actual prop names
2. Component map updated with actual data structures
3. Mock data map updated with actual DashboardData shape
4. Developer validated against actual APIs before building

---

**Next:** Execute Phase 8.3.1 Hotfix documentation updates

