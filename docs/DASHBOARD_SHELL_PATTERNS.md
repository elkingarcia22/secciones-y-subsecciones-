# Dashboard Shell Patterns · Fase 8.2

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.2 (Dashboard Shell Patterns & Composition)  
**Type:** Architecture & Design Documentation

---

## Executive Summary

A dashboard shell pattern defines the structural, responsive, and compositional guardrails for building dashboards. This document specifies what a dashboard shell IS, what it is NOT, and how components compose within it — without building an actual dashboard yet.

**Core principle:** Dashboards are *structured layouts* that compose library components + mock data + governance rules. The shell pattern ensures consistency, accessibility, and maintainability across all future dashboards.

---

## What IS a Dashboard Shell?

A dashboard shell is a **layout composition** that:

✅ **Defines structure:**
- Header area (title, breadcrumbs, actions)
- Filter/control area (date range, segments, regions)
- Content grid (metrics, charts, analysis)
- Secondary insights area (related data, details)
- Footer/actions area (export, sharing)

✅ **Provides composition rules:**
- How sections snap together
- Spacing and rhythm patterns
- Responsive breakpoints
- State indicators (loading, empty, error)

✅ **Enforces governance:**
- Props-driven data flow only
- Library components only
- No hardcoded data
- UBITS tokens only
- Accessibility by default

✅ **Supports multiple layouts:**
- Simple (1-2 sections)
- Full (4+ sections)
- Comparison (side-by-side periods)
- Custom (bento, editorial)

---

## What is NOT a Dashboard Shell?

❌ **Not a component:** Shell patterns are design rules, not executable code.

❌ **Not a template builder:** Doesn't auto-generate dashboards from config.

❌ **Not a data provider:** Doesn't fetch or transform data (that's the mock layer).

❌ **Not a router:** Doesn't handle navigation or URL state directly.

❌ **Not a state manager:** Doesn't manage global state or persistence.

❌ **Not a UI kit variant:** Doesn't create new components or modify existing ones.

---

## Standard Dashboard Structure

### Anatomy

```
┌─────────────────────────────────────────────────┐
│                   HEADER AREA                    │
│  [Title] [Breadcrumb] [Action Button] [Settings]│
├─────────────────────────────────────────────────┤
│                  FILTER AREA                     │
│  [Date Range] [Segment] [Region] [Apply Filter] │
├─────────────────────────────────────────────────┤
│                  METRIC SECTION                  │
│ [KPI Card] [KPI Card] [KPI Card] [KPI Card]     │
├─────────────────────────────────────────────────┤
│              ANALYSIS SECTION                    │
│  [Chart 1]           │  [Analysis Card] [Card]  │
│                      │                          │
├─────────────────────────────────────────────────┤
│            TIMELINE / TREND SECTION              │
│          [Large Chart (Full Width)]              │
├─────────────────────────────────────────────────┤
│         SECONDARY INSIGHTS (Optional)            │
│  [Related Metric] [Comparison] [Details]         │
├─────────────────────────────────────────────────┤
│              ACTIONS / FOOTER                    │
│  [Export] [Share] [Print] [Last Updated: ...]   │
└─────────────────────────────────────────────────┘
```

### Required Sections

Every dashboard shell must include (in this order):

#### 1. Header Area
**Purpose:** Context and identity

```
Requirements:
- [ ] Dashboard title (h1)
- [ ] Breadcrumb (if nested)
- [ ] Help/info icon (if needed)
- [ ] Action buttons (optional: settings, fullscreen)
- Spacing: top padding 24-32px, bottom margin 16-24px
```

**Composition:**
```typescript
┌─────────────────────┐
│ Dashboard Title     │  (h1, text-3xl font-bold)
│ Breadcrumb: ...     │  (text-sm, secondary color)
│              [⚙ ]  │  (action button, top-right aligned)
└─────────────────────┘
```

#### 2. Filter Bar / Control Area
**Purpose:** Data filtering and parameterization

```
Requirements:
- [ ] Date range picker (DateFilterBar or calendar)
- [ ] Segment filter (MultiSelect or SearchableSelect)
- [ ] Region filter (optional)
- [ ] Search box (optional, if needed)
- [ ] Apply/Reset buttons (if necessary)
- Spacing: 16-24px between controls, 24px bottom margin
```

**Composition:**
```typescript
┌─────────────────────────────────────────────┐
│ [From Date] [To Date]                       │
│ [Segment: All ▼] [Region: All ▼]            │
│                            [Reset] [Apply]  │
└─────────────────────────────────────────────┘
```

**Interactivity:**
- Filter changes update URL search params
- URL params are bookmarkable (shareable state)
- Filters trigger mock data re-fetch
- No filter is persisted across sessions (unless URL is saved)

#### 3. Metric Section
**Purpose:** KPI summary and comparison

```
Requirements:
- [ ] 3-4 metric cards (SurveyMetricCard)
- [ ] Each shows: label, value, delta, trend, previous value
- [ ] Grid layout: 4-column on desktop, 2-column on tablet, 1 on mobile
- [ ] Gap between cards: 24px (gap-6 in Tailwind)
- [ ] Card height: equal height (auto-balanced)
```

**Composition:**
```typescript
┌──────┬──────┬──────┬──────┐
│ KPI1 │ KPI2 │ KPI3 │ KPI4 │  (4 columns on desktop)
│ 75   │ 82   │ 65   │ 89   │
│ ↑ 5% │ ↓ 3% │ ↑ 8% │ → 0% │
└──────┴──────┴──────┴──────┘

Mobile (1 column):
┌──────┐
│ KPI1 │
├──────┤
│ KPI2 │
├──────┤
│ KPI3 │
├──────┤
│ KPI4 │
└──────┘
```

#### 4. Distribution / Analysis Section
**Purpose:** Segment breakdown or detailed analysis

```
Requirements:
- [ ] Stacked bar chart OR card grid
- [ ] 1-2 columns depending on dashboard
- [ ] If 2 columns: left=chart (2/3 width), right=analysis (1/3 width)
- [ ] Gap: 24px between chart and side panel
```

**Composition Example 1 (2-column):**
```typescript
┌──────────────────────┬─────────────┐
│                      │ Segment A   │
│   [Distribution      │ 45%         │
│    Stacked Bar       │             │
│    Chart]            │ Segment B   │
│                      │ 35%         │
│                      │             │
│                      │ Segment C   │
│                      │ 20%         │
└──────────────────────┴─────────────┘
```

**Composition Example 2 (1-column responsive):**
```typescript
On Desktop:                On Mobile:
┌────────┬────────┐       ┌──────────┐
│ Chart  │ Card   │       │ Chart    │
│ 60%    │ 40%    │  →    ├──────────┤
└────────┴────────┘       │ Card     │
                          └──────────┘
```

#### 5. Timeline / Trend Section
**Purpose:** Temporal patterns and trends

```
Requirements:
- [ ] Full-width line chart or area chart
- [ ] X-axis: time (months, weeks, or dates)
- [ ] Y-axis: metric value
- [ ] Legend: clearly labeled
- [ ] Interactive: hoverable (optional in phase 8.2)
- [ ] Height: 300-400px
```

**Composition:**
```typescript
┌─────────────────────────────────────┐
│  Timeline: Sentiment Trend (12m)     │
│                                     │
│  [Legend: Current ◼ Previous ◼]     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   /\                        │   │
│  │  /  \      /\    /\        │   │
│  │ /    \    /  \  /  \       │   │
│  │        \  /    \/    \     │   │
│  └─────────────────────────────┘   │
│  Jan Feb Mar Apr May ... Dec        │
└─────────────────────────────────────┘
```

#### 6. Secondary Insights Area (Optional)
**Purpose:** Related data, comparisons, drill-downs

```
Requirements (if included):
- [ ] 1-3 small cards or metrics
- [ ] Less prominent than primary sections
- [ ] Can be hidden on mobile (optional)
- [ ] Grid layout, responsive
```

---

## Desktop-First Design Rules

### Rule 1: Baseline Viewport (1440px)

**Screen layout at 1440px:**
```
Available width: 1440px
Outer padding: 24px left/right = 1392px content
Max-width container: 1280px or 7xl

Grid setup:
- 12-column grid OR
- 4-column grid with spans

Example: 4-column at 1440px
Column width: ~300px
Gap: 24px (gap-6)
Full row: 4 columns = 300*4 + 24*3 = 1272px ✓
```

### Rule 2: Grid Configuration

**Tailwind grid classes (recommended):**

```
Metric row:
className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"

Distribution row (2-column):
className="grid gap-6 grid-cols-1 lg:grid-cols-2"

Timeline row (full):
className="grid gap-6 grid-cols-1"

Flexible 3-section row:
className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### Rule 3: Spacing & Rhythm

**Vertical spacing (between sections):**
```
Header → Filter: 24px (space-y-6)
Filter → Metric: 24px
Metric → Distribution: 32px (space-y-8, slightly more)
Distribution → Timeline: 32px
Timeline → Secondary: 32px
Secondary → Footer: 24px
```

**Horizontal spacing (within sections):**
```
Within metric grid: gap-6 (24px)
Within analysis 2-col: gap-6 (24px)
Cards inside grid: gap-4 or gap-6 depending on card size
```

**Padding rules:**
```
Page container: px-6 (sm:px-8, lg:px-0) + max-w-7xl
Section inner: inherits from parent (no additional padding)
Card internal: padding-4 or padding-6 (defined by component)
```

### Rule 4: Container Max-Width

```typescript
// Recommended structure
<div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-8">
  {/* Header */}
  {/* Filter Bar */}
  {/* Sections */}
</div>

Max-width values:
- 6xl = 1344px (safe for most dashboards)
- 7xl = 1536px (larger dashboards, conference view)
- full = no limit (rare)
```

---

## Responsive Design Rules

### Rule 1: Mobile-First Approach

**Breakpoints:**
```
Mobile:        375px (default)
Tablet:        768px (md: in Tailwind)
Desktop:       1024px (lg: in Tailwind)
Large Desktop: 1440px (xl: in Tailwind)
```

**Grid behavior:**
```
At 375px (mobile):
- All grids: grid-cols-1 (single column, stacked)
- Full width: max-w-full
- Padding: px-4

At 768px (tablet):
- 4-card row: grid-cols-2 (2x2 grid)
- 2-column: still 1 column (stack)
- Padding: px-6

At 1024px+ (desktop):
- 4-card row: grid-cols-4
- 2-column: grid-cols-2
- Padding: px-6 or px-8
```

### Rule 2: Responsive Components

**DateFilterBar:**
- Mobile (375px): Stacked vertically, full-width inputs
- Tablet (768px): Horizontal, 2 per row
- Desktop (1440px): All in one row

**Chart sizing:**
```
Mobile:   height: 250px (shorter, thumb-friendly)
Tablet:   height: 300px
Desktop:  height: 400px
```

**Card sizing:**
```
Metric card (4-column):
- Mobile:  min-h-24
- Tablet:  min-h-28
- Desktop: min-h-32

These auto-adjust with gap-6
```

### Rule 3: Touch-Friendly Targets

**All interactive elements (buttons, inputs, cards):**
- Minimum touch target: 44px × 44px
- Spacing between targets: 8px minimum
- Verified at 375px viewport

---

## Light Mode & Dark Mode Rules

### Rule 1: Use UBITS Tokens ONLY

**Allowed:**
```typescript
// ✅ CORRECT: Use design tokens
className="bg-card text-foreground border border-border"
className="bg-primary text-primary-foreground"
className="hover:bg-accent hover:text-accent-foreground"
className="text-muted-foreground"
className="bg-destructive text-destructive-foreground"
className="border border-input"
```

**Forbidden:**
```typescript
// ❌ WRONG: Hardcoded colors
className="bg-white text-black"
className="bg-#ffffff dark:bg-#1a1a1a"
className="bg-gray-100 dark:bg-gray-900"
className="text-[#333333]"
```

### Rule 2: Component Theme Compliance

**All components must:**
- [ ] Use UBITS tokens (auto light/dark)
- [ ] Support both light and dark modes
- [ ] Have sufficient contrast in both modes
- [ ] Be visually intentional in both modes

**Verification:**
```
Light mode checklist:
- [ ] All text readable (WCAG AA 4.5:1)
- [ ] Icons visible
- [ ] Interactive elements distinguishable
- [ ] No hardcoded whites

Dark mode checklist:
- [ ] All text readable (WCAG AA 4.5:1)
- [ ] Icons visible
- [ ] Interactive elements distinguishable
- [ ] No hardcoded blacks
```

### Rule 3: Dark Mode Specific Patterns

**Backgrounds:**
```
Light:  bg-background (white or near-white)
Dark:   bg-background (dark, usually #09090b or similar)

Cards:  bg-card (light gray / dark gray)
Input:  bg-input (light border / dark border)
```

**Text hierarchy:**
```
Light:
  Primary:   text-foreground (dark gray/black)
  Secondary: text-muted-foreground (medium gray)
  Disabled:  text-muted-foreground (lighter gray)

Dark:
  Primary:   text-foreground (light gray/white)
  Secondary: text-muted-foreground (medium gray)
  Disabled:  text-muted-foreground (darker gray)
```

**Status colors (semantic):**
```
Success:  text-positive (green, works in both modes)
Warning:  text-warning (orange, works in both modes)
Error:    text-destructive (red, works in both modes)
Info:     text-primary (blue, works in both modes)
```

---

## Accessibility Rules

### Rule 1: Semantic HTML Structure

**Required structure:**
```html
<main>
  <header>
    <h1>Dashboard Title</h1>
  </header>
  
  <section aria-labelledby="filter-heading">
    <h2 id="filter-heading">Filters</h2>
    {/* Filter controls */}
  </section>
  
  <section aria-labelledby="metrics-heading">
    <h2 id="metrics-heading">Key Metrics</h2>
    {/* Metric cards */}
  </section>
  
  <section aria-labelledby="analysis-heading">
    <h2 id="analysis-heading">Analysis</h2>
    {/* Charts and analysis */}
  </section>
</main>
```

### Rule 2: Focus Management

**Requirements:**
```
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Focus is always visible (not removed)
- [ ] Focus doesn't jump unexpectedly
- [ ] Focus returns to trigger when modal/panel closes
- [ ] Skip link: "Skip to main content" (optional but recommended)
```

### Rule 3: ARIA Labels

**Interactive elements:**
```html
<!-- Button -->
<button aria-label="Open settings menu">⚙</button>

<!-- Inputs -->
<input 
  type="date" 
  aria-label="Start date"
  aria-describedby="date-help"
/>
<span id="date-help">Select the date range start (YYYY-MM-DD)</span>

<!-- Charts -->
<div aria-label="Monthly sentiment trend, showing 75% in January rising to 82% in May">
  {/* Chart visualization */}
</div>
```

### Rule 4: Keyboard Navigation

**All dashboards must support:**
```
- Tab:      Navigate forward through interactive elements
- Shift+Tab: Navigate backward
- Enter:    Activate buttons
- Space:    Toggle checkboxes, open/close
- Escape:   Close modals, collapse menus
- Arrow keys: (optional) Navigate within select/listbox
```

### Rule 5: Color Contrast (WCAG AA)

**Minimum ratios:**
```
Normal text:  4.5:1
Large text:   3:1
UI components: 3:1

Verification tools:
- Browser dev tools: Color Contrast Analyzer
- Figma: Able design plugin
- Online: https://www.tpgi.com/color-contrast-checker/
```

---

## Component Usage Rules

### Rule 1: Metric Cards (KPI Display)

**Component:** `SurveyMetricCard`

```
Requirements:
- [ ] Shows: label, value, previous value, delta, trend
- [ ] Trend indicators: up (green), down (red), neutral (gray)
- [ ] Responsive text size (sm on mobile, base on desktop)
- [ ] Equal height in grid
```

**Pattern:**
```
┌─────────────────┐
│ Label           │
│ 75              │
│ ↑ 5% from 70    │
└─────────────────┘
```

**Allowed variants:**
- Color-coded segments (from distribution)
- Sparkline (optional, if available)
- Comparison mode (side-by-side)

**Forbidden:**
- Custom styling
- Layout changes
- Icon swaps
- Removing props

### Rule 2: Charts (Data Visualization)

**Components:** `BarChart`, `LineChart`, `AreaChart`, `DonutChart`

```
Requirements:
- [ ] Uses library preset (not raw ECharts)
- [ ] Props: data, title, xAxisLabel, yAxisLabel
- [ ] Legend: visible and labeled
- [ ] Responsive height (250-400px)
- [ ] Color scheme: auto (inherited from UBITS)
```

**Allowed configurations:**
- Title (optional)
- Legend placement (top, right, bottom)
- Tooltip (auto-enabled)
- Data labels (optional)

**Forbidden:**
- Custom ECharts config
- Animation customization
- Color overrides
- Custom components inside charts

### Rule 3: Distribution Analysis

**Component:** `ResponseStackedBar` or `FavorabilityDistributionCard`

```
Requirements:
- [ ] Stacked bar: shows segment breakdown
- [ ] Side card: shows segment details
- [ ] Legend: clearly labeled
- [ ] Colors: semantic (positive, neutral, negative)
- [ ] Responsive: stacks on mobile
```

**Pattern:**
```
Bar:    ████████████████ (segments color-coded)
Legend: Positive (45%) | Neutral (35%) | Negative (20%)
```

### Rule 4: Controls & Filters

**Components:** `DateFilterBar`, `MultiSelect`, `SearchableSelect`

```
Requirements:
- [ ] DateFilterBar: shows date range picker
- [ ] MultiSelect: allows multiple selections
- [ ] SearchableSelect: allows filtering + selection
- [ ] All connected to filter state (via props)
- [ ] Changes trigger mock data re-fetch
```

**Pattern:**
```
[From Date ▼] [To Date ▼]
[Segment: All ▼] [Region: All ▼]
[Reset] [Apply]
```

### Rule 5: State Indicators

**Components:** `Skeleton`, `Alert`, `EmptyState`

```
Loading state:
- [ ] Skeleton: matches expected content height
- [ ] Shows in grid (same layout as loaded)
- [ ] Smooth transition to loaded

Empty state:
- [ ] EmptyState: shows message + icon
- [ ] Suggests next action
- [ ] Not dismissible (persistent until data arrives)

Error state:
- [ ] Alert: shows error message
- [ ] Dismissible or auto-clears
- [ ] Provides retry option (optional)
```

---

## Data Flow Rules

### Rule 1: Props-Only Data

```
Structure:
┌─────────────────────────────────┐
│ Dashboard Component             │
│ {data, filters, isLoading}      │
├─────────────────────────────────┤
│ Section 1 Component             │
│ {metrics, onFilterChange}       │
├─────────────────────────────────┤
│ Card / Chart Component          │
│ {value, label, trend, ...}      │
└─────────────────────────────────┘

No component fetches its own data.
No useEffect calls for data loading.
No internal state for business data.
```

### Rule 2: Mock Data Contract

```typescript
// Expected data shape (from src/mocks/)
interface DashboardData {
  metrics: MetricData[]         // KPI cards
  distribution: {
    segments: ResponseSegment[]  // Stacked bar
    total: number
  }
  timeSeries: TimeSeriesData[]  // Line chart
  metadata: {
    lastUpdated: Date
    source: 'mock' | 'api'
  }
}
```

### Rule 3: Filter-to-Data Flow

```
User changes filter
  ↓
Filter state updates (URL search params)
  ↓
Dashboard calls: getMockDashboardData(filters)
  ↓
Mock layer returns typed data
  ↓
Data passed as props to sections
  ↓
Sections/cards re-render
```

---

## Prohibited Patterns

### ❌ Prohibited: Hardcoded Data

```typescript
// WRONG
const metrics = [
  { label: 'NPS', value: 75 },
  { label: 'CSAT', value: 82 }
]

// RIGHT
const metrics = data.metrics  // from props
```

### ❌ Prohibited: API Calls in Dashboard

```typescript
// WRONG
useEffect(() => {
  fetch('/api/metrics').then(r => r.json()).then(setData)
}, [])

// RIGHT
// Use mock layer at page level, pass data as props
const data = getMockDashboardData(filters)
<MetricSection metrics={data.metrics} />
```

### ❌ Prohibited: Component Creation

```typescript
// WRONG
function CustomMetricCard() {
  return <div className="...">...</div>
}

// RIGHT
import { SurveyMetricCard } from '@/components/survey-analytics'
<SurveyMetricCard {...props} />
```

### ❌ Prohibited: Pixel-Based Layouts

```typescript
// WRONG
<div style={{ width: '500px', marginLeft: '20px' }}>

// RIGHT
<div className="max-w-7xl mx-auto px-6">
```

### ❌ Prohibited: Hardcoded Colors

```typescript
// WRONG
className="bg-#f0f0f0 text-#333333"

// RIGHT
className="bg-card text-foreground"
```

### ❌ Prohibited: Decorative Effects (Phase 8.2)

```typescript
// WRONG (save for Phase 8.5+)
className="backdrop-blur-md shadow-2xl"
className="bg-gradient-to-r from-blue-500 to-purple-600"

// RIGHT (for Phase 8.2)
className="border border-border rounded-lg"
className="shadow-sm"
```

---

## Dashboard Shell Checklist

Before building any dashboard, verify:

### Structure
- [ ] Header area present (title, breadcrumb)
- [ ] Filter bar present (date range, segment)
- [ ] Metric section present (KPI cards)
- [ ] Analysis section present (chart or cards)
- [ ] Timeline section present (trend data)
- [ ] Sections in correct order

### Responsiveness
- [ ] Tested at 375px (mobile)
- [ ] Tested at 768px (tablet)
- [ ] Tested at 1440px (desktop)
- [ ] No overflow or clipping
- [ ] Touch targets >= 44px
- [ ] Text readable at all sizes

### Accessibility
- [ ] Semantic HTML (`<main>`, `<section>`, `<h1>`-`<h6>`)
- [ ] Focus management (Tab order logical)
- [ ] ARIA labels on interactive elements
- [ ] Color contrast >= WCAG AA (4.5:1)
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

### Styling
- [ ] UBITS tokens only (no hardcoded colors)
- [ ] Light mode verified
- [ ] Dark mode verified
- [ ] Spacing consistent (24px, 32px gaps)
- [ ] Grid-based layout (no pixels)
- [ ] No decorative effects (Phase 8.2)

### Components
- [ ] Only library components used
- [ ] No custom components
- [ ] No component modifications
- [ ] All required props passed
- [ ] Props match component signatures

### Data
- [ ] No hardcoded data
- [ ] All data from props
- [ ] Mock layer called (not fetch)
- [ ] Data types match expectations
- [ ] Filter state in URL

### States
- [ ] Loading state (Skeleton)
- [ ] Loaded state (data)
- [ ] Empty state (no data)
- [ ] Error state (message)
- [ ] Partial data state (some sections)

---

## Examples (Pattern Only, Non-Functional)

### Example 1: Simple Survey Dashboard Shell

```
┌─────────────────────────────────────┐
│ Survey Sentiment Dashboard          │ (Header)
│ Breadcrumb: Dashboards > Surveys    │
├─────────────────────────────────────┤
│ [Date Range] [Segment] [Apply]      │ (Filter)
├─────────────────────────────────────┤
│ [NPS: 75] [Satisfaction: 82]        │ (KPI row, 4 cards on desktop)
│ [Participation: 65%] [Response: 88%]│
├─────────────────────────────────────┤
│ [Sentiment Distribution]  [Details] │ (2-column analysis)
│ [Stacked Bar Chart]      [Card 1]   │
│                          [Card 2]   │
├─────────────────────────────────────┤
│ Monthly Sentiment Trend (12 months)  │ (Timeline section)
│ [Line Chart spanning full width]    │
├─────────────────────────────────────┤
│ [Last Updated: 2026-05-05 15:30]    │ (Footer)
└─────────────────────────────────────┘
```

### Example 2: Product Feedback Dashboard Shell

```
┌─────────────────────────────────────┐
│ Product Feedback Analysis           │ (Header)
├─────────────────────────────────────┤
│ [Date Range] [Feature] [Sentiment] │ (Filter)
├─────────────────────────────────────┤
│ [Total Feedback] [Avg Sentiment]    │ (KPI row, 3 cards + gap)
│ [Unresolved Issues] [Response Rate] │
├─────────────────────────────────────┤
│         [Feedback Breakdown]        │ (Full-width chart)
│         [Stacked bar chart]         │
├─────────────────────────────────────┤
│ Top Issues Trend                    │ (Timeline)
│ [Area chart, 6 months]              │
├─────────────────────────────────────┤
│ Top 5 Most Mentioned Features       │ (Secondary)
│ [1. Feature A (45 mentions)]        │
│ [2. Feature B (32 mentions)]        │
└─────────────────────────────────────┘
```

---

## Next Steps

### After Fase 8.2
This document serves as the design pattern reference for all future dashboard builds. Combined with:
- **DASHBOARD_LAYOUT_RECIPES.md** — Specific layout patterns to reuse
- **DASHBOARD_STATE_PATTERNS.md** — How to handle loading/empty/error states
- **DASHBOARD_QA_RULES.md** — Quality assurance checklist

### Phase 8.3 (Design Review)
When selecting the first dashboard to build, use this shell pattern as the foundation and review against this document.

### Phase 8.4 (First Screen Build)
Build the first dashboard strictly adhering to this shell pattern and all governance rules documented here.

---

**Status:** ✅ PATTERNS DEFINED  
**Type:** Design & Architecture  
**Enforcement:** Mandatory for all Phase 8.4+ dashboards  
**Review:** During Phase 8.3 design gate

Generated: 2026-05-05
