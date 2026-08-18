# Dashboard Layout Recipes · Fase 8.2

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.2 (Dashboard Shell Patterns)  
**Type:** Design Patterns & Recipes

---

## Executive Summary

Layout recipes are reusable composition patterns for arranging library components into dashboards. Each recipe specifies when to use it, which components fit, how mock data flows, required states, and common risks.

**Purpose:** Accelerate dashboard builds by providing proven layout patterns instead of starting from scratch each time.

---

## Recipe 1: KPI Row (4 Cards)

### What It Is
Four key performance indicator cards displayed in a single row, auto-wrapping on smaller screens.

### When to Use
- Overview dashboards (survey sentiment, product usage, customer satisfaction)
- Metric-focused views (metrics first, analysis secondary)
- Executive dashboards (high-level summary)
- Any dashboard needing 3-5 KPIs

### Components Allowed
- **`SurveyMetricCard`** (primary, with delta + trend)
- **`KpiCard`** (alternative, simpler variant)
- Arranged in responsive grid

### Grid Layout
```
Desktop (1440px):  [Card] [Card] [Card] [Card]   (4 columns)
Tablet (768px):    [Card] [Card]                 (2 columns)
                   [Card] [Card]
Mobile (375px):    [Card]                        (1 column)
                   [Card]
                   [Card]
                   [Card]
```

### Mock Data Expected
```typescript
interface MetricData {
  id: string
  label: string
  value: number                   // Current value (75)
  previousValue: number           // Previous value (70)
  delta: number                   // Change amount (5)
  deltaPercentage: number         // Change percent (7.14%)
  trend: 'up' | 'down' | 'neutral'
  unit?: string                   // Optional (%,points, etc.)
  segments?: ResponseSegment[]    // Optional distribution breakdown
}
```

### States Required
- **Loading:** 4 Skeleton cards (h-24 min-height)
- **Loaded:** 4 SurveyMetricCards with data
- **Empty:** EmptyState message (rare for KPIs)
- **Error:** Alert with message

### CSS Classes
```
Container:  grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
Spacing:    24px gap between cards
Height:     min-h-24 (cards equal height)
Padding:    p-6 inside container
```

### QA Checklist
- [ ] 4 cards display at desktop
- [ ] 2x2 grid at tablet
- [ ] 1 column at mobile
- [ ] Cards equal height
- [ ] Gap between cards is 24px (gap-6)
- [ ] All cards from library
- [ ] Data from mock layer
- [ ] Loading state shows 4 skeletons
- [ ] Responsive tested at 375, 768, 1440px
- [ ] Dark mode verified

### Common Risks
❌ **Risk 1:** Hardcoding metric values  
✅ **Fix:** Always use `getMockSurveyDashboardData()` from mock layer

❌ **Risk 2:** Creating custom card component  
✅ **Fix:** Use `SurveyMetricCard` from library as-is

❌ **Risk 3:** Unequal card heights  
✅ **Fix:** Use `min-h-24` or `auto-rows-fr` in grid

❌ **Risk 4:** Wrong gap size  
✅ **Fix:** Use `gap-6` (24px) consistently

### What NOT to Do
- ❌ Don't add 5 or more cards to this recipe (use bento instead)
- ❌ Don't customize card appearance
- ❌ Don't mix card types (use same component)
- ❌ Don't hardcode data inline
- ❌ Don't use pixel-based widths
- ❌ Don't remove delta/trend indicators

---

## Recipe 2: Two-Column Analytics Layout

### What It Is
Two sections side-by-side: a chart/visualization on the left (60%) and an analysis card/details on the right (40%).

### When to Use
- Distribution analysis (segment breakdown + details)
- Comparison dashboards (two charts comparing periods)
- Feature adoption (usage trend + adoption metrics)
- Response analysis (distribution breakdown + insights)

### Components Allowed
- **Left (60%):**
  - `BarChart`, `LineChart`, `AreaChart`, `DonutChart`
  - `ResponseStackedBar` (recommended for distribution)
  - Full-width chart

- **Right (40%):**
  - `SurveyMetricCard` (multiple stacked)
  - `Card` with analysis text
  - Small metric display

### Grid Layout
```
Desktop (1440px):
┌──────────────────────┬──────────────┐
│   Left Chart         │   Right      │
│   (60% width)        │   Cards      │
│                      │   (40%)      │
└──────────────────────┴──────────────┘

Tablet (768px):
┌──────────────────┐
│  Chart (100%)    │
├──────────────────┤
│  Cards (100%)    │
└──────────────────┘

Mobile (375px):
┌──────────┐
│ Chart    │
├──────────┤
│ Cards    │
└──────────┘
```

### Mock Data Expected
```typescript
// Left (Chart)
interface TimeSeriesData {
  data: ChartDataPoint[]
  label: string
  unit?: string
  color?: string
}

// Right (Metrics/Analysis)
interface ResponseSegment {
  id: string
  label: string
  value: number
  percentage: number
  color: string
  semanticTone?: 'positive' | 'neutral' | 'negative'
}
```

### States Required
- **Loading:** 
  - Left: Skeleton (h-64 for chart)
  - Right: 2-3 Skeleton cards
- **Loaded:** Chart + detail cards with data
- **Empty:** "No data available" message
- **Error:** Alert with message

### CSS Classes
```
Container:  grid gap-6 grid-cols-1 lg:grid-cols-3
Left:       col-span-1 lg:col-span-2 (66% width)
Right:      col-span-1 (33% width)
Right cards: space-y-4 (stack vertically)
```

### QA Checklist
- [ ] Left section takes 60% width on desktop
- [ ] Right section takes 40% width on desktop
- [ ] Stacks on tablet and mobile
- [ ] Gap between is 24px (gap-6)
- [ ] Chart height is 300-400px
- [ ] Right cards have equal height or minimal height
- [ ] Loading state shows chart skeleton + card skeletons
- [ ] Responsive tested at 375, 768, 1440px
- [ ] Dark mode verified

### Common Risks
❌ **Risk 1:** Unbalanced column widths  
✅ **Fix:** Use `col-span-2` / `col-span-1` for 66/33 split

❌ **Risk 2:** Chart too large or too small  
✅ **Fix:** Set explicit height (300-400px) or let container decide

❌ **Risk 3:** Right cards don't align vertically  
✅ **Fix:** Use `space-y-4` wrapper around cards

❌ **Risk 4:** Chart legends overlap content on mobile  
✅ **Fix:** Move legend below chart (responsive property)

### What NOT to Do
- ❌ Don't use pixel-based widths
- ❌ Don't put multiple charts in left (use single chart)
- ❌ Don't stack right cards if they should be side-by-side
- ❌ Don't forget loading state for both sides
- ❌ Don't hardcode chart data

---

## Recipe 3: Full-Width Chart + Side Panel

### What It Is
A single full-width chart spanning top of section, with a narrow side panel on the right for legend, filters, or metadata.

### When to Use
- Trend analysis (timeline is primary focus)
- Performance monitoring (metric behavior over time)
- User engagement (activity trends)
- Inventory/resource tracking

### Components Allowed
- **Top/Left (main):** `LineChart`, `AreaChart`
- **Right Panel:** Legend, metadata cards, or small metrics
- Panel width: 240-280px

### Grid Layout
```
Desktop (1440px):
┌──────────────────────────────────┬───────┐
│         Main Chart               │Legend │
│     (Full width minus panel)      │  &    │
│                                  │Details│
│                                  │       │
└──────────────────────────────────┴───────┘

Tablet (768px):
┌──────────────────────┐
│   Chart (100%)       │
├──────────────────────┤
│  Legend/Details      │
└──────────────────────┘

Mobile (375px):
┌──────────────┐
│ Chart        │
├──────────────┤
│ Legend       │
└──────────────┘
```

### Mock Data Expected
```typescript
interface TimeSeriesData {
  id: string
  label: string
  data: ChartDataPoint[]
  unit?: string
  color?: string
  comparison?: {
    label: string
    data: ChartDataPoint[]
  }
}
```

### States Required
- **Loading:** Skeleton chart (h-80) + skeleton legend
- **Loaded:** Chart + legend with data
- **Empty:** Message ("No trend data")
- **Error:** Alert with message

### CSS Classes
```
Container:  flex gap-6
Chart area: flex-1 (grow to fill)
Panel:      w-64 (fixed width)
Responsive: On mobile, stack vertically (flex-col)
```

### QA Checklist
- [ ] Chart occupies left side on desktop
- [ ] Panel occupies right side (fixed width ~280px)
- [ ] Stacks on mobile
- [ ] Chart height is 400px minimum
- [ ] Legend is clear and readable
- [ ] Loading state shows both chart and legend
- [ ] Responsive tested at 375, 768, 1440px
- [ ] Dark mode verified

### Common Risks
❌ **Risk 1:** Chart shrinks too small on desktop  
✅ **Fix:** Use `flex-1` on chart container

❌ **Risk 2:** Panel width varies on different screens  
✅ **Fix:** Fix panel width with `w-64` on desktop, remove on mobile

❌ **Risk 3:** Legend overlaps chart on smaller screens  
✅ **Fix:** Stack with `flex-col` on `md:` breakpoint

### What NOT to Do
- ❌ Don't put multiple charts in main area
- ❌ Don't make panel wider than 300px
- ❌ Don't hardcode chart data
- ❌ Don't use pixel-based chart sizing

---

## Recipe 4: Survey Analytics Dashboard Layout

### What It Is
A specialized layout for survey/feedback analysis combining sentiment metrics, response distribution, and trend analysis.

### When to Use
- Survey dashboards (NPS, CSAT, satisfaction)
- Feedback analysis (product feedback, user sentiment)
- Response analytics (survey participation, completion rates)
- Sentiment tracking (emotion distribution)

### Structure (Full Dashboard)
```
┌────────────────────────────────────┐
│ Survey Title                        │ (Header)
│ Breadcrumb                          │
├────────────────────────────────────┤
│ [Date Range] [Segment] [Apply]     │ (Filter)
├────────────────────────────────────┤
│ KPI Row: [NPS] [CSAT] [Participation] [Response Rate] │ (4 cards)
├────────────────────────────────────┤
│ Sentiment Dist.     │ Details       │ (2-column)
│ [Stacked Bar]      │ [Segment List]│
├────────────────────────────────────┤
│ Sentiment Trend (6-12 months)      │ (Full-width trend)
│ [Line Chart]                       │
├────────────────────────────────────┤
│ Optional: Related Metrics           │ (Secondary row)
└────────────────────────────────────┘
```

### Components Allowed
- **KPI Row:** 3-4 `SurveyMetricCard`
- **Distribution:** `ResponseStackedBar` + detail cards
- **Trend:** `LineChart` or `AreaChart`
- **Controls:** `DateFilterBar`, `MultiSelect`

### Mock Data Expected
```typescript
interface DashboardData {
  metrics: MetricData[]              // 3-4 KPIs
  distribution: {
    segments: ResponseSegment[]       // 3-5 segments
    total: number
    label: string
  }
  timeSeries: TimeSeriesData[]        // 6-12 months
  metadata: {
    lastUpdated: Date
    source: 'mock' | 'api'
  }
}
```

### States Required
- **Loading:** Skeleton for each section (cards, chart, trend)
- **Loaded:** All sections with data
- **Empty:** "No survey responses yet" message
- **Partial:** Some sections loaded, others loading
- **Filtered:** Data filtered by date/segment

### CSS Classes
```
Page:        max-w-7xl mx-auto px-6 space-y-8
KPI Row:     grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
Distribution: grid gap-6 grid-cols-1 lg:grid-cols-3
Timeline:    grid gap-6 grid-cols-1
```

### QA Checklist
- [ ] All 5 sections present and in order
- [ ] KPI cards display as 4-column on desktop
- [ ] Distribution section is 2-column on desktop
- [ ] Timeline is full-width
- [ ] Each section has loading state
- [ ] Filters update URL and re-fetch data
- [ ] Dark mode verified
- [ ] Responsive at 375, 768, 1440px
- [ ] All data from mock layer

### Common Risks
❌ **Risk 1:** Trend chart is too tall (visually imbalanced)  
✅ **Fix:** Set max-height (400px) for charts

❌ **Risk 2:** Distribution chart overlaps right panel on medium screens  
✅ **Fix:** Use responsive grid (1 col on md, 2-3 cols on lg)

❌ **Risk 3:** Loading state doesn't show all sections  
✅ **Fix:** Show skeleton for each section independently

### What NOT to Do
- ❌ Don't skip filter bar
- ❌ Don't use fewer than 3 KPI cards
- ❌ Don't remove distribution section
- ❌ Don't hardcode survey-specific text
- ❌ Don't add custom components

---

## Recipe 5: Bento Layout (Controlled)

### What It Is
Uneven grid layout with various card sizes (some cards span 2 rows or 2 columns) arranged in a visually interesting pattern while maintaining alignment.

### When to Use
- Rich dashboard with mixed content (metrics, charts, images)
- Product overview (usage, feedback, engagement, adoption)
- Marketing dashboards (campaigns, traffic, conversions)
- Only after Phase 8.4 (proven dashboard patterns)

### Components Allowed
- Mix of: `SurveyMetricCard`, charts, image grids, text cards
- Flexible sizing (some 1x1, some 2x1, some 1x2)
- Max 6-8 items per dashboard

### Grid Layout (Example)
```
Desktop (1440px):
┌───────┬───────┬───────┬───────┐
│ M1    │ M2    │ C1 (spans 2 rows) │
├───────┼───────┼───────┤       │
│ M3    │ M4    │ C1    │
├───────┴───────┼───────┤
│   C2 (spans 2 cols)   │
└───────────────┴───────┘

With:
- M1-M4: 1x1 metric cards
- C1: 1x2 chart
- C2: 2x1 chart
```

### States Required
- **Loading:** Skeleton for each item (variable heights)
- **Loaded:** All items with content
- **Empty:** Message or empty states for individual items

### CSS Classes
```
Container:     grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-fr
Regular item:  col-span-1
Tall item:     col-span-1 row-span-2
Wide item:     col-span-1 md:col-span-2
Tall+wide:     col-span-1 md:col-span-2 row-span-2
```

### QA Checklist
- [ ] Layout is intentional (not random)
- [ ] No orphaned items (shouldn't look broken)
- [ ] Responsive: breaks to single column on mobile
- [ ] All heights balanced or intentionally unbalanced
- [ ] Spacing consistent (gap-6)
- [ ] Loading shows all items with variable heights

### Common Risks
❌ **Risk 1:** Layout breaks at medium screen sizes  
✅ **Fix:** Test at all breakpoints, adjust spans

❌ **Risk 2:** Layout looks random/chaotic  
✅ **Fix:** Plan layout on paper first, follow grid alignment

❌ **Risk 3:** Items don't fill grid evenly  
✅ **Fix:** Use `auto-rows-fr` to balance heights

### What NOT to Do
- ❌ Don't use bento for Phase 8.2 (too early)
- ❌ Don't add more than 8 items
- ❌ Don't mix too many component types
- ❌ Don't create random asymmetry (make it intentional)
- ❌ Don't ignore mobile layout

---

## Recipe 6: Table + Filters Layout

### What It Is
A data table with headers, rows, and pagination, combined with filter controls above.

### When to Use
- Response lists (individual survey responses)
- Issue tracking (bug list, feedback items)
- User management (admin dashboards)
- Transaction logs (activity history)

### Components Allowed
- **Filter area:** `DateFilterBar`, `SearchableSelect`, `Input`
- **Table:** Rows with columns, sortable headers
- **Pagination:** Previous/Next buttons, page indicator

### Grid Layout
```
┌──────────────────────────────────┐
│ [Filter] [Search] [Sort] [Export]│
├──────────────────────────────────┤
│ ID  │ Name │ Date │ Status │     │
├─────┼──────┼──────┼────────┤     │
│ 001 │ ...  │ ...  │ ...    │     │
│ 002 │ ...  │ ...  │ ...    │     │
│ 003 │ ...  │ ...  │ ...    │     │
├──────────────────────────────────┤
│ Showing 1-10 of 156 │ < 1 2 3 > │
└──────────────────────────────────┘
```

### Mock Data Expected
```typescript
interface TableData {
  rows: TableRow[]
  total: number
  columns: ColumnDefinition[]
  filters: FilterCriteria
}
```

### States Required
- **Loading:** Skeleton rows (5-10)
- **Loaded:** All rows with data
- **Empty:** "No results" message
- **Filtered:** Reduced row count with filter applied

### CSS Classes
```
Container:  max-w-7xl mx-auto px-6 space-y-6
Filter:     grid gap-4 grid-cols-1 md:grid-cols-4
Table:      w-full overflow-x-auto
Pagination: flex gap-2 justify-center
```

### QA Checklist
- [ ] Filters visible above table
- [ ] Table has headers (sortable if applicable)
- [ ] Rows display with proper alignment
- [ ] Pagination works and is intuitive
- [ ] Responsive: table scrolls on mobile
- [ ] Loading state shows 5-10 skeleton rows
- [ ] Empty state is clear

### What NOT to Do
- ❌ Don't hardcode table data
- ❌ Don't make columns too narrow
- ❌ Don't forget pagination
- ❌ Don't remove header row
- ❌ Don't mix too many column types

---

## Recipe 7: Gallery / Media Dashboard Layout

### What It Is
A grid of images, cards, or previews with optional filters and lightbox/detail view.

### When to Use
- Media analytics (image performance, CDN usage)
- Gallery dashboards (portfolio, product showcase)
- Rich preview layout (card-based content)

### Components Allowed
- **Grid:** `ImageGrid`, `PreviewCard`
- **Filters:** Category filter, search
- **Details:** Modal or side panel for full view

### Grid Layout
```
Desktop (1440px):
┌───────┬───────┬───────┬───────┐
│ Card  │ Card  │ Card  │ Card  │
├───────┼───────┼───────┼───────┤
│ Card  │ Card  │ Card  │ Card  │
└───────┴───────┴───────┴───────┘

Responsive: 4 columns → 2 columns → 1 column
```

### Mock Data Expected
```typescript
interface MediaItem {
  id: string
  title: string
  preview: string
  metadata: {
    size?: number
    format?: string
    views?: number
  }
}
```

### States Required
- **Loading:** Skeleton cards in grid
- **Loaded:** Images with metadata
- **Empty:** "No media available"
- **Error:** "Failed to load media"

### CSS Classes
```
Container:  grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
Card:       aspect-square (if images)
Image:      w-full h-full object-cover
```

### What NOT to Do
- ❌ Don't load all images immediately (lazy load)
- ❌ Don't hardcode image URLs
- ❌ Don't mix aspect ratios without intention
- ❌ Don't forget alt text

---

## Recipe Selection Flowchart

```
What is the primary content?

├─ Metrics / KPIs?
│  └─ Yes → Recipe 1 (KPI Row)
│
├─ Chart + Details?
│  ├─ Side-by-side (60/40)? → Recipe 2 (Two-Column)
│  ├─ Full-width trend + legend? → Recipe 3 (Full-Width + Panel)
│  └─ Multiple sections (survey)? → Recipe 4 (Survey Layout)
│
├─ Mixed content (varied sizes)?
│  └─ → Recipe 5 (Bento)
│
├─ Data table / list?
│  └─ → Recipe 6 (Table + Filters)
│
└─ Images / gallery?
   └─ → Recipe 7 (Media Gallery)
```

---

## Using Multiple Recipes in One Dashboard

You CAN combine recipes, but follow these rules:

✅ **Allowed:**
```
Dashboard = Recipe 1 (KPI) + Recipe 4 (Survey Analysis) + Recipe 2 (Distribution)
This creates a complete survey dashboard
```

✅ **Allowed:**
```
Dashboard = Recipe 1 (KPI) + Recipe 3 (Trend Chart)
This creates a simple trend dashboard
```

❌ **Avoid:**
```
Dashboard = Recipe 5 (Bento) + Recipe 6 (Table)
Too much complexity, mismatched purposes
```

---

## Checklist: Recipe Applied Correctly

After selecting a recipe:

- [ ] Recipe matches dashboard purpose
- [ ] All required components present
- [ ] Mock data structure matches expectations
- [ ] Grid layout matches recipe specs
- [ ] Responsive tested at 375, 768, 1440px
- [ ] All states (loading/empty/error) implemented
- [ ] Dark mode verified
- [ ] No hardcoded data
- [ ] No custom components
- [ ] Accessibility verified

---

**Status:** ✅ RECIPES DEFINED  
**Type:** Design Patterns  
**Use In:** Phase 8.3 (design gate), Phase 8.4 (first screen build)

Generated: 2026-05-05
