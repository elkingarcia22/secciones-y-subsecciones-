# Mock Data Strategy · Phase 8.0 Governance

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.0 (Governance & Architecture)

---

## Executive Summary

Mock data strategy establishes the organizational patterns, data separation principles, and generation patterns for the `src/mocks/` folder. This ensures that component layer and data layer remain independent, testable, and maintainable — crucial for a design system where components ship before business logic is built.

**Core principle:** Mocks are the contract between design system (components) and product (features). Until real APIs exist, mocks act as both documentation and a safe place to test component behavior.

---

## Folder Structure

```
src/mocks/
├── index.ts                          # Central export (barrel)
├── generators/                       # Data generator functions
│   ├── surveyGenerators.ts
│   ├── chartGenerators.ts
│   ├── userGenerators.ts
│   └── entityGenerators.ts
├── transformers/                     # Data transformation utilities
│   ├── surveyTransformers.ts
│   ├── chartTransformers.ts
│   └── filterAppliers.ts
├── fixtures/                         # Static test data (optional)
│   ├── surveys.json
│   ├── users.json
│   └── responses.json
├── types.ts                          # Mock data type definitions
├── seed.ts                           # Seed/reset function
└── README.md                         # This folder's purpose
```

### Size Limits
- Single generator file: 200-300 lines max
- Single transformer file: 150-200 lines max
- Mock types file: 100-150 lines max
- If exceeding: split into multiple files by domain

---

## Type Safety Pattern

### Mock Data Types (src/mocks/types.ts)

```typescript
// Keep types aligned with component expects, not API contracts

interface SurveyMetricMockData {
  label: string
  value: number
  previousValue?: number
  delta?: number
  trend?: 'up' | 'down' | 'neutral'
  segments: SurveyResponseSegment[]
}

interface SurveyResponseSegment {
  id: string
  label: string
  value: number
  tone: 'positive' | 'negative' | 'warning' | 'info' | 'neutral'
}

interface ChartDataPoint {
  x: string | number
  y: number
  label?: string
}

interface TimeSeriesData {
  points: ChartDataPoint[]
  xAxisLabel: string
  yAxisLabel: string
}
```

**Important:** These types live in `src/mocks/types.ts`, NOT in component-specific files. They're shared contracts.

---

## Generator Functions Pattern

### Principle: Factories, Not Fixtures

Generate data dynamically instead of hardcoding static datasets. This allows:
- Easy parameterization (date ranges, counts, segments)
- Reproducible variation (different test scenarios)
- Separation of data generation logic from component logic

### Survey Data Generator

```typescript
// src/mocks/generators/surveyGenerators.ts

import type { SurveyMetricMockData, SurveyResponseSegment } from '../types'

/**
 * Generate a metric card payload
 */
export function generateMetric(overrides?: Partial<SurveyMetricMockData>): SurveyMetricMockData {
  return {
    label: 'Overall Satisfaction',
    value: 75,
    previousValue: 70,
    delta: 5,
    trend: 'up',
    segments: generateSegments(4),
    ...overrides,
  }
}

/**
 * Generate response distribution segments
 */
export function generateSegments(count: number): SurveyResponseSegment[] {
  const tones = ['positive', 'negative', 'warning', 'info'] as const
  const total = 100
  const perSegment = Math.floor(total / count)

  return Array.from({ length: count }, (_, i) => ({
    id: `segment-${i}`,
    label: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'][i] || `Segment ${i}`,
    value: i === count - 1 ? total - perSegment * (count - 1) : perSegment,
    tone: tones[i % tones.length],
  }))
}

/**
 * Generate multiple metrics for a dashboard section
 */
export function generateMetricsForSection(count: number): SurveyMetricMockData[] {
  return Array.from({ length: count }, (_, i) =>
    generateMetric({
      label: ['Overall Score', 'Participation', 'Response Rate', 'Recommendation'][i],
      value: Math.floor(Math.random() * 30 + 60), // 60-90 range
    })
  )
}
```

### Chart Data Generator

```typescript
// src/mocks/generators/chartGenerators.ts

import type { TimeSeriesData, ChartDataPoint } from '../types'

/**
 * Generate time series data for trend charts
 */
export function generateTimeSeriesData(
  monthCount: number = 12,
  overrides?: Partial<TimeSeriesData>
): TimeSeriesData {
  const points: ChartDataPoint[] = Array.from({ length: monthCount }, (_, i) => {
    const month = new Date(2025, 0, 1)
    month.setMonth(month.getMonth() + i)
    
    return {
      x: month.toLocaleString('default', { month: 'short' }),
      y: Math.floor(Math.random() * 40 + 50), // 50-90 range
      label: month.toLocaleDateString(),
    }
  })

  return {
    points,
    xAxisLabel: 'Month',
    yAxisLabel: 'Score',
    ...overrides,
  }
}

/**
 * Generate bar chart data
 */
export function generateBarChartData(
  categories: string[] = ['Q1', 'Q2', 'Q3', 'Q4']
): ChartDataPoint[] {
  return categories.map((cat, i) => ({
    x: cat,
    y: Math.floor(Math.random() * 30 + 50),
  }))
}
```

---

## Transformer Functions Pattern

### Filter Application

Transformers apply filters/parameters to mock data without mutating the generator. This allows the mock layer to behave like a real API.

```typescript
// src/mocks/transformers/filterAppliers.ts

import type { SurveyMetricMockData } from '../types'

interface FilterCriteria {
  dateRange?: [Date, Date]
  segment?: string
  region?: string
  limit?: number
}

/**
 * Apply filters to mock data
 * (Simulates what a real API would do)
 */
export function applyFiltersToMetrics(
  metrics: SurveyMetricMockData[],
  filters: FilterCriteria
): SurveyMetricMockData[] {
  let result = [...metrics]

  // Simulate date-based variation
  if (filters.dateRange) {
    const [start, end] = filters.dateRange
    const daysElapsed = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    // Vary values slightly based on date range
    result = result.map(m => ({
      ...m,
      value: Math.max(0, Math.min(100, m.value + (daysElapsed % 10) - 5)),
    }))
  }

  // Simulate segment-based filtering
  if (filters.segment) {
    result = result.map(m => ({
      ...m,
      segments: m.segments.filter(s => s.id === filters.segment || !filters.segment),
    }))
  }

  // Apply limit
  if (filters.limit) {
    result = result.slice(0, filters.limit)
  }

  return result
}

/**
 * Transform API response shape (for when real API arrives)
 */
export function transformApiMetrics(apiResponse: unknown): SurveyMetricMockData {
  // Future: Map real API response to component-expected shape
  // This transformer becomes the adapter when API is ready
  return apiResponse as SurveyMetricMockData
}
```

---

## Data Separation Principles

### Level 1: Generators (src/mocks/generators/)
- **Purpose:** Create realistic test data
- **Who calls:** Transformers, integration tests
- **No knowledge of:** Filters, real API structure
- **Responsibility:** Data creation only

### Level 2: Transformers (src/mocks/transformers/)
- **Purpose:** Apply filters, simulate API behavior
- **Who calls:** Query functions, dashboard files
- **No knowledge of:** Component-specific details
- **Responsibility:** Filtering, parameterization, response shaping

### Level 3: Query Functions (src/mocks/index.ts)
- **Purpose:** Unified API-like interface for dashboards
- **Who calls:** Dashboard pages, integration tests
- **Public contract:** What dashboards depend on
- **Responsibility:** Compose generators + transformers into dashboard-ready data

### Level 4: Component Layer (src/components/)
- **Purpose:** Render data
- **Who calls:** Dashboard pages only
- **Data source:** Props only (from Level 3)
- **Responsibility:** Presentation only

---

## Central Export Pattern (src/mocks/index.ts)

```typescript
// src/mocks/index.ts

import { generateMetric, generateSegments, generateMetricsForSection } from './generators/surveyGenerators'
import { generateTimeSeriesData, generateBarChartData } from './generators/chartGenerators'
import { applyFiltersToMetrics } from './transformers/filterAppliers'
import type { FilterCriteria } from './transformers/filterAppliers'

/**
 * Dashboard-level query function
 * Acts like an API endpoint: takes filters, returns dashboard data
 */
export function getMockSurveyDashboardData(filters?: FilterCriteria) {
  // Generate base data
  const metrics = generateMetricsForSection(4)
  const timeSeries = generateTimeSeriesData(12)
  const distribution = generateSegments(5)

  // Apply filters (simulate API behavior)
  const filteredMetrics = applyFiltersToMetrics(metrics, filters || {})

  // Compose into dashboard-ready object
  return {
    metrics: filteredMetrics,
    timeSeries,
    distribution,
    timestamp: new Date(),
  }
}

/**
 * Individual section query (for lazy loading)
 */
export function getMockResponseDistribution(filters?: FilterCriteria) {
  const base = generateSegments(5)
  return applyFiltersToMetrics([{ segments: base } as any], filters || {})
}

// Export generators for tests
export { generateMetric, generateTimeSeriesData, generateBarChartData }

// Export types for component expectations
export type { SurveyMetricMockData, SurveyResponseSegment } from './types'
```

---

## Usage Pattern in Dashboards

### Before (Wrong)
```typescript
// ❌ DON'T: Hardcoded data in component
export function SurveyDashboard() {
  return (
    <div>
      <MetricCard value={75} />
      <BarChart data={[{ x: 'Q1', y: 50 }]} />
    </div>
  )
}
```

### After (Correct)
```typescript
// ✅ DO: Use mock layer
import { getMockSurveyDashboardData } from '@/mocks'

export function SurveyDashboard({ filters }) {
  const data = getMockSurveyDashboardData(filters)

  return (
    <div>
      {data.metrics.map(m => <MetricCard {...m} key={m.label} />)}
      <BarChart data={data.timeSeries} />
    </div>
  )
}
```

---

## Testing Pattern

### Unit Tests (Generator Level)
```typescript
describe('surveyGenerators', () => {
  test('generateMetric returns valid shape', () => {
    const metric = generateMetric()
    expect(metric.value).toBeGreaterThanOrEqual(0)
    expect(metric.label).toBeDefined()
  })

  test('generateSegments creates correct count', () => {
    const segments = generateSegments(5)
    expect(segments).toHaveLength(5)
  })
})
```

### Integration Tests (Dashboard Level)
```typescript
describe('SurveyDashboard', () => {
  test('renders with mock data', () => {
    const data = getMockSurveyDashboardData({ limit: 2 })
    render(<SurveyDashboard filters={{}} />)
    expect(screen.getByText(data.metrics[0].label)).toBeInTheDocument()
  })
})
```

---

## Phase 8.1 Tasks (Detailed)

### Task 8.1.1: Create Folder Structure
```bash
mkdir -p src/mocks/{generators,transformers,fixtures}
```

### Task 8.1.2: Define Mock Types
- Create `src/mocks/types.ts`
- Align with component prop types
- Export for use in dashboards

### Task 8.1.3: Implement Generators
- Survey data (metrics, segments, distributions)
- Chart data (time series, bar, donut, heatmap)
- User/entity data (avatars, names)

### Task 8.1.4: Implement Transformers
- Filter applier (date range, segment, pagination)
- Response shaper (adapt generator output)
- Error simulators (for loading/error states)

### Task 8.1.5: Create Central Export
- Dashboard query functions (getMockDashboard, getMockSection)
- Generator exports (for tests)
- Type exports

### Task 8.1.6: Documentation
- README explaining folder purpose
- Stale data warning (mock data vs real API)
- How to add new generators

---

## Migration Strategy (When Real API Arrives)

### Step 1: Wrap API Layer
```typescript
// src/services/api.ts (NEW)
export async function fetchSurveyData(filters: FilterCriteria) {
  const response = await fetch(`/api/surveys`, { /* filters */ })
  return response.json()
}
```

### Step 2: Create Adapter
```typescript
// src/mocks/transformers/apiAdapter.ts (NEW)
export function adaptApiToMockShape(apiResponse: ApiSurveyData) {
  // Transform real API shape to component-expected shape
  return {
    metrics: apiResponse.kpis.map(kpi => ({
      label: kpi.name,
      value: kpi.current,
      previousValue: kpi.previous,
      // ...
    })),
  }
}
```

### Step 3: Switch Query Function
```typescript
// src/mocks/index.ts (MODIFIED)
export async function getMockSurveyDashboardData(filters: FilterCriteria) {
  if (process.env.REACT_APP_USE_REAL_API) {
    // Real API
    const response = await fetchSurveyData(filters)
    return adaptApiToMockShape(response)
  } else {
    // Mock data (current)
    return getMockSurveyDashboardDataMocked(filters)
  }
}
```

### Result
No dashboard files need to change. Mock layer acts as adapter.

---

## Data Freshness & Cache Strategy

### Mock Data is Always Stale
- Document that mocks are fixtures for component testing
- Never use mocks as source of truth for feature behavior
- Always upgrade to real API endpoints for production features

### Cache Invalidation (When Real API)
```typescript
// Eventually (Phase 8.4+)
const queryClient = new QueryClient()

export async function getMockSurveyDashboardData(filters: FilterCriteria) {
  return queryClient.fetchQuery({
    queryKey: ['survey', filters],
    queryFn: () => fetchSurveyData(filters),
  })
}
```

---

## Checklist: Mock Layer Complete

- [ ] `src/mocks/` folder created
- [ ] `src/mocks/types.ts` with component-aligned types
- [ ] Survey generators (metrics, segments, distributions)
- [ ] Chart generators (time series, bars, distributions)
- [ ] Filter transformer (date range, segment, limit)
- [ ] Central export (`index.ts`) with dashboard queries
- [ ] README explaining folder purpose
- [ ] Zero hardcoded data in component files
- [ ] All mock data imported from `src/mocks/`
- [ ] TypeScript strict mode on all mock files

---

**Status:** ✅ STRATEGY DEFINED  
**Type:** Architecture  
**Implementation:** Phase 8.1  
**Blocking:** Dashboard builds (until mocks created)

Generated: 2026-05-05
