# Build Prompt: Survey Analytics Dashboard (Phase 8.4)

**Status:** ⚠️ HOTFIX 8.3.1 (Updated APIs)  
**Date:** 2026-05-05  
**Phase:** 8.3 (Hotfix) → 8.4 (First Screen Build)  
**Screen:** Survey Analytics Dashboard  
**Type:** Business Intelligence Dashboard  

---

## Executive Summary

You are building the first business screen for Plantilla-proyecto. This is the Survey Analytics Dashboard — a real-time sentiment and response analysis dashboard using 12 pre-approved library components. **CRITICAL:** This document has been updated with ACTUAL component APIs (Hotfix 8.3.1). Previous component prop documentation was incorrect. All prop names, data structure paths, and type definitions below reflect the actual implementations in src/components/ and src/mocks/types.ts. Use this as your authority for what to build, what NOT to build, and how to verify success.

---

## Context & Background

### Project Phase
- **Current Phase:** 8.3 (Governance Gate) — COMPLETE
- **Next Phase:** 8.4 (First Screen Build) — THIS
- **Future Phase:** 8.5 (Second Screen)
- **API Phase:** 9.0+

### Completed Governance
- ✅ ANTIGRAVITY.md: Governance framework established
- ✅ FIRST_SCREEN_INTAKE.md: Requirements defined
- ✅ FIRST_SCREEN_COMPONENT_DECISION_GATE.md: 12 components approved
- ✅ FIRST_SCREEN_COMPONENT_MAP.md: Layout designed
- ✅ FIRST_SCREEN_MOCK_DATA_MAP.md: Data bindings documented
- ✅ FIRST_SCREEN_QA_PLAN.md: Testing strategy defined
- ✅ Mock data layer (Phase 8.1) exists in src/mocks/

### Screen Purpose
**Target:** Business analysts, product managers, insights team  
**Goal:** Unified view of survey sentiment trends, distribution, and participation  
**Frequency:** Daily/weekly review; campaign monitoring  

---

## Objective

Build a **single, complete, production-ready dashboard page** that:
1. Uses **only library components** (no custom components)
2. Uses **mock data only** (no API calls)
3. Implements **all required states** (loading, loaded, empty, error)
4. Maintains **responsive design** (375px, 768px, 1440px)
5. Supports **both light and dark modes** fully
6. Meets **WCAG 2.1 AA** accessibility
7. Uses **URL params** for shareable filter state
8. Passes **full QA suite** before merge

---

## What You Are Building

### Screen Name
**Survey Analytics Dashboard**

### File Location
```
src/pages/SurveyDashboard.tsx
src/pages/SurveyDashboard.test.tsx (tests)
src/pages/components/ (section components)
```

### Screen Sections (in order)
1. **Header** — PageHeader with title and breadcrumbs
2. **Filters** — DateFilterBar + MultiSelect for segments
3. **KPI Row** — 4 SurveyMetricCards (NPS, CSAT, Effort, Response Count)
4. **Favorability** — FavorabilityDistributionCard + ResponseStackedBarGroup
5. **Participation** — ParticipationTrendCard + Secondary Metrics Card
6. **Timeline** — TrendMetricLineChart (multi-metric trends)
7. **Footer** — Last updated timestamp + data source notation

### Approved Components (Use These Exactly)
```
✅ SurveyMetricCard (4x)
✅ FavorabilityDistributionCard (1x)
✅ ResponseStackedBarGroup (1x)
✅ ParticipationTrendCard (1x)
✅ TrendMetricLineChart (1x)
✅ DateFilterBar (1x)
✅ MultiSelect (1x)
✅ PageHeader (1x)
✅ Card (5+x, wrappers)
✅ Alert (1+x, error states)
✅ Skeleton (Multiple, loading)
✅ EmptyState (Multiple, empty states)
```

**NO other components.** If you need something different, stop and escalate.

---

## Constraints (MANDATORY)

### 1. No Custom Components
❌ **DO NOT CREATE:**
- CustomMetricCard, CustomChart, CustomFilter, etc.
- Wrapper components around library components
- Screen-specific variations

✅ **DO USE:**
- Library components exactly as designed
- Library components can be composed

**Why:** Component freeze ensures library reusability and consistency.

---

### 2. No Hardcoded Data
❌ **DO NOT:**
```typescript
const mockData = {
  metrics: [
    { label: 'NPS', value: 75 }
  ]
}
```

✅ **DO:**
```typescript
import { getMockSurveyDashboardData } from '@/mocks'
const data = getMockSurveyDashboardData(filters)
```

**Why:** Mock layer is source of truth. Enables easy API swap in Phase 9.0.

---

### 3. No API Calls
❌ **DO NOT:**
```typescript
fetch('/api/metrics')
axios.get('/metrics')
useEffect(() => { fetch(...) }, [])
```

✅ **DO:**
```typescript
const data = getMockSurveyDashboardData(filters)
```

**Why:** Phase 8 is mock-only. APIs deferred to Phase 9.0.

---

### 4. No New Dependencies
❌ **DO NOT:** `npm install` any packages  
✅ **DO:** Use existing dependencies only

**Why:** Controlled dependency surface; Phase 8.1 mock layer is complete.

---

### 5. No Hardcoded Colors
❌ **DO NOT:**
```typescript
className="bg-white text-black"
style={{ color: '#1f2937' }}
```

✅ **DO:**
```typescript
className="bg-background text-foreground"
// Uses UBITS tokens from src/styles/tokens.css
```

**Why:** UBITS tokens auto-switch light/dark mode.

---

### 6. No Hardcoded Spacing
❌ **DO NOT:**
```typescript
style={{ padding: '24px', marginBottom: '16px' }}
```

✅ **DO:**
```typescript
className="p-6 mb-4"
```

**Why:** Tailwind spacing classes for consistency.

---

### 7. Responsive Grid System
Use this pattern for all layouts:

```tsx
// KPI Row: 1 col (mobile), 2 col (tablet), 4 col (desktop)
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

**Breakpoints:**
- Mobile (default): Single column
- `md:` (768px+): 2 columns
- `lg:` (1024px+): 4 columns

---

### 8. All Data via Props
❌ **DO NOT:**
```typescript
function SurveyMetricCard() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch(...) }, [])
}
```

✅ **DO:**
```typescript
function SurveyMetricCard({ value, delta, label }) {
  return <div>{value}</div>
}
// Parent passes: <SurveyMetricCard value={data.nps.current} />
```

**Why:** Props-driven prevents component coupling to data layer.

---

### 9. URL State for Filters
```typescript
// Read filters from URL
const searchParams = useSearchParams()
const filters = {
  dateRange: {
    from: searchParams.get('from'),
    to: searchParams.get('to')
  },
  segments: searchParams.get('segments')?.split(',')
}

// Update URL when filters change
const handleFilterChange = (newFilters) => {
  const params = new URLSearchParams()
  params.set('from', newFilters.dateRange.from)
  params.set('to', newFilters.dateRange.to)
  params.set('segments', newFilters.segments.join(','))
  window.history.replaceState({}, '', `?${params.toString()}`)
}
```

**Why:** Shareable URLs, bookmarkable states.

---

### 10. File Size Limits
- Main screen file: < 300 lines
- Section components: < 200 lines each
- Extract if exceeding limits

**Why:** Maintainability, testability.

---

## Required Implementations

### 1. Header Section
```tsx
<PageHeader 
  title="Survey Analytics Dashboard"
  breadcrumbs={[
    { label: 'Dashboard' },
    { label: 'Analytics' }
  ]}
/>
```

✅ Include breadcrumbs  
✅ Display title clearly  
✅ Optional subtitle/info

---

### 2. Filter Section

**CRITICAL: DateFilterBar uses Date objects, NOT ISO strings**

```tsx
const [filters, setFilters] = useState<FilterCriteria>({
  dateRange: {
    start: new Date('2026-04-01'),    // ← Date object
    end: new Date('2026-05-05')       // ← Date object
  }
})

// DateFilterBar returns Date objects in callbacks:
const handleDateRangeChange = (range?: { from?: Date; to?: Date }) => {
  setFilters(prev => ({
    ...prev,
    dateRange: {
      start: range?.from || new Date(),
      end: range?.to || new Date()
    }
  }))
  // Convert to ISO for URL (if needed)
  const from = range?.from?.toISOString().split('T')[0]
  const to = range?.to?.toISOString().split('T')[0]
  updateURL({ from, to })
}
```

```tsx
<DateFilterBar 
  mode="range"
  range={{ from: filters.dateRange.start, to: filters.dateRange.end }}
  onRangeChange={handleDateRangeChange}
/>
<MultiSelect 
  options={segmentOptions}
  onChange={handleSegmentChange}
/>
```

✅ Date range picker (DateFilterBar with Date objects)  
✅ Segment multi-select (Region, Product, etc.)  
✅ Updates URL on change (convert Date → ISO string for URL param)  
✅ 2-column grid layout

---

### 3. Loading States
```tsx
{isLoading ? (
  <Skeleton className="h-24" />
) : (
  <MetricCard {...data} />
)}
```

✅ Skeleton during fetch  
✅ Each section has own loading indicator  
✅ Doesn't block entire UI  

---

### 4. Empty States
```tsx
{!data || data.length === 0 ? (
  <EmptyState 
    message="No data for this period"
    subtext="Try adjusting filters"
  />
) : (
  <MetricCard {...data} />
)}
```

✅ Show when no data available  
✅ User-friendly message  
✅ Suggest next action (change filters)

---

### 5. Error States
```tsx
{error ? (
  <Alert variant="destructive">
    <AlertTitle>Failed to Load</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
) : (
  <Content />
)}
```

✅ Alert component for errors  
✅ User-friendly error message  
✅ Doesn't crash entire page

---

### 6. Responsive Behavior
- **Mobile (375px):** 1 card per row, filters stack
- **Tablet (768px):** 2 cards per row, filters side-by-side
- **Desktop (1024px+):** 4 KPI cards per row

✅ Test at all breakpoints  
✅ No horizontal scroll  
✅ Touch targets >= 44px

---

### 7. Dark Mode
✅ All colors use UBITS tokens  
✅ Contrast >= 4.5:1 in both modes  
✅ Icons visible in both modes  
✅ No hardcoded #ffffff or #000000

---

### 8. Accessibility
✅ Semantic HTML (`<header>`, `<main>`, `<section>`)  
✅ Tab navigation works  
✅ Focus visible on all interactive elements  
✅ ARIA labels on form inputs  
✅ Screen reader compatible  
✅ WCAG 2.1 AA compliance

---

## Data Flow (ACTUAL IMPLEMENTATION)

```
URL ?from=2026-04-01&to=2026-05-05&segment=us
        ↓
useSearchParams() parse
        ↓
Convert to FilterCriteria (Date objects, NOT ISO strings):
{
  dateRange: {
    start: new Date('2026-04-01'),    // ← Date object, not string
    end: new Date('2026-05-05')
  },
  segment: 'us'
}
        ↓
Call getMockSurveyDashboardData(criteria)
        ↓
Receive DashboardData (ACTUAL STRUCTURE):
{
  metrics: MetricData[],              // ← ARRAY of objects, NOT { nps, csat, ... }
  distribution: {
    label: string,
    segments: ResponseSegment[],      // ← segments array in distribution
    total: number
  },
  timeSeries: TimeSeriesData[],       // ← Contains all trends (participation, nps, csat, effort)
  metadata: { lastUpdated, source, period }
}
        ↓
Component Bindings (ACTUAL PROPS):
├─ SurveyMetricCard: value, title, subtitle, delta, deltaLabel, deltaTone, trendDirection
├─ FavorabilityDistributionCard: segments, total
├─ ResponseStackedBarGroup: items (ResponseStackedBarItem[])
├─ ParticipationTrendCard: series (TimeSeriesData[])
└─ TrendMetricLineChart: series (TimeSeriesData[])
        ↓
Pass to components via props
        ↓
Render with library components only
```

**CRITICAL - Data Structure Corrections:**
- ❌ `data.metrics.nps` (object property) → ✅ `data.metrics[0]` (array element with metric.id === 'nps')
- ❌ `data.distribution.promoters` (property) → ✅ `data.distribution.segments[0]` (array element)
- ❌ `data.segmentBreakdown` (separate property) → ✅ Derive or query separately
- ❌ `data.participation` (separate property) → ✅ Filter from `data.timeSeries`
- ❌ `data.trends` (separate property) → ✅ Use `data.timeSeries` (contains all trends)
- ❌ ISO date strings in filters → ✅ Date objects in FilterCriteria

**Reference:** See FIRST_SCREEN_COMPONENT_MAP.md and FIRST_SCREEN_MOCK_DATA_MAP.md for exact bindings

**Never:**
- Fetch in components
- Hardcode data
- Call APIs
- Create custom data structures
- Use incorrect data structure paths (verify with actual mock data)

---

## Testing Requirements

### Before Merge
- [ ] npm run build (passes, 0 errors)
- [ ] npx tsc --noEmit --strict (0 errors)
- [ ] Test responsive at 375, 768, 1440px
- [ ] Test light and dark modes
- [ ] Test keyboard navigation
- [ ] Test all filter combinations
- [ ] Verify no console errors
- [ ] Verify no hardcoded colors
- [ ] Verify all mocks used correctly
- [ ] Check contrast ratios (both modes)

---

## Acceptance Criteria

### MUST HAVE (Blocking)
- [ ] Builds with zero errors
- [ ] TypeScript strict mode: 0 errors
- [ ] Uses only approved 12 components
- [ ] No custom components
- [ ] No hardcoded data
- [ ] No API calls
- [ ] No hardcoded colors (UBITS tokens only)
- [ ] Responsive at 375, 768, 1440px
- [ ] No horizontal scroll
- [ ] Dark mode fully functional
- [ ] Contrast >= 4.5:1 in both modes
- [ ] Keyboard navigation works
- [ ] All filter states shareable via URL
- [ ] All loading/empty/error states implemented
- [ ] Matches component map exactly

### SHOULD HAVE (Highly Desired)
- [ ] Tests pass (if tests exist)
- [ ] No ESLint warnings
- [ ] Descriptive variable names
- [ ] Code follows project conventions
- [ ] Documentation for complex sections
- [ ] Performance baseline established

### NICE TO HAVE (Optional)
- [ ] Visual regression test screenshots
- [ ] Storybook stories for sections
- [ ] Component composition examples

---

## Escalation Rules

**STOP and escalate if:**

1. **Component not available**
   - ❌ Can't find component in src/components/
   - ✅ Check FIRST_SCREEN_COMPONENT_DECISION_GATE.md
   - ✅ Verify it exists and is approved
   - ✅ If not, escalate immediately

2. **Mock data doesn't match**
   - ❌ Data shape doesn't fit components
   - ✅ Check FIRST_SCREEN_MOCK_DATA_MAP.md
   - ✅ Verify structure matches
   - ✅ If not, escalate immediately

3. **Need a variant**
   - ❌ Component exists but needs different behavior
   - ✅ Document as "Phase 8.5 request"
   - ✅ Use existing component as-is for Phase 8.4
   - ✅ DON'T modify existing components

4. **Need a new component**
   - ❌ No approved component available
   - ✅ Check component map
   - ✅ Document as "Phase 8.5 request"
   - ✅ DON'T create custom component
   - ✅ Escalate immediately

5. **API integration needed**
   - ❌ Want to connect real API now
   - ✅ Use mock layer (Phase 8.1 already done)
   - ✅ Document as "Phase 9.0 task"
   - ✅ Phase 8 is mock-only by design

---

## Phase 8.4 Success Definition

✅ **Phase 8.4 is COMPLETE when:**

1. Survey Analytics Dashboard file created
2. All 7 sections implemented with approved components
3. Build passes: `npm run build` (0 errors)
4. TypeScript passes: `npx tsc --noEmit --strict` (0 errors)
5. Responsive tested at 375, 768, 1440px (no scroll)
6. Dark mode fully functional and tested
7. Keyboard navigation fully functional
8. All filters update URL and are shareable
9. All 3 states (loading/empty/loaded) implemented
10. QA checklist passed (FIRST_SCREEN_QA_PLAN.md)
11. Code review passed
12. Ready for merge

---

## Reference Documents

**Read before starting:**
1. ✅ docs/ANTIGRAVITY.md — Governance framework
2. ✅ docs/FIRST_SCREEN_INTAKE.md — Requirements
3. ✅ docs/FIRST_SCREEN_COMPONENT_DECISION_GATE.md — Approved components
4. ✅ docs/FIRST_SCREEN_COMPONENT_MAP.md — Layout design
5. ✅ docs/FIRST_SCREEN_MOCK_DATA_MAP.md — Data bindings
6. ✅ docs/FIRST_SCREEN_QA_PLAN.md — Testing strategy
7. ✅ docs/DASHBOARD_SHELL_PATTERNS.md — Layout patterns
8. ✅ docs/DASHBOARD_LAYOUT_RECIPES.md — Responsive recipes
9. ✅ docs/DASHBOARD_STATE_PATTERNS.md — State handling
10. ✅ docs/DESIGN.md — UBITS design system

---

## Phase Progression

```
Phase 8.3: Decision Gate ✅ COMPLETE
    ↓
Phase 8.4: Build First Screen ← YOU ARE HERE
    ├─ Build Survey Analytics Dashboard
    ├─ Run full QA suite
    ├─ Get code review approval
    └─ Merge to main
    ↓
Phase 8.5: Build Second Screen
    ├─ Select second dashboard
    ├─ Repeat 8.3-8.4
    └─ Merge to main
    ↓
Phase 9.0: API Integration (Future)
    └─ Connect real APIs (not Phase 8)
```

---

## Important Reminders

### Remember
✅ This is the first real screen — validate patterns  
✅ Use mock layer — Phase 8 is mock-only  
✅ Library components only — no custom code  
✅ All data via props — no component fetching  
✅ UBITS tokens only — no hardcoded colors  
✅ Responsive from start — test at 3 breakpoints  
✅ Dark mode complete — not an afterthought  
✅ Accessibility first — WCAG 2.1 AA mandatory  

### Don't
❌ Create custom components  
❌ Hardcode data  
❌ Call APIs  
❌ Add dependencies  
❌ Use hardcoded colors  
❌ Ignore dark mode  
❌ Skip accessibility  
❌ Build without QA  

---

## Final Checklist Before Starting

### Governance Documents (UPDATED via Hotfix 8.3.1)
- [ ] I have read FIRST_SCREEN_COMPONENT_DECISION_GATE.md (ACTUAL component APIs verified)
- [ ] I have read FIRST_SCREEN_COMPONENT_MAP.md (ACTUAL prop bindings)
- [ ] I have read FIRST_SCREEN_MOCK_DATA_MAP.md (ACTUAL DashboardData structure)
- [ ] I understand the difference between documented (INCORRECT) and actual (CORRECT) APIs
- [ ] I have verified component imports from correct paths (e.g., PageHeader from @/components/utility)
- [ ] I have verified mock data types in src/mocks/types.ts (MetricData[], distribution.segments[], timeSeries[])

### Implementation Requirements (ACTUAL)
- [ ] I understand metrics is MetricData[] array, NOT { nps, csat, effort, responseCount }
- [ ] I understand distribution has segments[] array nested inside, NOT separate promoters/passives/detractors props
- [ ] I understand DateFilterBar uses Date objects, NOT ISO date strings
- [ ] I understand timeSeries contains ALL trend data (participation, nps, csat, effort)
- [ ] I understand no separate data.participation or data.trends properties
- [ ] I understand Card exports are separate named exports (CardHeader, CardContent), NOT compound syntax

### Design & UX
- [ ] I have read FIRST_SCREEN_INTAKE.md (requirements)
- [ ] I have read DASHBOARD_SHELL_PATTERNS.md (layout patterns)
- [ ] I have read DASHBOARD_LAYOUT_RECIPES.md (responsive recipes)
- [ ] I have read DASHBOARD_STATE_PATTERNS.md (state handling)

### Constraints & Standards
- [ ] I understand the 10 mandatory constraints
- [ ] I understand no custom components are allowed
- [ ] I understand no API calls are allowed
- [ ] I understand all data comes from mocks
- [ ] I understand UBITS tokens only (no hardcoded colors)
- [ ] I understand URL state for filters
- [ ] I understand the file is located at src/screens/SurveyAnalyticsDashboard.tsx

### Testing & QA
- [ ] I understand I must test responsive at 375/768/1440px
- [ ] I understand I must support dark mode
- [ ] I understand I must meet WCAG 2.1 AA
- [ ] I understand the acceptance criteria
- [ ] I understand escalation rules
- [ ] I have read FIRST_SCREEN_QA_PLAN.md (testing strategy)

### Ready to Build
- [ ] All documents read and understood
- [ ] Actual APIs verified in src/components/ and src/mocks/types.ts
- [ ] No questions on data structure or component props
- [ ] I am ready to build with ACTUAL APIs

---

## Hotfix 8.3.1 - API Corrections Applied

**This document supersedes previous Phase 8.3 documentation.**

**Critical corrections implemented:**
1. ✅ Component props updated to match actual implementations
2. ✅ Data structure paths corrected (metrics[], distribution.segments[], timeSeries[])
3. ✅ Date object handling clarified (NOT ISO strings)
4. ✅ Import paths corrected (PageHeader from @/components/utility, not @/components/layout)
5. ✅ Mock data structure documented correctly

**If you find a prop or structure that doesn't match below, DO NOT assume the documentation is wrong — VERIFY in src/components/ and src/mocks/types.ts first.**

---

**Status:** ⚠️ HOTFIX 8.3.1 COMPLETE → READY FOR PHASE 8.4  
**Estimated Build Duration:** 4-6 hours  
**Estimated QA Duration:** 2-4 hours  
**Total Phase 8.4:** ~6-10 hours  

**Updated:** 2026-05-05 (Hotfix 8.3.1)  
**Authority:** This document (with FIRST_SCREEN_COMPONENT_MAP.md and FIRST_SCREEN_MOCK_DATA_MAP.md) is the source of truth for Phase 8.4
