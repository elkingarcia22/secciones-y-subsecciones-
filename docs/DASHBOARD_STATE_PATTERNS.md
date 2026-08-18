# Dashboard State Patterns · Fase 8.2

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.2 (Dashboard Shell Patterns)  
**Type:** Interaction & State Design

---

## Executive Summary

State patterns define how dashboards behave in different data conditions: loading, empty, error, partial data, and special cases. This document ensures consistent user experience across all dashboard variations.

**Core principle:** Every data-displaying section must handle all possible states gracefully. No blank screens, no broken layouts, no silent failures.

---

## Universal State Requirement

Every dashboard section that displays data must support **all 5 states:**

1. **Loading** — Fetching data
2. **Loaded** — Data available
3. **Empty** — No data (user action needed)
4. **Error** — Fetch failed (recoverable)
5. **Partial** — Some sections loaded, others loading

❌ **Forbidden:** Assuming data is always available and immediately ready.

---

## State 1: Loading

### Purpose
Show that data is being fetched without making the user think the page is broken.

### Components to Use

#### Skeleton Components
```typescript
import { Skeleton } from '@/components/ui/skeleton'

// For metric cards
<div className="grid gap-6 grid-cols-1 md:grid-cols-4">
  <Skeleton className="h-24 rounded-lg" />
  <Skeleton className="h-24 rounded-lg" />
  <Skeleton className="h-24 rounded-lg" />
  <Skeleton className="h-24 rounded-lg" />
</div>

// For charts
<Skeleton className="h-96 rounded-lg w-full" />

// For text content
<div className="space-y-2">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

### Pattern

```
Display when:
- isLoading === true
- data === null or undefined
- fetchInProgress === true

Skeleton must match:
- Expected content height
- Expected content width
- Expected grid layout (maintain layout during load)
```

### Rules

✅ **DO:**
- Show skeleton matching content size
- Keep layout stable (no shift when loaded)
- Show progress indicator (optional: spinner)
- Prevent user interaction during load

❌ **DON'T:**
- Show blank space
- Show generic "Loading..." text
- Let layout shift when skeleton → content
- Display previous stale data

### Example: Full Section Loading

```tsx
function MetricSection({ data, isLoading }) {
  if (isLoading) {
    return (
      <section>
        <h2 className="text-2xl font-bold mb-6">Key Metrics</h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </section>
    )
  }
  
  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">Key Metrics</h2>
      <MetricGrid metrics={data.metrics} />
    </section>
  )
}
```

### Accessibility
- **Screen reader:** Announce "Loading" or "Content is loading"
- **Focus:** Keep focus on trigger button during load
- **Keyboard:** Disable interactive elements during load (optional)

```html
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>
```

---

## State 2: Loaded

### Purpose
Display actual data with all expected information.

### Components to Use
- `SurveyMetricCard`, `BarChart`, `LineChart`, etc.
- Standard library components with data passed as props

### Pattern

```
Display when:
- isLoading === false
- data !== null && data.length > 0 (if array)
- error === null
```

### Rules

✅ **DO:**
- Show all component data
- Display complete information
- Make interactive elements functional
- Show legend/labels for charts

❌ **DON'T:**
- Hardcode any data
- Hide parts of the UI
- Show loading state indicators

### Example

```tsx
function MetricSection({ data, isLoading }) {
  if (isLoading) return <LoadingState />
  
  return (
    <section className="grid gap-6 grid-cols-1 md:grid-cols-4">
      {data.metrics.map(metric => (
        <SurveyMetricCard
          key={metric.id}
          label={metric.label}
          value={metric.value}
          previousValue={metric.previousValue}
          delta={metric.delta}
          trend={metric.trend}
        />
      ))}
    </section>
  )
}
```

### Accessibility
- **Semantic HTML:** Use proper headings, sections, landmarks
- **ARIA labels:** On charts and complex components
- **Keyboard:** All interactive elements reachable via Tab

---

## State 3: Empty

### Purpose
Inform user that no data exists and suggest next action.

### Components to Use

#### EmptyState Component
```typescript
import { EmptyState } from '@/components/ui/empty-state'

<EmptyState
  title="No responses yet"
  description="Surveys will appear here once you have submissions"
  icon="inbox"
  action={{
    label: "Create first survey",
    onClick: handleCreateSurvey
  }}
/>
```

### Pattern

```
Display when:
- isLoading === false
- data !== null
- data.length === 0 (or data is empty object)
- error === null
```

### Rules

✅ **DO:**
- Show clear message (avoid jargon)
- Provide icon (visual context)
- Suggest next action (CTA)
- Show subtext (explanation)

❌ **DON'T:**
- Show blank space
- Show generic "No data" text
- Hide the entire section
- Make user guess what to do

### Example by Type

#### Empty Analytics Dashboard
```
┌─────────────────────────────────┐
│   📊 No Survey Data              │
│                                 │
│   Surveys will appear here once  │
│   responses are received         │
│                                 │
│   [Start First Survey]           │
└─────────────────────────────────┘
```

#### Empty Response List
```
┌─────────────────────────────────┐
│   📭 No Responses Yet            │
│                                 │
│   No responses collected for     │
│   the selected date range        │
│                                 │
│   [Adjust Filters] [Create]      │
└─────────────────────────────────┘
```

#### Empty Search Results
```
┌─────────────────────────────────┐
│   🔍 No Results Found           │
│                                 │
│   No items match "xyz"          │
│                                 │
│   [Clear Search] [View All]     │
└─────────────────────────────────┘
```

### Variations

**Empty due to filter:** User filtered too strictly
```
Message: "No items match your filters"
Action: "Clear filters" or "Adjust criteria"
```

**Empty due to time period:** No data in selected date range
```
Message: "No data for [date range]"
Action: "Select different dates" or "View all data"
```

**Empty (new user):** First time in this section
```
Message: "Start by creating your first [item]"
Action: "Create [item]" button
```

### Accessibility
- **Screen reader:** "No data available" announcement
- **Focus:** Set focus to CTA (call-to-action) button
- **Keyboard:** CTA is activatable via Enter

```html
<div role="status" aria-live="assertive">
  <EmptyState title="No data" />
</div>
```

---

## State 4: Error

### Purpose
Communicate that something failed and offer recovery options.

### Components to Use

#### Alert Component
```typescript
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Failed to load data</AlertTitle>
  <AlertDescription>
    Could not fetch metrics. Please try again later or contact support.
  </AlertDescription>
</Alert>

<!-- With action button -->
<Alert variant="destructive">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Connection error</AlertTitle>
  <AlertDescription>
    Unable to fetch survey data. <button onClick={retry}>Try again</button>
  </AlertDescription>
</Alert>
```

### Pattern

```
Display when:
- isLoading === false
- error !== null && error !== undefined
```

### Rules

✅ **DO:**
- Show specific error message (not generic)
- Provide "Retry" button
- Suggest recovery steps
- Show error code (for debugging)

❌ **DON'T:**
- Show technical error messages to users
- Hide the entire section
- Force page reload
- Show error without recovery option

### Example Error Messages

**Generic Network Error:**
```
Title: "Connection Failed"
Message: "Unable to load data. Check your connection and try again."
Action: "Retry" button
```

**Timeout Error:**
```
Title: "Request Timed Out"
Message: "The request took too long. Please try again."
Action: "Retry" button
```

**Permission Error:**
```
Title: "Access Denied"
Message: "You don't have permission to view this data."
Action: "Contact administrator" link
```

**Data Error:**
```
Title: "Invalid Data"
Message: "The server returned invalid data. Please try again."
Action: "Retry" button
```

### Recovery Options

```typescript
// Option 1: Inline Retry
<Alert>
  <AlertDescription>
    Failed to load. <button onClick={() => fetchData()}>Retry</button>
  </AlertDescription>
</Alert>

// Option 2: Alert with Button Below
<Alert variant="destructive">
  <AlertTitle>Failed to load metrics</AlertTitle>
  <AlertDescription>Please try again.</AlertDescription>
  <button className="mt-4" onClick={retry}>Retry</button>
</Alert>

// Option 3: Auto-Retry with Countdown
<Alert>
  <AlertTitle>Connection lost</AlertTitle>
  <AlertDescription>
    Retrying in {countdown} seconds...
  </AlertDescription>
</Alert>
```

### Accessibility
- **Alert role:** `role="alert"` for immediate announcements
- **Error details:** Provided in `AlertDescription`
- **Keyboard:** Retry button is focusable and activatable

```html
<div role="alert">
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>Failed to load. <button>Retry</button></AlertDescription>
  </Alert>
</div>
```

---

## State 5: Partial Data

### Purpose
Show what's available while acknowledging what's still loading.

### Pattern

```
Display when:
- Some sections have data, others are loading
- Sections load at different times
- User interaction happens before all data loaded
```

### Example: Survey Dashboard Loading Progressively

```
Time 0s:
┌────────────┐
│ Header     │
├────────────┤
│ Filter Bar │
├────────────┤
│ [Skeleton] │ (KPI cards loading)
│ [Skeleton] │
├────────────┤
│ [Skeleton] │ (Distribution loading)
├────────────┤
│ [Skeleton] │ (Timeline loading)
└────────────┘

Time 1s:
┌────────────┐
│ Header     │
├────────────┤
│ Filter Bar │
├────────────┤
│ [KPI 1]    │ (KPI section loaded)
│ [KPI 2]    │
├────────────┤
│ [Skeleton] │ (Distribution still loading)
├────────────┤
│ [Skeleton] │ (Timeline still loading)
└────────────┘

Time 2s:
┌────────────┐
│ Header     │
├────────────┤
│ Filter Bar │
├────────────┤
│ [KPI 1]    │
│ [KPI 2]    │
├────────────┤
│ [Chart]    │ (Distribution loaded)
├────────────┤
│ [Skeleton] │ (Timeline still loading)
└────────────┘

Time 3s:
┌────────────┐
│ (Complete) │
└────────────┘
```

### Rules

✅ **DO:**
- Load sections independently
- Show each section skeleton
- Allow user to see content as it arrives
- Show progress (optional)

❌ **DON'T:**
- Block entire dashboard on one section
- Hide sections until all data ready
- Show stale data mixed with loading

### Implementation Pattern

```typescript
// Each section manages its own loading state
function Dashboard() {
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [distributionLoading, setDistributionLoading] = useState(true)
  const [timelineLoading, setTimelineLoading] = useState(true)
  
  // Sections load independently
  useEffect(() => {
    fetchMetrics().then(() => setMetricsLoading(false))
  }, [filters])
  
  useEffect(() => {
    fetchDistribution().then(() => setDistributionLoading(false))
  }, [filters])
  
  useEffect(() => {
    fetchTimeline().then(() => setTimelineLoading(false))
  }, [filters])
  
  return (
    <div className="space-y-8">
      <MetricSection loading={metricsLoading} />
      <DistributionSection loading={distributionLoading} />
      <TimelineSection loading={timelineLoading} />
    </div>
  )
}
```

---

## State 6: Filtered Empty

### Purpose
Show that filters are applied but no results match criteria.

### Pattern

```
Display when:
- Filters are active
- data.length === 0
- Error is null (filters are valid, just no results)
```

### Example

```
┌─────────────────────────────────┐
│ 🔍 No matching data             │
│                                 │
│ Your filters for:              │
│ • Date: May 1-5                │
│ • Segment: EMEA                │
│ • Status: Pending              │
│                                 │
│ No items found. Try:           │
│ [Clear filters] [Adjust dates] │
└─────────────────────────────────┘
```

### Rules

✅ **DO:**
- Show which filters are active
- Suggest clearing filters
- Provide alternative actions
- Make it clear this is not an error

❌ **DON'T:**
- Show as an error
- Hide the filter controls
- Suggest invalid filters

---

## State 7: Permission / Blocked (Concept Only)

### Purpose
Inform user that data exists but they lack permission.

### Note
This is a **future pattern** for Phase 8.4+. Phase 8.2 mock data doesn't require real authentication, so this is documented for reference only.

### Pattern (Conceptual)

```
Display when:
- error.code === 'PERMISSION_DENIED'
- User lacks access (future auth system)
```

### Example

```
┌─────────────────────────────────┐
│ 🔒 Access Restricted            │
│                                 │
│ You don't have permission to    │
│ view this dashboard.            │
│                                 │
│ [Request Access] [Go Back]      │
└─────────────────────────────────┘
```

### For Phase 8.2
- Mock data: assume all users have access
- Show this pattern in documentation for Phase 9+
- No implementation in Phase 8.2

---

## State 8: Stale Data (Concept Only)

### Purpose
Inform user that cached data might be old.

### Note
This is a **future pattern** for Phase 8.4+. Phase 8.2 uses fresh mock data, so this is documented for reference only.

### Pattern (Conceptual)

```
Display when:
- data was cached > 5 minutes ago
- Real API is connected
- Feature flag enabled for stale-while-revalidate
```

### Example

```
┌─────────────────────────────────┐
│ Data from 2 hours ago           │
│ [Refresh to get latest] [OK]    │
└─────────────────────────────────┘
```

### For Phase 8.2
- Mock data is always "fresh"
- Document this for Phase 9+ (real APIs)
- No implementation needed

---

## State Transition Rules

### Rule 1: Prevent Flash Flicker

**Problem:**
```
User clicks filter
→ State: Loading
→ Immediately: Loaded (very fast)
→ Screen flickers

Result: Poor UX
```

**Solution:**
```
Add artificial delay to mock layer (optional):
- Minimum 300ms loading state
- Prevents flickering
- More realistic for real API

Or:
- Show skeleton only if loading > 100ms
```

### Rule 2: Maintain Layout During State Change

**Problem:**
```
Loading state: 4 skeleton cards
Loaded state: 3 data cards (different grid)
Layout shifts down

Result: Jarring experience
```

**Solution:**
```
// Match skeleton to expected layout
<div className="grid gap-6 grid-cols-1 md:grid-cols-4">
  {isLoading ? (
    // 4 skeletons
    [1,2,3,4].map(i => <Skeleton key={i} />)
  ) : (
    // 4 cards from data
    data.metrics.map(m => <Card key={m.id} />)
  )}
</div>
```

### Rule 3: Error Recovery

**Pattern:**
```
1. Show error alert
2. Offer "Retry" button
3. On retry: show loading state again
4. On success: show loaded state
5. On error again: show different error (or contact support)
```

---

## State Checklist for Developers

Before implementing a dashboard section:

### Loading State
- [ ] Skeleton matches content dimensions
- [ ] Grid/layout maintained
- [ ] Animated (subtle pulse or wave)
- [ ] No interactive elements

### Loaded State
- [ ] All data displayed
- [ ] Interactive elements enabled
- [ ] Responsive verified
- [ ] Dark mode verified

### Empty State
- [ ] Clear message
- [ ] Icon or illustration
- [ ] CTA button present
- [ ] No confusing technical terms

### Error State
- [ ] Specific error message
- [ ] Retry button
- [ ] Recoverable (not fatal)
- [ ] No sensitive error details

### Partial Data
- [ ] Sections load independently
- [ ] Each section has loading state
- [ ] No blocking of ready content
- [ ] Progress visible

---

## Accessibility Checklist

For every state:

- [ ] **Loading:**
  - `aria-busy="true"` on loading container
  - `aria-live="polite"` for status updates
  - Focus management (disable inputs)

- [ ] **Loaded:**
  - Semantic HTML
  - Proper heading hierarchy
  - ARIA labels on complex components

- [ ] **Empty:**
  - Status announcement
  - Focus to CTA button
  - Clear, concise message

- [ ] **Error:**
  - `role="alert"` for error container
  - Announce error immediately
  - Suggest recovery

---

**Status:** ✅ PATTERNS DEFINED  
**Type:** Interaction Design  
**Use In:** Phase 8.2+ (all dashboards)

Generated: 2026-05-05
