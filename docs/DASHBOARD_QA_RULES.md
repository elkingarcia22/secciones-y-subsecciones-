# Dashboard QA Rules & Validation Checklist

**Phase**: Fase 8.2 · Dashboard Shell Patterns  
**Purpose**: Comprehensive quality assurance guidance for all dashboard builds  
**Scope**: Technical validation, design system compliance, accessibility, responsive design, performance  
**Authority**: Phase 8 Governance (DASHBOARD_ARCHITECTURE.md, SCREEN_BUILD_RULES.md)

---

## Executive Summary

Dashboard builds must pass a multi-tier quality gate before code review:
1. **Technical QA** — build, TypeScript, dependencies (no npm changes)
2. **Design System** — UBITS tokens, semantic colors, no hardcoded hex
3. **Accessibility** — WCAG 2.1 AA (4.5:1 contrast), keyboard nav, ARIA labels
4. **Responsive** — 375px (mobile) → 768px (tablet) → 1440px (desktop)
5. **Data Layer** — mock data only, no API calls, no hardcoded strings
6. **Performance** — LCP < 2.5s, INP < 200ms, no layout thrash

Checklists are **blocking**: all CRITICAL items must pass before merge.

---

## 1. Technical QA Checklist

### 1.1 Build & Compilation

**CRITICAL:**
- [ ] `npm run build` exits with code 0 (no errors)
- [ ] TypeScript compilation: zero errors (`tsc --noEmit`)
- [ ] No `any` types in new code (strict mode)
- [ ] No `@ts-ignore` comments (escalate before use)
- [ ] No unused imports or variables

**Enforcement:**
```bash
# Run before commit
npm run build
tsc --noEmit --pretty false
```

**What fails:**
- Build errors → immediate blocking
- Type errors → must fix, no workarounds
- Unused code → must remove or fix import path

---

### 1.2 Dependency Management

**CRITICAL:**
- [ ] No new dependencies added to package.json (Phase 8.2 only)
- [ ] No version changes to existing dependencies
- [ ] No peer dependency mismatches
- [ ] package-lock.json unchanged (except auto-format)

**Why it matters:**
New dependencies require Phase 8.4+ governance review. Dashboard shells use only:
- React, TypeScript (existing)
- Tailwind CSS (existing)
- shadcn/ui components (existing)
- ECharts (existing, if chart shells only)

**Enforcement:**
```bash
# Before committing, verify:
git diff package.json
git diff package-lock.json
# Must show no changes or only formatting
```

---

### 1.3 Component Imports

**CRITICAL:**
- [ ] All imports from `src/components/ui/` (shadcn)
- [ ] All imports from `src/components/charts/` (if charts only)
- [ ] No imports from `src/components/` without `/ui/` or `/charts/`
- [ ] No custom component files created in Phase 8.2

**Allowed imports:**
```typescript
// ✓ ALLOWED (existing library components)
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart } from '@/components/charts'

// ✗ BLOCKED (custom, not allowed in Phase 8.2)
import { SurveyMetricCard } from '@/components/survey-analytics'
import { CustomCard } from '@/components/custom'
```

---

## 2. Design System Compliance

### 2.1 Color Tokens (UBITS)

**CRITICAL:**
- [ ] Zero hardcoded hex values (`#abc123`)
- [ ] Zero hardcoded RGB values (`rgb(123, 45, 67)`)
- [ ] All colors use CSS custom properties from `src/styles/tokens.css`
- [ ] Light/dark mode tokens applied correctly

**Token enforcement:**
```css
/* ✓ CORRECT - uses token */
.card {
  background-color: var(--color-card);
  color: var(--color-text);
  border-color: var(--color-border);
}

/* ✗ BLOCKED - hardcoded hex */
.card {
  background-color: #ffffff;  /* AUDIT FAIL */
  color: #1a1a1a;
}
```

**Validation:**
```bash
# Search for hardcoded colors
grep -r '#[0-9a-fA-F]\{3,6\}' src/
grep -r 'rgb(' src/
# Must return only in comments or design system definitions
```

**Light/Dark Mode Check:**
- [ ] Test in light mode (matches light theme palette)
- [ ] Test in dark mode (matches dark theme palette)
- [ ] No color that's only readable in one mode
- [ ] Contrast ratio 4.5:1 minimum in both modes

---

### 2.2 Spacing & Layout Tokens

**CRITICAL:**
- [ ] Use Tailwind spacing classes only (`space-y-6`, `gap-4`, `px-6`)
- [ ] No inline `style={{ padding: '24px' }}`
- [ ] No hardcoded pixel values in CSS
- [ ] Grid uses semantic Tailwind (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)

**Correct usage:**
```tsx
// ✓ CORRECT - Tailwind tokens
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  <Card className="min-h-24">...</Card>
</div>

<section className="space-y-8 py-8 px-6">
  ...
</section>

// ✗ BLOCKED - hardcoded pixels
<div style={{ padding: '24px', marginBottom: '32px' }}>
<div style={{ width: '360px' }}>
```

**Validation:**
```bash
# Search for inline style pixels
grep -r "style=.*[0-9]px" src/
# Must return zero results
```

---

### 2.3 Typography

**CRITICAL:**
- [ ] Heading hierarchy: `<h1>` for page title, `<h2>` for sections, `<h3>` for subsections
- [ ] Use semantic typography classes (`text-lg`, `font-semibold`, `leading-tight`)
- [ ] No hardcoded font-size or font-weight
- [ ] Font stack from global tokens only

**Allowed:**
```tsx
// ✓ CORRECT - semantic Tailwind
<h1 className="text-3xl font-bold leading-tight">Dashboard Title</h1>
<h2 className="text-lg font-semibold">Section Header</h2>
<p className="text-sm text-muted-foreground">Description</p>

// ✗ BLOCKED - hardcoded sizes
<div style={{ fontSize: '24px', fontWeight: 'bold' }}>Title</div>
<span style={{ fontSize: '12px' }}>Text</span>
```

---

### 2.4 Shadows & Elevation

**CRITICAL:**
- [ ] Use Tailwind shadow utilities (`shadow`, `shadow-md`, `shadow-lg`)
- [ ] No hardcoded `box-shadow` values
- [ ] Card elevation matches design system (`shadow-sm` for subtle, `shadow-md` for emphasis)

```tsx
// ✓ CORRECT
<Card className="shadow-sm">...</Card>
<div className="shadow-md">...</div>

// ✗ BLOCKED
<div style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
```

---

## 3. Accessibility Validation

### 3.1 WCAG 2.1 AA Compliance

**CRITICAL:**
- [ ] Contrast ratio 4.5:1 for all text (normal weight or larger)
- [ ] Contrast ratio 3:1 for large text (18pt+ or 14pt+ bold)
- [ ] Test with Axe DevTools or Pa11y
- [ ] No color used as sole method of information conveyance

**Validation:**
```bash
# Use browser DevTools → Lighthouse → Accessibility
# Or install: npm install -D @axe-core/react
# Must show 0 contrast violations
```

**Example failure:**
```
❌ FAIL: text-gray-400 (#9ca3af) on bg-gray-50 (#f9fafb)
   Contrast ratio: 3.2:1 (needs 4.5:1)
   Fix: Use text-gray-600 (#4b5563) for 4.85:1
```

---

### 3.2 Semantic HTML

**CRITICAL:**
- [ ] Use semantic tags: `<main>`, `<section>`, `<article>`, `<aside>`, `<header>`, `<footer>`
- [ ] `<section>` has `aria-labelledby` pointing to heading `id`
- [ ] Form inputs have associated `<label>` elements
- [ ] No layout divs where semantics fit

**Correct structure:**
```tsx
// ✓ CORRECT - semantic shells
<div className="min-h-screen bg-background">
  <Header />
  
  <main className="max-w-7xl mx-auto px-6 py-8">
    <section aria-labelledby="metrics-title" className="mb-8">
      <h2 id="metrics-title" className="text-2xl font-bold mb-6">Key Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* metric cards */}
      </div>
    </section>
    
    <section aria-labelledby="distribution-title" className="mb-8">
      <h2 id="distribution-title" className="text-2xl font-bold mb-6">Distribution</h2>
      {/* distribution content */}
    </section>
  </main>
  
  <footer className="border-t bg-card py-6 px-6">
    {/* footer content */}
  </footer>
</div>

// ✗ BLOCKED - no semantics
<div>
  <div className="flex items-center"><!-- header --></div>
  <div className="flex-1">
    <div className="p-6">
      <div className="font-bold text-2xl">Key Metrics</div>
      <div className="grid">
        {/* cards */}
      </div>
    </div>
  </div>
</div>
```

---

### 3.3 ARIA Labels & Roles

**CRITICAL:**
- [ ] Interactive elements have `aria-label` or visible label
- [ ] Buttons have descriptive text (`aria-label="Close menu"` if icon-only)
- [ ] Loading states: `aria-busy="true"`, `aria-live="polite"`
- [ ] Error alerts: `role="alert"`, `aria-live="assertive"`
- [ ] Tables have `<thead>` and row headers

**Examples:**
```tsx
// ✓ CORRECT - aria labels
<button 
  onClick={handleClose}
  aria-label="Close dialog"
  className="p-2"
>
  <X className="w-4 h-4" />
</button>

<div aria-busy="true" aria-live="polite">
  <Skeleton className="h-24 rounded-lg" />
</div>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Failed to load metrics</AlertDescription>
</Alert>

// ✗ BLOCKED - no labels
<button onClick={handleClose} className="p-2">
  <X className="w-4 h-4" />
</button>

<div>
  <Skeleton className="h-24 rounded-lg" />
</div>
```

---

### 3.4 Keyboard Navigation

**CRITICAL:**
- [ ] All interactive elements focusable (Tab order logical)
- [ ] Focus outline visible (not removed with `outline-none`)
- [ ] No keyboard trap (can Escape or Tab out of any element)
- [ ] Dropdown/menu can open with Enter/Space and close with Escape

**Test procedure:**
1. Remove mouse
2. Press Tab → navigate through all elements
3. Press Shift+Tab → reverse navigation
4. Verify focus outline visible on every element
5. Press Escape in modals/menus → closes correctly

**Failure examples:**
```tsx
// ✗ BLOCKED - focus hidden
<button className="outline-none focus:outline-none">
  Click me
</button>

// ✓ CORRECT - focus visible
<button className="focus:outline-2 focus:outline-offset-2 focus:outline-primary">
  Click me
</button>
```

---

## 4. Responsive Design Validation

### 4.1 Mobile-First Breakpoints

**CRITICAL:**
- [ ] 375px (mobile): single column, full width
- [ ] 768px (tablet): two columns where applicable
- [ ] 1024px (desktop): three or four columns
- [ ] 1440px (large desktop): full layout with max-w-7xl container
- [ ] No horizontal scroll at any viewport

**Grid pattern enforcement:**
```tsx
// ✓ CORRECT - mobile-first responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* 1 column mobile, 2 tablet, 4 desktop */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* granular breakpoint control */}
</div>

// ✗ BLOCKED - desktop-first (wrong direction)
<div className="grid grid-cols-4 sm:grid-cols-2 xs:grid-cols-1 gap-6">
```

**Validation:**
```bash
# Test at 375px, 768px, 1024px, 1440px in DevTools
# Chrome → F12 → Toggle device toolbar → select presets
# Verify:
# - No horizontal scroll
# - Text readable without zoom
# - Images scale appropriately
# - Spacing adjusts per breakpoint
```

---

### 4.2 Container Queries & Max-Width

**CRITICAL:**
- [ ] Desktop shell container: `max-w-7xl` (1280px)
- [ ] Padding desktop: `px-6` or `px-8`
- [ ] Padding mobile: `px-4` or `px-6`
- [ ] Center with `mx-auto`

**Correct:**
```tsx
// ✓ CORRECT - responsive container
<main className="max-w-7xl mx-auto px-6 py-8">
  <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* content scales within max-w-7xl */}
  </section>
</main>

// ✗ BLOCKED - no max-width (full width bleed)
<main className="px-6">
  {/* stretches edge-to-edge on 2560px monitor */}
</main>
```

---

### 4.3 Image Scaling

**CRITICAL:**
- [ ] Images have explicit `width` and `height` attributes
- [ ] Images use `object-cover` or `object-contain` for scaling
- [ ] No `style={{ width: '100%', height: 'auto' }}`
- [ ] Responsive images use `srcSet` for multiple sizes

**Correct:**
```tsx
// ✓ CORRECT - explicit dimensions
<img
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  className="w-full h-auto object-cover rounded-lg"
/>

// ✗ BLOCKED - no dimensions
<img src="/image.jpg" alt="Description" style={{ width: '100%' }} />
```

---

### 4.4 Touch Targets & Spacing

**CRITICAL:**
- [ ] Interactive elements minimum 44x44px (mobile)
- [ ] Padding between touch targets minimum 8px
- [ ] Buttons use consistent sizing (`px-4 py-2`, `px-6 py-3`)
- [ ] No hover-only interactions (mobile users can't hover)

**Correct:**
```tsx
// ✓ CORRECT - 44px minimum button
<button className="px-4 py-2 min-h-11 min-w-11 rounded-lg">
  {/* at least 44x44px */}
</button>

// ✗ BLOCKED - too small
<button className="px-2 py-1">Click</button>
```

---

## 5. Light & Dark Mode Validation

### 5.1 Theme Switching

**CRITICAL:**
- [ ] Test page in light mode (default)
- [ ] Test page in dark mode (toggle via theme switcher or DevTools)
- [ ] All text readable in both modes
- [ ] Contrast maintained in both modes
- [ ] Images have appropriate backgrounds in both modes

**How to test:**
1. Open DevTools → Inspector
2. `document.documentElement.classList.add('dark')` (force dark)
3. Verify contrast, readability, background colors
4. Remove class: `document.documentElement.classList.remove('dark')`
5. Verify light mode works

---

### 5.2 Token Inheritance

**CRITICAL:**
- [ ] No hardcoded light-specific or dark-specific colors
- [ ] All colors from `--color-*` tokens
- [ ] Text colors use `text-foreground` (auto-inverts with theme)
- [ ] Background colors use `bg-background` or `bg-card`
- [ ] Borders use `border-border`

**Correct:**
```tsx
// ✓ CORRECT - theme-aware tokens
<div className="bg-card border border-border rounded-lg p-6">
  <h3 className="text-foreground font-semibold">Title</h3>
  <p className="text-muted-foreground">Subtitle</p>
</div>

// ✗ BLOCKED - light-specific hardcoding
<div style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}>
  {/* white bg + dark text fails in dark mode */}
</div>
```

---

## 6. Mock Data Validation

### 6.1 Data Layer Enforcement

**CRITICAL:**
- [ ] All data from `src/mocks/` functions (not hardcoded)
- [ ] No API calls in components (no `fetch`, no `axios`)
- [ ] No `const data = [...]` in component files
- [ ] Data flows through props from parent container

**Correct pattern:**
```typescript
// src/pages/SurveyDashboard.tsx (container)
import { getMockSurveyDashboardData } from '@/mocks'

export function SurveyDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  
  useEffect(() => {
    getMockSurveyDashboardData().then(setData)
  }, [])
  
  return <DashboardShell data={data} />
}

// src/components/shells/DashboardShell.tsx (presentational)
interface DashboardShellProps {
  data: DashboardData | null
}

export function DashboardShell({ data }: DashboardShellProps) {
  // render data-driven shell
  // no data fetching, no API calls
}
```

**Validation:**
```bash
# Search for hardcoded data
grep -r "const.*= \[" src/components/
# Must return zero results in component files

# Search for fetch/axios
grep -r "fetch\|axios\|fetch(" src/
# Must return zero results (only in mocks/)

# Search for API URLs
grep -r "http://\|https://" src/components/
# Must return zero results (only in mocks/)
```

---

### 6.2 Mock Data Shape Compliance

**CRITICAL:**
- [ ] All data matches type definitions in `src/mocks/types.ts`
- [ ] Metrics have required fields: `id`, `label`, `value`, `trend`, `unit`
- [ ] Distribution segments have: `id`, `label`, `value`, `percentage`
- [ ] TimeSeries has: `date`, `value` for each data point

**Type validation:**
```typescript
// ✓ CORRECT - matches DashboardData type
const data: DashboardData = {
  metrics: [
    {
      id: 'metric-1',
      label: 'Responses',
      value: 1234,
      previousValue: 1000,
      delta: 234,
      deltaPercentage: 23.4,
      trend: 'up',
      unit: 'responses',
      description: 'Total survey responses',
    },
    // ...
  ],
  distribution: {
    label: 'Response Distribution',
    segments: [
      {
        id: 'segment-1',
        label: 'Completed',
        value: 800,
        percentage: 65,
      },
      // ...
    ],
    total: 1234,
  },
  timeSeries: [
    {
      date: '2026-01-01',
      value: 100,
      // ...
    },
    // ...
  ],
  metadata: {
    lastUpdated: new Date(),
    source: 'mock',
  },
}

// ✗ BLOCKED - missing required fields
const badData = {
  metrics: [
    { label: 'Responses', value: 1234 }, // missing id, trend, unit
  ],
}
```

---

## 7. No-Hardcoding Enforcement

### 7.1 String Literals

**CRITICAL:**
- [ ] No hardcoded text in component render (use mock data labels)
- [ ] No hardcoded URLs (use `env` variables if needed)
- [ ] No hardcoded IDs (use data from props)
- [ ] Titles, descriptions come from data props

**Correct:**
```tsx
// ✓ CORRECT - text from data
interface MetricCardProps {
  metric: MetricData
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">{metric.label}</h3>
        <p className="text-sm text-muted-foreground">{metric.description}</p>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{metric.value}</div>
        <p className="text-sm">{metric.unit}</p>
      </CardContent>
    </Card>
  )
}

// ✗ BLOCKED - hardcoded strings
export function MetricCard() {
  return (
    <Card>
      <h3>Total Responses</h3>
      <div>1,234</div>
    </Card>
  )
}
```

---

### 7.2 Configuration Constants

**CRITICAL:**
- [ ] No magic numbers (use named constants)
- [ ] Breakpoints only via Tailwind (no `const MOBILE = 375`)
- [ ] Delays via `src/config/` if reused (e.g., `SKELETON_DELAY = 300`)
- [ ] Limits for pagination via props or config

**Correct:**
```typescript
// src/config/timing.ts
export const SKELETON_DELAY_MS = 300 // prevents flicker
export const TRANSITION_DURATION_MS = 200

// src/components/shells/DashboardShell.tsx
import { SKELETON_DELAY_MS } from '@/config/timing'

await addLatencySimulation(data, SKELETON_DELAY_MS)

// ✗ BLOCKED - magic numbers
await addLatencySimulation(data, 300)
```

---

## 8. No-API Verification

### 8.1 API Call Detection

**CRITICAL:**
- [ ] Zero `fetch()` calls in components
- [ ] Zero `axios.get/post` calls in components
- [ ] Zero `.then()` chains for HTTP requests in components
- [ ] All data from `src/mocks/` functions only

**Validation:**
```bash
# Search for API patterns
grep -r "fetch(" src/components/ 2>/dev/null
grep -r "axios\." src/components/ 2>/dev/null
grep -r "\.then(" src/components/ 2>/dev/null
# Must all return zero results

# Search for HTTP URLs
grep -r "http://\|https://" src/components/ 2>/dev/null
# Must return zero results (check src/mocks/ instead)
```

---

### 8.2 Mock Data Sources Only

**CRITICAL:**
- [ ] All data from `getMockSurveyDashboardData()` family
- [ ] No direct database calls
- [ ] No environment variables exposing API endpoints
- [ ] Config files reference mock data sources

**Allowed imports:**
```typescript
// ✓ ALLOWED - from mock layer
import {
  getMockSurveyDashboardData,
  getMockResponseDistribution,
  getMockTrendData,
  getMockMetricsOnly,
  getMockBarChartData,
} from '@/mocks'

// ✗ BLOCKED - API calls
import axios from 'axios'
const response = await axios.get(process.env.REACT_APP_API_URL)
```

---

## 9. Performance Benchmarks

### 9.1 Core Web Vitals (CWV)

**CRITICAL:**
- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] INP (Interaction to Next Paint): < 200ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

**Validation:**
```bash
# Use Lighthouse in DevTools
# Chrome → F12 → Lighthouse → Generate report
# Check "Performance" category for metrics
```

**Common failures:**
- LCP > 2.5s: images not optimized, large JS bundles
- INP > 200ms: heavy event handlers, unoptimized renders
- CLS > 0.1: skeleton → content layout shift, ads, modals

---

### 9.2 Bundle Size Targets

**CRITICAL:**
- [ ] Dashboard shell JS gzipped: < 300kb total
- [ ] CSS (Tailwind): < 50kb gzipped
- [ ] No unused dependencies

**Check:**
```bash
npm run build
# Check dist/ file sizes
# Total should stay under budget
```

---

### 9.3 No Layout Thrash

**CRITICAL:**
- [ ] Skeletons same height as content (no shift on load)
- [ ] Grid maintains columns during state changes
- [ ] No `min-h-screen` that changes between states
- [ ] Content expansion uses `transition` classes

**Correct:**
```tsx
// ✓ CORRECT - no shift
<Card className="min-h-24">
  {isLoading ? (
    <Skeleton className="h-20 w-full rounded-lg" />
  ) : (
    <p className="text-lg font-bold">{data.value}</p>
  )}
</Card>

// ✗ BLOCKED - height changes
<Card>
  {isLoading ? (
    <Skeleton /> {/* renders 8px */}
  ) : (
    <p className="text-3xl font-bold">{data.value}</p> {/* renders 40px */}
  )}
</Card>
```

---

## 10. Component Composition Rules

### 10.1 Library Component Usage

**CRITICAL:**
- [ ] Only shadcn/ui components used (from `src/components/ui/`)
- [ ] All required props passed to components
- [ ] No prop spreading (`{...props}`) without documentation
- [ ] `children` prop for flexible content

**Mandatory components:**
```typescript
// Always use these for dashboards:
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// For charts only:
import { BarChart, LineChart, AreaChart, DonutChart } from '@/components/charts'
```

---

### 10.2 Props & Type Safety

**CRITICAL:**
- [ ] All component props typed with interfaces
- [ ] No implicit `any` types
- [ ] Optional props marked with `?`
- [ ] Default values provided

**Correct:**
```typescript
// ✓ CORRECT - full type safety
interface DashboardShellProps {
  data: DashboardData | null
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
}

export function DashboardShell({
  data,
  isLoading = false,
  error = null,
  onRetry,
}: DashboardShellProps) {
  // implementation
}

// ✗ BLOCKED - implicit any
export function DashboardShell(props) {
  return <div>{props.data}</div>
}
```

---

### 10.3 State Management

**CRITICAL:**
- [ ] Use React `useState` for UI state (loading, error)
- [ ] Props for data (no local copies)
- [ ] Lift state to parent for shared concerns
- [ ] No global state in Phase 8.2 (for Phase 9+)

**Correct:**
```typescript
// ✓ CORRECT - local state for loading
export function DashboardContainer() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)
    getMockSurveyDashboardData()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return <DashboardShell data={data} isLoading={isLoading} error={error} />
}

// ✗ BLOCKED - global state (Phase 8.2)
import { useStore } from '@/store'

export function DashboardContainer() {
  const { data, isLoading } = useStore()
  // not allowed in Phase 8.2
}
```

---

## 11. Pre-Build QA Checklist

**Run before `git commit`:**

```
TECHNICAL (CRITICAL)
☐ npm run build exits with 0
☐ tsc --noEmit shows 0 errors
☐ No @ts-ignore comments
☐ No unused imports
☐ package.json unchanged
☐ No new dependencies

DESIGN SYSTEM (CRITICAL)
☐ Zero hardcoded hex colors
☐ Zero hardcoded pixel values
☐ All spacing via Tailwind classes
☐ Typography semantic (h1, h2, text-lg)
☐ Light AND dark mode test passed

ACCESSIBILITY (CRITICAL)
☐ Contrast ratio 4.5:1 in light mode
☐ Contrast ratio 4.5:1 in dark mode
☐ Semantic HTML (section, header, footer)
☐ aria-labelledby on sections
☐ Keyboard navigation works (Tab, Escape)
☐ Focus outline visible

RESPONSIVE (CRITICAL)
☐ 375px (mobile) - single column
☐ 768px (tablet) - multi-column
☐ 1440px (desktop) - full layout
☐ No horizontal scroll
☐ Images scale correctly

DATA & MOCK (CRITICAL)
☐ All data from src/mocks/
☐ Zero fetch() calls
☐ Zero API endpoints
☐ Zero hardcoded strings (from data props)
☐ Mock data shape matches types.ts

PERFORMANCE (CRITICAL)
☐ Skeletons match content height
☐ No layout shift on state change
☐ Transition classes smooth
☐ Bundle size < budget

COMPONENT (CRITICAL)
☐ Library components only (shadcn/ui)
☐ All props typed with interfaces
☐ No implicit any
☐ Default values provided
```

---

## 12. Escalation Matrix

| Issue | Action | Phase |
|-------|--------|-------|
| Build error | FIX IMMEDIATELY | Blocking |
| TypeScript error | FIX IMMEDIATELY | Blocking |
| Hardcoded color | FIX | Blocking |
| Hardcoded pixel | FIX | Blocking |
| Missing ARIA label | FIX | Blocking |
| Contrast < 4.5:1 | FIX | Blocking |
| Responsive layout broken | FIX | Blocking |
| API call in component | FIX IMMEDIATELY | Blocking |
| Custom component | REMOVE | Blocking |
| New dependency | REMOVE | Blocking |
| console.log left behind | REMOVE | Blocking |
| Unused import | REMOVE | Blocking |

---

## 13. Review Gates

**Before moving to Phase 8.3 (Component Decision Gate + First Screen Intake):**

1. ✅ All CRITICAL items pass
2. ✅ npm run build succeeds
3. ✅ TypeScript zero errors
4. ✅ Accessibility audit passes (Axe)
5. ✅ Responsive design verified (375/768/1440px)
6. ✅ Light/dark mode tested
7. ✅ Code review approved
8. ✅ QA sign-off documented

**Sign-off format:**
```markdown
## QA Sign-Off

- Build: ✅ Pass (`npm run build`)
- TypeScript: ✅ Pass (`tsc --noEmit`)
- Accessibility: ✅ Pass (Axe DevTools, 0 violations)
- Responsive: ✅ Pass (375/768/1440px)
- Design System: ✅ Pass (UBITS tokens, no hardcoding)
- Mock Data: ✅ Pass (no API calls, data from mocks/)
- Performance: ✅ Pass (no layout shift)

**Approved by**: [QA Engineer]  
**Date**: [YYYY-MM-DD]  
**Phase**: 8.2 · Dashboard Shell Patterns
```

---

## 14. Related Documents

- **DASHBOARD_SHELL_PATTERNS.md** — Layout composition rules
- **DASHBOARD_LAYOUT_RECIPES.md** — Reusable pattern templates
- **DASHBOARD_STATE_PATTERNS.md** — Loading/error/empty states
- **DASHBOARD_ARCHITECTURE.md** — Phase 8 governance and principles
- **SCREEN_BUILD_RULES.md** — Screen build standards
- **MOCK_DATA_STRATEGY.md** — Mock data layer design

---

**Last Updated**: 2026-05-05  
**Author**: Fase 8.2 Architecture Team  
**Authority**: Phase 8 Governance Framework
