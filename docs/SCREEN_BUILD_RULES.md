# Screen Build Rules · Phase 8.0 Governance

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.0 (Governance & Architecture)

---

## Executive Summary

Screen build rules establish the mandatory constraints, intake process, and QA criteria for building the first business screens. A "screen" is a complete user-facing feature (dashboard, report, configuration panel) — distinct from component testing or technical playground. This document ensures all screens follow governance patterns and remain composable, testable, and maintainable.

**Core principle:** Screens are *assembled*, not *built*. Every screen is: (100% library components) + (mock data layer) + (URL state) + (accessible interactions). No new components, no APIs, no business logic until Phase 8.4+.

---

## Screen Definition

A **Screen** is:
- ✅ One or more dashboards or reports
- ✅ Composable from library components
- ✅ Has an intake document specifying requirements
- ✅ Uses mock data only (no APIs)
- ✅ Has defined success criteria
- ✅ Has accessibility requirements
- ✅ Has dark mode behavior specified

A screen is **NOT**:
- ❌ A single component demo
- ❌ A technical playground experiment
- ❌ A temporary test page
- ❌ An in-progress feature branch

---

## Intake Process (MANDATORY)

Before building ANY screen, complete an intake document. Use this template:

### Intake Document Template

```markdown
# Screen Intake: [Screen Name]

## Overview
- **Screen Name:** [e.g., "Survey Sentiment Dashboard"]
- **Purpose:** [One sentence. What problem does this solve?]
- **Users:** [Who will use this screen?]
- **Frequency:** [How often will it be used? Daily/weekly/monthly?]

## Scope
- **Components Needed:** [List 5-10 library components used]
- **Sections:** [List logical sections with hierarchy]
- **Filters/Controls:** [DateFilterBar, MultiSelect, etc.]
- **Data Requirements:** [What data shapes does this need?]

## Layout Mockup (ASCII or Figma link)
```
┌─────────────────────────────────────┐
│ [Header] Search [Filters]           │
├─────────────────────────────────────┤
│ [KPI Cards] [KPI Cards]             │
├─────────────────────────────────────┤
│ [Distribution Chart]   [Metric Card] │
├─────────────────────────────────────┤
│ [Timeline Chart - Full Width]       │
└─────────────────────────────────────┘
```

## Data Structure (TypeScript types)
```typescript
interface ScreenData {
  metrics: MetricShape[]
  distribution: DistributionShape[]
  timeSeries: TimeSeriesShape[]
}
```

## Success Criteria
- [ ] All components from library only
- [ ] Responsive at 375px, 768px, 1440px
- [ ] Dark mode works (both light and dark)
- [ ] Keyboard navigation functional
- [ ] Screen readers can access all content
- [ ] Filters update URL (shareable state)
- [ ] Loading states shown for each section
- [ ] Error states defined

## Accessibility Requirements
- [ ] WCAG 2.1 AA contrast
- [ ] Tab order logical
- [ ] ARIA labels on interactive elements
- [ ] Focus visible on all buttons/inputs
- [ ] Keyboard shortcuts documented

## Dark Mode Specification
- [ ] Light mode colors defined
- [ ] Dark mode colors defined
- [ ] Toggle location specified
- [ ] Contrast verified in both modes

## Notes
[Any open questions, blockers, or design decisions]
```

---

## Component Selection Rules

### Rule 1: Library Components Only
```typescript
// ✅ USE: Library components
<SurveyMetricCard {...props} />
<BarChart {...props} />
<DateFilterBar {...props} />

// ❌ DON'T: Create custom components
function CustomMetricCard() { ... }

// ❌ DON'T: Modify library components
// (even if you want a variant)
```

**Exception:** If a component variant is needed, request it in Phase 8.3 (Components Decision Gate), not during screen build. Screens use components as-is.

### Rule 2: Component Coverage List
Create a component coverage list before building:

| Component | Purpose | Status |
|-----------|---------|--------|
| SurveyMetricCard | KPI display with delta | ✅ Ready |
| BarChart | Distribution visualization | ✅ Ready |
| DateFilterBar | Date range selection | ✅ Ready |
| MultiSelect | Segment filtering | ✅ Ready |
| Skeleton | Loading state | ✅ Ready |

**Never use unlisted components.** If a missing component would improve UX, add to intake as a request for Phase 8.3.

---

## Data Layer Rules

### Rule 1: No Hardcoded Data
```typescript
// ❌ WRONG
const data = {
  metrics: [
    { label: 'NPS', value: 75 },
    { label: 'CSAT', value: 82 }
  ]
}

// ✅ CORRECT
const data = getMockSurveyDashboardData(filters)
```

### Rule 2: Mock Data Only
```typescript
// ❌ WRONG: API calls in screen files
async function loadMetrics() {
  const response = await fetch('/api/metrics')
  return response.json()
}

// ✅ CORRECT: Call mock layer
import { getMockSurveyDashboardData } from '@/mocks'

const data = getMockSurveyDashboardData({ 
  dateRange: [start, end],
  segment: selectedSegment 
})
```

### Rule 3: Props-Only Data Flow
```typescript
// ✅ CORRECT: Component receives all data via props
<SurveyMetricCard
  label={data.metrics[0].label}
  value={data.metrics[0].value}
  previousValue={data.metrics[0].previousValue}
  delta={data.metrics[0].delta}
/>

// ❌ WRONG: Component fetches its own data
function SurveyMetricCard() {
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/metric').then(d => setData(d))
  }, [])
}
```

---

## State Management Rules

### Rule 1: URL State for Filters
```typescript
// ✅ CORRECT: Filters live in URL
const { dateRange, segment } = useSearchParams()

const handleFilterChange = (newFilters) => {
  const params = new URLSearchParams()
  params.set('from', newFilters.dateRange[0].toISOString())
  params.set('to', newFilters.dateRange[1].toISOString())
  params.set('segment', newFilters.segment)
  window.history.replaceState({}, '', `?${params.toString()}`)
}
```

### Rule 2: Component State Only for Ephemeral UI
```typescript
// ✅ CORRECT: UI state (not data state)
const [isTooltipVisible, setIsTooltipVisible] = useState(false)

// ✅ CORRECT: Loading state
const [isLoadingSection, setIsLoadingSection] = useState(false)

// ❌ WRONG: Business data in local state
const [metrics, setMetrics] = useState([])
```

### Rule 3: No Global State Yet
- No Redux, Zustand, Jotai
- No complex state management
- Prop drilling is OK for now
- Keep screens simple while mocks exist

---

## Layout & Responsive Design

### Rule 1: Grid-Based Layouts Only
```tsx
// ✅ CORRECT: Grid layout
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <MetricCard />
  <MetricCard />
  <MetricCard />
  <MetricCard />
</div>

// ❌ WRONG: Hardcoded pixel widths
<div style={{ width: '400px' }}>
  <MetricCard />
</div>
```

### Rule 2: Mobile-First Breakpoints
```
Breakpoints:
- Mobile: 375px (default)
- Tablet: 768px (md:)
- Desktop: 1024px (lg:)
- Large desktop: 1440px (xl:)

Every layout must wrap/reflow on mobile.
```

### Rule 3: Responsive Component Props
```typescript
// ✅ CORRECT: Component adapts to screen
<ImageGrid 
  columns={isMobile ? 2 : 4}
  variant={isMobile ? 'compact' : 'cards'}
/>
```

---

## Loading & Empty States

### Rule 1: Every Section Has Three States

```typescript
// Loading state
if (isLoading) return <Skeleton className="h-32" />

// Empty state
if (data.length === 0) return <EmptyState />

// Loaded state
return <MetricCard {...data} />
```

### Rule 2: Show Skeletons During Fetch
```typescript
// ✅ CORRECT
{isLoading ? (
  <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
    <Skeleton className="h-24" />
    <Skeleton className="h-24" />
    <Skeleton className="h-24" />
    <Skeleton className="h-24" />
  </div>
) : (
  <MetricGrid metrics={data.metrics} />
)}
```

### Rule 3: Define Empty States
```typescript
// Use library empty states
{data.length === 0 && (
  <EmptyGalleryState 
    message="No responses yet"
    subtext="Responses will appear here once surveys are submitted"
  />
)}
```

### Rule 4: Error Boundary
```typescript
// Show errors without breaking layout
{error && (
  <Alert variant="destructive">
    <AlertTitle>Failed to load</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

---

## Accessibility Requirements

### Mandatory for All Screens

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements reachable via Tab
  - [ ] Tab order is logical (left-to-right, top-to-bottom)
  - [ ] Escape closes any modals/dropdowns
  - [ ] Enter activates buttons

- [ ] **Screen Reader Support**
  - [ ] Page has a descriptive `<title>`
  - [ ] Main landmark (`<main>`) present
  - [ ] Headings are semantic (`<h1>`, `<h2>`)
  - [ ] Form inputs have `<label>` or aria-label
  - [ ] Images have descriptive `alt` text
  - [ ] Tables have `<th>` and `<caption>`

- [ ] **Color Contrast**
  - [ ] WCAG AA (4.5:1 for normal text)
  - [ ] WCAG AAA (7:1 preferred)
  - [ ] Test with contrast checker tool

- [ ] **Focus Management**
  - [ ] Focus indicator always visible (not removed)
  - [ ] Focus returns to trigger after modal closes
  - [ ] Skip links present for navigation

- [ ] **Reduced Motion**
  - [ ] Animations respect `prefers-reduced-motion`
  - [ ] Autoplay disabled
  - [ ] Large transitions disabled

---

## Dark Mode Requirements

### Rule 1: Both Modes Intentional
```typescript
// ✅ CORRECT: Use UBITS tokens (auto light/dark)
className="bg-card text-foreground border border-border"

// ❌ WRONG: Light mode only
className="bg-white text-gray-900"
```

### Rule 2: Verify in Both Modes
- [ ] Light mode: All text readable
- [ ] Dark mode: All text readable
- [ ] Light mode: Icons visible
- [ ] Dark mode: Icons visible
- [ ] Light mode: No hardcoded whites
- [ ] Dark mode: No hardcoded blacks

### Rule 3: If Custom Colors Needed (Rare)
```typescript
// Use tokens, not hex colors
className="bg-primary text-primary-foreground"
className="bg-destructive text-destructive-foreground"

// Never use hex
className="bg-#ffffff" // ❌ WRONG
```

---

## File Organization

### Screen File Structure
```
src/pages/
├── SurveyDashboard.tsx
├── SurveyDashboard.test.tsx
└── components/
    ├── MetricSection.tsx
    ├── DistributionSection.tsx
    └── TimeSeriesSection.tsx
```

### Screen File Size Limits
```
Main screen file:     < 300 lines
Section component:    < 200 lines
Helper function:      < 100 lines
```

**If exceeding:** Extract into separate files. No monolithic screen files.

---

## Testing Requirements

### Mandatory Tests

- [ ] **Rendering**
  - [ ] Screen renders without error
  - [ ] All sections visible with mock data
  - [ ] Responsive at 3 breakpoints (375px, 768px, 1440px)

- [ ] **Interactivity**
  - [ ] Filters update URL
  - [ ] Filter change re-renders with new mock data
  - [ ] Keyboard navigation works

- [ ] **Accessibility**
  - [ ] ARIA labels present
  - [ ] Semantic HTML used
  - [ ] Tab order logical

- [ ] **States**
  - [ ] Loading states display
  - [ ] Empty states display
  - [ ] Error states display

---

## Build Checklist (Before Merge)

### Pre-Build
- [ ] Intake document completed
- [ ] Component coverage list created
- [ ] Layout mockup approved
- [ ] Data structure defined

### During Build
- [ ] Only library components used
- [ ] No hardcoded data
- [ ] Mock data only
- [ ] URL state for filters
- [ ] All 3 states (loading/empty/loaded)
- [ ] UBITS tokens only
- [ ] Responsive tested

### After Build
- [ ] Tests pass
- [ ] Build passes
- [ ] TypeScript clean
- [ ] Dark mode verified
- [ ] Accessibility verified
- [ ] No console errors
- [ ] Intake doc updated with results

### Final Gate (Before Merge)
- [ ] All components from approved list
- [ ] No new dependencies added
- [ ] No components modified
- [ ] No real data hardcoded
- [ ] No API calls in screen files
- [ ] Responsive at 375, 768, 1440px
- [ ] Keyboard navigation works
- [ ] WCAG AA contrast verified
- [ ] Dark mode works

---

## Common Mistakes (Prevention)

### Mistake 1: Creating Custom Components
```typescript
// ❌ WRONG
function CustomMetricCard() {
  return <div>...</div>
}

// ✅ RIGHT
import { SurveyMetricCard } from '@/components/survey-analytics'
```
**Fix:** Check library first. If missing, request in Phase 8.3.

### Mistake 2: Hardcoding Data
```typescript
// ❌ WRONG
const metrics = [
  { label: 'NPS', value: 75 },
  { label: 'CSAT', value: 82 }
]

// ✅ RIGHT
const metrics = getMockSurveyDashboardData(filters).metrics
```
**Fix:** Always use mock layer.

### Mistake 3: Fetching APIs
```typescript
// ❌ WRONG
useEffect(() => {
  fetch('/api/metrics').then(d => setMetrics(d.json()))
}, [])

// ✅ RIGHT
const metrics = getMockSurveyDashboardData(filters).metrics
```
**Fix:** Wait for Phase 8.4+. Use mocks only.

### Mistake 4: Pixel Layouts
```typescript
// ❌ WRONG
<div style={{ width: '500px', marginLeft: '20px' }}>

// ✅ RIGHT
<div className="grid gap-6 grid-cols-1 md:grid-cols-2">
```
**Fix:** Use Tailwind grid/flex utilities only.

### Mistake 5: Inline Components
```typescript
// ❌ WRONG
<div>
  {metrics.map(m => (
    <div key={m.id} className="p-4 border">
      {m.label}: {m.value}
    </div>
  ))}
</div>

// ✅ RIGHT
<div className="grid gap-6">
  {metrics.map(m => (
    <MetricCard key={m.id} {...m} />
  ))}
</div>
```
**Fix:** Use library components, not inline JSX.

---

## Phase 8.4 Milestone (First Screen Build)

When Phase 8.4 begins, use this checklist:

- [ ] Mock layer complete (Phase 8.1)
- [ ] Dashboard architecture doc reviewed
- [ ] First screen intake document approved
- [ ] Component coverage list signed off
- [ ] Figma mockup created (if available)
- [ ] Data structure defined in TypeScript
- [ ] Build begins with all rules in place

---

**Status:** ✅ RULES DEFINED  
**Type:** Governance  
**Enforcement:** Mandatory for Phase 8.4+ screens  
**Review:** Code reviewer checks compliance

Generated: 2026-05-05
