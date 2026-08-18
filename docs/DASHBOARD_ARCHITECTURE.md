# Dashboard Architecture · Phase 8.0 Governance

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.0 (Governance & Architecture)

---

## Executive Summary

Dashboard architecture defines the structural patterns, composition rules, and governance framework for building dashboards WITHOUT constructing them yet. This document establishes a repeatable, type-safe, component-driven approach that ensures consistency across all future dashboard implementations.

**Key principle:** Dashboards are compositions of verified components + mock data + governance rules. No new components, no data APIs, no business logic — only assembly and patterns.

---

## Reference Documentation (Fase 8.2)

**New Pattern Documents (Created 2026-05-05):**
- **DASHBOARD_SHELL_PATTERNS.md** — Layout composition rules, structure requirements, responsive grid, theming, accessibility baseline
- **DASHBOARD_LAYOUT_RECIPES.md** — 7 reusable layout templates (KPI Row, Two-Column, Full-Width+Panel, Survey Analytics, Bento, Table+Filters, Gallery)
- **DASHBOARD_STATE_PATTERNS.md** — Loading, Loaded, Empty, Error, Partial, Filtered Empty states with implementation patterns
- **DASHBOARD_QA_RULES.md** — Comprehensive QA validation checklist (technical, design system, accessibility, responsive, data, performance)

All dashboard implementations must reference and comply with these pattern documents.

---

## Dashboard Composition Model

### Architecture Layers

```
Dashboard (Top)
├── DashboardShell (layout, responsive grid, theme)
├── SectionGroups (logical groupings, spacing)
│   ├── MetricSection (KPI cards, deltas, trends)
│   ├── DistributionSection (stacked bars, response analysis)
│   ├── TimeSeriesSection (line charts, sparklines)
│   └── SelectionSection (filters, date ranges, controls)
└── Components (from library, data via props)
    ├── Cards (SurveyMetricCard, KpiCard)
    ├── Charts (BarChart, LineChart, AreaChart)
    ├── Controls (DateFilterBar, SearchableSelect, MultiSelect)
    └── State Indicators (Skeleton, Empty states, Error states)
```

### Composition Rules (MANDATORY)

#### 1. No Component Creation
- Use **only** components from the library
- No dashboard-specific wrapper components
- No feature-specific one-off components
- No inline component definitions

#### 2. No Data Hardcoding
- All data flows via props
- Data comes from mock layer (`src/mocks/`)
- No API calls in components
- No fetch/axios in dashboard files

#### 3. Pure Props-Driven Design
```typescript
// ✅ CORRECT
<SurveyMetricCard 
  label="Satisfaction"
  value={75}
  previousValue={70}
  delta={+5}
  trend="up"
  segments={mockSegments}
/>

// ❌ WRONG
<SurveyMetricCard>
  {/* inline JSX */}
</SurveyMetricCard>

// ❌ WRONG
const data = await fetchSurveyData() // NO API calls
```

#### 4. Responsive Grid System
- Desktop-first (1200px baseline)
- Tablet breakpoint (768px)
- Mobile breakpoint (375px)
- Use consistent 12-column or 24-column grid
- No pixel-perfect layouts — grid-based only

#### 5. State Management Pattern
```typescript
// ✅ CORRECT: URL-based state for shareable dashboards
<Dashboard
  filters={{
    dateRange: [start, end],
    region: selectedRegion,
    segment: selectedSegment
  }}
  onFilterChange={(newFilters) => {
    // Update URL search params
    // Trigger re-fetch of mock data
  }}
/>
```

#### 6. Loading & Empty States
- Every section must support `loading` state
- Every section must support `empty` state
- Use Skeleton components from library
- Use EmptyState patterns (Gallery, Analytics)
- Never leave sections blank

---

## Dashboard Shell Pattern

### Standard Dashboard Structure

```typescript
// ✅ TEMPLATE: src/pages/DashboardTemplate.tsx
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { DateFilterBar } from '@/components/date/DateFilterBar'
import { SurveyMetricCard } from '@/components/survey-analytics/SurveyMetricCard'
import { BarChart } from '@/components/charts/BarChart'

export function DashboardTemplate({ dateRange, onDateChange }) {
  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Header with filters */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard Title</h1>
        <DateFilterBar 
          value={dateRange}
          onChange={onDateChange}
        />
      </div>

      {/* Metric Section */}
      <section className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI cards go here */}
      </section>

      {/* Distribution Section */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Stacked bars, analysis cards */}
      </section>

      {/* Timeseries Section */}
      <section className="grid gap-6 grid-cols-1">
        {/* Line charts, area charts */}
      </section>
    </div>
  )
}
```

### Mandatory Props Pattern

Every dashboard receives:
```typescript
interface DashboardProps {
  // Filter state (shareable via URL)
  filters: {
    dateRange: [Date, Date]
    segment?: string
    region?: string
  }
  onFilterChange: (filters: DashboardProps['filters']) => void
  
  // Data source (mock layer)
  data: DashboardData
  
  // Loading states
  isLoading: boolean
  error?: Error | null
}
```

---

## Component Usage Guidelines

### Metric Cards
```typescript
// ✅ USE: SurveyMetricCard for KPI + delta + comparison
<SurveyMetricCard
  label="Overall Satisfaction"
  value={75}
  previousValue={70}
  delta={+5}
  trend="up"
  segments={mockSegments}
/>

// ❌ DON'T: Create custom KPI card
```

### Charts
```typescript
// ✅ USE: Library presets (BarChart, LineChart, AreaChart)
<BarChart
  data={mockChartData}
  options={{
    xAxis: 'month',
    yAxis: 'responses',
    xAxisLabel: 'Month',
    yAxisLabel: 'Response Count'
  }}
/>

// ❌ DON'T: Use raw ECharts with custom config
```

### Distribution Analysis
```typescript
// ✅ USE: FavorabilityDistributionCard for response distribution
<FavorabilityDistributionCard
  title="Response Distribution"
  segments={mockSegments}
  showLegend={true}
/>

// ❌ DON'T: Build custom stacked bar layout
```

### Controls & Filters
```typescript
// ✅ USE: DateFilterBar, MultiSelect, SearchableSelect
<DateFilterBar 
  value={dateRange}
  onChange={onDateChange}
/>

// ❌ DON'T: Create dashboard-specific filter components
```

---

## Layout Grid System

### 12-Column Grid (Recommended)
```css
/* Tailwind grid-cols-* classes */
grid-cols-1           /* Mobile */
sm:grid-cols-2        /* Tablet */
lg:grid-cols-3        /* Desktop (3 wide) */
lg:grid-cols-4        /* Desktop (4 wide) */
```

### Common Patterns

**Full width (1 column):**
```html
<div class="grid gap-6 grid-cols-1">
  <!-- Charts, analysis sections -->
</div>
```

**2-up layout:**
```html
<div class="grid gap-6 grid-cols-1 lg:grid-cols-2">
  <!-- Side-by-side cards, charts -->
</div>
```

**4 KPI cards:**
```html
<div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  <!-- KPI cards (auto-wraps on smaller screens) -->
</div>
```

**Bento-style (uneven):**
```html
<div class="grid gap-6 grid-cols-2 lg:grid-cols-4 auto-rows-min">
  <div class="lg:col-span-2"><!-- Large section --></div>
  <div><!-- Small card --></div>
  <div><!-- Small card --></div>
</div>
```

---

## Data Flow Pattern

### Props → Mock Layer → Component

```
Dashboard receives filters
       ↓
Query mock layer with filters
       ↓
Mock layer returns typed data
       ↓
Pass data to components via props
       ↓
Components render using library design system
```

### Example Flow

```typescript
// In dashboard file
const dashboardData = getMockDashboardData({
  dateRange: filters.dateRange,
  segment: filters.segment,
  region: filters.region
})

return (
  <div className="space-y-6">
    <MetricSection 
      metrics={dashboardData.metrics}
      isLoading={isLoadingMocks}
    />
    <DistributionSection 
      segments={dashboardData.distribution}
      isLoading={isLoadingMocks}
    />
  </div>
)
```

---

## State & Interactivity Rules

### Filter State (URL-Based)
```typescript
// ✅ Use URL search params for filters
// /dashboards/survey?from=2026-01-01&to=2026-05-05&segment=nps

// Update filters → Update URL → Re-query mock data
const handleFilterChange = (newFilters) => {
  const params = new URLSearchParams(window.location.search)
  params.set('from', newFilters.dateRange[0].toISOString())
  params.set('to', newFilters.dateRange[1].toISOString())
  window.history.replaceState({}, '', `?${params.toString()}`)
  // Re-fetch mock data
}
```

### Loading States (Component Level)
```typescript
// Every metric, chart, or section shows skeleton while loading
{isLoading ? (
  <Skeleton className="h-32 rounded-lg" />
) : (
  <SurveyMetricCard {...props} />
)}
```

### Error States (User Feedback)
```typescript
// Show readable error without breaking layout
{error ? (
  <Alert variant="destructive">
    <AlertTitle>Failed to load data</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
) : (
  <MetricCard {...props} />
)}
```

---

## Theme & Styling Rules

### Design Tokens ONLY
```typescript
// ✅ Use UBITS design tokens
className="bg-card border border-border text-foreground"
className="text-primary hover:text-primary-foreground"
className="bg-destructive text-destructive-foreground"

// ❌ No hardcoded colors
className="bg-#f0f0f0 text-#333333"

// ❌ No decorative effects
className="backdrop-blur-md" // NO
className="bg-gradient-to-r" // NO
```

### Dark Mode
- All dashboards must support both light and dark modes
- Use UBITS tokens which auto-adjust
- No light-mode-only styling
- Test both themes before shipping

### Responsive Design
- Desktop-first approach
- Test at: 1440px, 1024px, 768px, 375px
- Never hardcode widths — use grid
- Touch-friendly targets (minimum 44px for interactive elements)

---

## Governance Checklist for Dashboard Build

Before building any dashboard, verify:

- [ ] **Architecture**
  - [ ] Uses DashboardShell pattern
  - [ ] Props-driven data flow
  - [ ] URL-based filter state
  - [ ] Loading + error states defined

- [ ] **Components**
  - [ ] Only library components used
  - [ ] No new components created
  - [ ] No component modification
  - [ ] All required props passed

- [ ] **Data**
  - [ ] No hardcoded data in JSX
  - [ ] All data from mock layer
  - [ ] No API calls in dashboard file
  - [ ] Mock data types match component expects

- [ ] **Layout**
  - [ ] Grid-based (no pixels)
  - [ ] Responsive breakpoints tested
  - [ ] Mobile wrapping verified
  - [ ] Spacing uses Tailwind gap utilities

- [ ] **Styling**
  - [ ] UBITS tokens only
  - [ ] No hardcoded colors
  - [ ] No decorative effects
  - [ ] Dark mode verified

- [ ] **Accessibility**
  - [ ] Keyboard navigation works
  - [ ] ARIA labels present
  - [ ] Focus states visible
  - [ ] Color contrast sufficient

- [ ] **Documentation**
  - [ ] Intake doc filled out
  - [ ] Component list extracted
  - [ ] Mock data structure defined
  - [ ] Success criteria documented

---

## Examples (Non-Functional, Pattern Only)

### Survey Sentiment Dashboard
```
Header: "Survey Sentiment Trends"
↓
Filters: Date Range, Segment, Region
↓
KPI Section: Overall Score, Participation Rate, Response Rate (4 cards)
↓
Distribution Section: NPS Distribution, Satisfaction Spread (2 charts)
↓
Trends Section: Monthly Sentiment Trend (1 large line chart)
↓
Bottom: Legend, Comparison Footer
```

### Product Feedback Dashboard
```
Header: "Product Feedback Analysis"
↓
Filters: Date Range, Feature Filter
↓
KPI Section: Total Feedback Count, Top Issue, Resolution Rate (3 cards)
↓
Response Distribution: Feedback Type Breakdown (stacked bar)
↓
Timeline: Feedback Volume Trend (area chart)
↓
Top Features: Most mentioned (bar chart)
```

---

## Next Phase

**Phase 8.1:** Mock Data Layer Architecture  
- Design `src/mocks/` folder structure
- Define mock data generators by entity
- Create transformation patterns
- Establish separation of concerns

**Phase 8.2:** Dashboard Shell Patterns (Design Only)
- Create reusable dashboard layout components
- Design filter bar patterns
- Document composition templates
- Establish spacing/rhythm system

**Phase 8.3:** First Dashboard Prototype (Design Phase)
- Select first real dashboard for build
- Define intake process
- Map components to mockups
- Document success criteria

**Phase 8.4:** First Dashboard Build
- Implement using governance patterns
- Use mock data layer
- Execute QA validation
- Document lessons learned

---

**Status:** ✅ GOVERNANCE DEFINED  
**Type:** Architecture  
**Blocking:** Dashboard builds (until Phase 8.1+ complete)

Generated: 2026-05-05
