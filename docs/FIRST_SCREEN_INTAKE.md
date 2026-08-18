# Screen Intake: Survey Analytics Dashboard

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.3 (Component Decision Gate)  
**Screen Type:** Business Intelligence Dashboard  

---

## Overview

- **Screen Name:** Survey Analytics Dashboard
- **Purpose:** Provide survey sentiment analysts, product managers, and survey administrators a unified view of survey response trends, sentiment distribution, and participation rates across time and segments.
- **Users:** Business analysts, product managers, survey administrators, insights team members
- **Frequency:** Daily/weekly review of sentiment tracking, monthly executive reviews, real-time monitoring during campaign periods

---

## Scope

### Components Needed

| Component | Purpose | Type | Status |
|-----------|---------|------|--------|
| SurveyMetricCard | KPI display (NPS, CSAT, Effort) with delta | Survey Analytics | ✅ Approved |
| FavorabilityDistributionCard | Sentiment distribution (Detractor/Neutral/Promoter) | Survey Analytics | ✅ Approved |
| ParticipationTrendCard | Response rate trend with chart | Survey Analytics | ✅ Approved |
| ResponseStackedBarGroup | Multi-segment stacked bar breakdown | Survey Analytics | ✅ Approved |
| TrendMetricLineChart | Multi-metric trend over time | Survey Analytics | ✅ Approved |
| DateFilterBar | Date range selection (day/week/month/custom) | Date | ✅ Approved |
| MultiSelect | Segment filtering (region, product, cohort) | Forms | ✅ Approved |
| PageHeader | Dashboard title and breadcrumbs | Layout | ✅ Approved |
| Card | Layout containers for sections | UI | ✅ Approved |
| Alert | Error/warning messages | Feedback | ✅ Approved |
| Skeleton | Loading placeholders for each section | Feedback | ✅ Approved |
| EmptyState | No data for period message | Feedback | ✅ Approved |

### Sections (Hierarchy)

```
1. Header Section
   ├─ PageHeader: "Survey Analytics Dashboard"
   ├─ Breadcrumb: Dashboard > Analytics
   └─ Help/Info tooltip

2. Filter Section
   ├─ DateFilterBar: Date range picker
   └─ MultiSelect: Segment filter (Region, Product, Cohort)

3. KPI Section (Top Metrics Row)
   ├─ SurveyMetricCard: NPS Score
   ├─ SurveyMetricCard: CSAT Score
   ├─ SurveyMetricCard: Effort Score
   └─ SurveyMetricCard: Response Count

4. Favorability Section
   ├─ FavorabilityDistributionCard (visual card)
   └─ ResponseStackedBarGroup (segment breakdown)

5. Participation Section
   ├─ ParticipationTrendCard (trend with chart)
   └─ Card: Secondary metrics (engagement rate, repeat respondents)

6. Timeline Section (Full Width)
   └─ TrendMetricLineChart: NPS/CSAT/Effort trends over time

7. Secondary Insights Section
   ├─ Card: Top keywords/themes (future enhancement)
   └─ Card: Segment comparison summary

8. Footer Section
   ├─ Last updated timestamp
   ├─ Data source notation
   └─ Export/Share actions (scope TBD)
```

### Filters & Controls

- **DateFilterBar:** 
  - Presets: Last 7 days, Last 30 days, Last 90 days, Last year, Custom range
  - Returns: ISO date strings (YYYY-MM-DD)
  - Required URL params: `from` and `to`

- **MultiSelect:** 
  - Options: Region (US, EU, APAC), Product (A, B, C), Cohort (New, Returning, VIP)
  - Supports multiple selection
  - Returns: Comma-separated values
  - URL param: `segments`

### Data Requirements

**Mock Data Shape (from src/mocks/):**
```typescript
interface SurveyDashboardData {
  metadata: {
    dateRange: { from: string; to: string }
    segments: string[]
    lastUpdated: string
  }
  
  metrics: {
    nps: { current: number; previous: number; delta: number }
    csat: { current: number; previous: number; delta: number }
    effort: { current: number; previous: number; delta: number }
    responseCount: { current: number; previous: number; delta: number }
  }
  
  distribution: {
    promoters: number
    passives: number
    detractors: number
    total: number
  }
  
  segmentBreakdown: Array<{
    segment: string
    promoters: number
    passives: number
    detractors: number
  }>
  
  participation: {
    trend: Array<{ date: string; responseRate: number }>
    engagementRate: number
    repeatRespondents: number
  }
  
  trends: Array<{
    date: string
    nps: number
    csat: number
    effort: number
    responseCount: number
  }>
}
```

---

## Layout Mockup

```
┌───────────────────────────────────────────────────────────────────┐
│ Survey Analytics Dashboard                                        │
│ Dashboard > Analytics                                             │
├───────────────────────────────────────────────────────────────────┤
│ [DateFilterBar]         [MultiSelect: Segments]                   │
├───────────────────────────────────────────────────────────────────┤
│ [NPS Card]  [CSAT Card] [Effort Card] [Response Card]             │
├───────────────────────────────────────────────────────────────────┤
│ [Favorability Card]                                               │
│ Detractor: 15% | Neutral: 35% | Promoter: 50%                   │
├───────────────────────────────────────────────────────────────────┤
│ [Segment Breakdown - Stacked Bar]                                 │
│ Region US:  [████] Detractors [████] Neutral [████] Promoters     │
│ Region EU:  [████] Detractors [████] Neutral [████] Promoters     │
│ Region AP:  [████] Detractors [████] Neutral [████] Promoters     │
├───────────────────────────────────────────────────────────────────┤
│ [Participation Trend Card]                                        │
│ Response Rate: 45% ↑ (vs 40% last period)                        │
│ Engagement: 78% | Repeat Respondents: 1,245                      │
├───────────────────────────────────────────────────────────────────┤
│ [Timeline Chart - Full Width]                                     │
│ NPS/CSAT/Effort Trends (30-day rolling view)                     │
│ [Line Chart with Legend]                                          │
├───────────────────────────────────────────────────────────────────┤
│ Last updated: 2026-05-05 14:30 UTC | Data: Mock Layer             │
│ [Share] [Export] [Refresh]                                        │
└───────────────────────────────────────────────────────────────────┘
```

### Responsive Behavior

- **Mobile (375px):** Single column, cards stack vertically
- **Tablet (768px):** Two columns, KPI row wraps to 2x2, distribution inline with segment bars
- **Desktop (1440px):** Four-column KPI row, distribution and participation side-by-side, timeline full width

---

## Success Criteria

- [ ] All components from library only (no custom wrappers)
- [ ] Responsive at 375px (mobile), 768px (tablet), 1440px (desktop) — no horizontal scroll
- [ ] Dark mode works (both light and dark themes fully functional)
- [ ] Keyboard navigation fully functional (Tab, Enter, Escape)
- [ ] Screen readers can access all content with proper ARIA
- [ ] Filters update URL and allow shareable links
- [ ] Loading states display Skeleton components for each section
- [ ] Empty state displays when no data for selected period
- [ ] Error state displays Alert when data fetch fails
- [ ] Partial load state (some sections loading, others loaded) handled gracefully
- [ ] Filter changes trigger re-render with updated mock data
- [ ] No console errors or warnings
- [ ] Build passes with zero TypeScript errors
- [ ] Meets WCAG 2.1 AA contrast requirements in both light and dark modes
- [ ] No hardcoded data or colors (UBITS tokens only)
- [ ] No API calls (mock layer only)

---

## Accessibility Requirements

### MANDATORY: WCAG 2.1 AA Compliance

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements (buttons, inputs, filters) reachable via Tab
  - [ ] Tab order logical: left-to-right, top-to-bottom (Header → Filters → Metrics → Distribution → Participation → Timeline → Footer)
  - [ ] Escape closes any open dropdowns or modals
  - [ ] Enter/Space activates buttons
  - [ ] Arrow keys navigate within MultiSelect and filter options

- [ ] **Screen Reader Support**
  - [ ] Page has descriptive `<title>`: "Survey Analytics Dashboard"
  - [ ] Main `<main>` landmark present and properly labeled
  - [ ] Headings semantic: `<h1>` for page title, `<h2>` for sections (Filters, KPI, Favorability, etc.)
  - [ ] Form inputs have associated `<label>` or `aria-label`
  - [ ] Chart images have descriptive `alt` text (e.g., "Line chart showing NPS trends from May 1 to May 30")
  - [ ] Status updates (filter changes, data loading) announced via `aria-live="polite"`
  - [ ] Metric delta (↑↓) conveyed textually, not icon-only

- [ ] **Color Contrast (WCAG AA Minimum: 4.5:1)**
  - [ ] All text meets 4.5:1 ratio (normal) or 3:1 (large text)
  - [ ] Link text distinguishable from surrounding text
  - [ ] Form focus indicators visible and distinct
  - [ ] Chart legend colors sufficient contrast
  - [ ] Test both light and dark modes

- [ ] **Focus Management**
  - [ ] Focus indicator always visible (not removed)
  - [ ] Focus visible on all buttons, links, form inputs, filter controls
  - [ ] Focus order matches visual flow
  - [ ] Focus not trapped in any section

- [ ] **Reduced Motion**
  - [ ] Animations respect `prefers-reduced-motion: reduce` preference
  - [ ] No auto-playing animations or transitions
  - [ ] Chart animations can be disabled/respect motion preference

- [ ] **Data Visualization (Charts)**
  - [ ] Chart data available in table format as alternative
  - [ ] Trend line colors use patterns (solid, dashed) in addition to color
  - [ ] Chart legend present and descriptive
  - [ ] Tooltips accessible via keyboard

---

## Dark Mode Specification

### Light Mode (Primary)
- **Background:** var(--color-background) — off-white (UBITS token)
- **Text:** var(--color-foreground) — charcoal/navy (UBITS token)
- **Cards:** var(--color-card) — white with subtle shadow (UBITS token)
- **Borders:** var(--color-border) — light gray (UBITS token)
- **Accents:** var(--color-primary) — brand blue (UBITS token)
- **Status - Success:** var(--color-success) — green
- **Status - Error:** var(--color-destructive) — red
- **Status - Warning:** var(--color-warning) — amber

### Dark Mode
- **Background:** var(--color-background) — dark charcoal (UBITS token)
- **Text:** var(--color-foreground) — off-white/light gray (UBITS token)
- **Cards:** var(--color-card) — dark surface (UBITS token)
- **Borders:** var(--color-border) — dark gray (UBITS token)
- **Accents:** var(--color-primary) — brand blue (UBITS token)
- **Status Colors:** Automatically inverted via UBITS tokens

### Verification Checklist
- [ ] Light mode: All text readable (contrast >= 4.5:1)
- [ ] Dark mode: All text readable (contrast >= 4.5:1)
- [ ] Light mode: Icons visible and clear
- [ ] Dark mode: Icons visible and clear
- [ ] Light mode: No hardcoded white backgrounds (#ffffff)
- [ ] Dark mode: No hardcoded black backgrounds (#000000)
- [ ] Toggle between modes does not break layout
- [ ] Metric cards show values clearly in both modes
- [ ] Chart legends readable in both modes

---

## Component Props & States

### SurveyMetricCard
```typescript
interface MetricCardProps {
  label: string           // "NPS", "CSAT", "Effort", "Response Count"
  value: number           // Current value
  previousValue: number   // Previous period value
  delta: number           // Change (e.g., +5, -2)
  unit?: string          // e.g., "%", "points", ""
  icon?: React.ReactNode // Optional icon
}

// States: Loaded (shows value), Loading (Skeleton), Empty (—), Error (Alert)
```

### FavorabilityDistributionCard
```typescript
interface FavDistProps {
  promoters: number
  passives: number
  detractors: number
  total: number
  segment?: string
}

// States: Loaded (donut + percentages), Loading (Skeleton), Empty (no data message)
```

### ResponseStackedBarGroup
```typescript
interface SegmentBreakdownProps {
  data: Array<{
    segment: string
    promoters: number
    passives: number
    detractors: number
  }>
}

// States: Loaded (stacked bars), Loading (Skeleton rows), Empty (no segments)
```

### TrendMetricLineChart
```typescript
interface TrendChartProps {
  data: Array<{
    date: string
    nps: number
    csat: number
    effort: number
    responseCount: number
  }>
  metrics: ('nps' | 'csat' | 'effort')[]
}

// States: Loaded (multi-line chart), Loading (Skeleton chart), Empty (no trend data)
```

### DateFilterBar & MultiSelect
```typescript
// DateFilterBar returns: { from: string, to: string } (ISO dates)
// MultiSelect returns: string[] (selected segment IDs)
// Both update URL params on change
```

---

## Open Questions & Decisions

1. **Secondary Insights Section**
   - Should we include "Top Keywords" and "Segment Comparison" in Phase 8.4, or defer to Phase 8.5?
   - *Decision:* Include placeholders in Phase 8.4; defer keyword analysis to Phase 8.5 (requires NLP mock layer)

2. **Export & Share**
   - Should export functionality be included in Phase 8.4?
   - *Decision:* Defer to Phase 8.5; scope out buttons but no backend logic

3. **Real-Time Updates**
   - Should dashboard refresh automatically?
   - *Decision:* Manual refresh only in Phase 8.4; real-time updates Phase 9.0+

4. **Segment Drill-Down**
   - Should clicking a segment filter drill down to that segment's details?
   - *Decision:* No drill-down in Phase 8.4; two-level filters only (region, product)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Chart library (ECharts) complexity | Medium | Use existing ChartShell wrapper; prebuilt configs for line charts |
| Large datasets in timeline | Medium | Mock data capped at 90 days; virtual scrolling optional Phase 8.5+ |
| Accessibility of complex charts | High | Provide data tables as alternatives; test with screen reader |
| Dark mode contrast issues | High | Use UBITS tokens; validate contrast in both modes during QA |
| Filter state explosion | Low | URL params only; no client state bloat; mock layer handles all variations |

---

## Success Metrics

After Phase 8.4 completion, dashboard should:
1. Load in < 2.5s (LCP target)
2. Respond to filters in < 200ms (INP target)
3. Maintain stable layout (CLS < 0.1)
4. Pass accessibility audit (WCAG 2.1 AA, 0 errors)
5. Support 3+ responsive breakpoints without horizontal scroll
6. Function fully in light and dark modes
7. Navigate via keyboard without mouse
8. Work with screen readers (VoiceOver, NVDA)

---

## Mock Data Provider Functions

The following functions from `src/mocks/` will populate this screen:

1. **getMockSurveyDashboardData(filters)** — Complete dashboard data snapshot
2. **getMockResponseDistribution(filters)** — Promoter/Passive/Detractor breakdown
3. **getMockTrendData(filters)** — 30-90 day trend data for charts
4. **getMockEmptyDashboardData()** — Empty state when no data for period
5. **getMockErrorResponse()** — Error state for failed mock retrieval
6. **getMockMetricsOnly()** — KPI summary only (for partial load scenarios)

All functions already exist in Phase 8.1 mock layer. No new mock functions needed.

---

**Status:** ✅ DEFINED  
**Ready for Phase 8.3 Component Decision Gate:** YES  
**Blocked by:** None  
**Next Phase:** 8.3 - Component Decision Gate (component verification)  

Generated: 2026-05-05  
Author: Frontend Architect (Phase 8.3 Governance)
