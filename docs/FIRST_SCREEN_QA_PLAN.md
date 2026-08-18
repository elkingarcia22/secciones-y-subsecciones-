# QA Plan: Survey Analytics Dashboard

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Phase:** 8.3 (Component Decision Gate)  
**Screen:** Survey Analytics Dashboard  
**QA Phase:** 8.4 (After Build)  

---

## Executive Summary

Comprehensive QA plan for Survey Analytics Dashboard Phase 8.4 build. Covers 9 validation tiers (technical, design, accessibility, responsive, dark/light, data, performance, component, integration). 40+ test scenarios. Zero critical/high issues required before merge. Pass/Fail gates at each tier.

---

## QA Testing Tiers

```
TIER 1: Technical Foundation (Build, Types, Imports)
        ↓ GATE: Build passes, 0 TS errors
TIER 2: Design System (Colors, Spacing, Typography)
        ↓ GATE: All UBITS tokens used, no hex
TIER 3: Responsive Design (375/768/1440px)
        ↓ GATE: No horizontal scroll, all breakpoints work
TIER 4: Light & Dark Modes
        ↓ GATE: Both modes readable, contrast >= 4.5:1
TIER 5: Accessibility (WCAG 2.1 AA)
        ↓ GATE: Keyboard nav, screen readers, focus visible
TIER 6: Dark Mode Deep Dive (Separate from Tier 4)
        ↓ GATE: All text readable, icons visible, no hardcoded colors
TIER 7: Mock Data Layer (No APIs, No Hardcoding)
        ↓ GATE: All data from mocks, filters work, URL params sync
TIER 8: Component Coverage (Library Only)
        ↓ GATE: 12/12 approved components, 0 custom
TIER 9: Integration & States (Loading/Empty/Error)
        ↓ GATE: All states render, transitions smooth
```

---

## Tier 1: Technical Foundation

### 1.1 Build Verification

**Test:** `npm run build`

**Criteria:**
- [ ] Build completes without errors
- [ ] Build duration < 5 seconds
- [ ] No console warnings or deprecation notices
- [ ] No bundle size regression (compare to baseline)

**Command:** `npm run build`  
**Expected:** 0 errors, 0 warnings

**Pass/Fail:** 🟢 **MUST PASS** to proceed

---

### 1.2 TypeScript Strict Mode

**Test:** `tsc --noEmit --strict`

**Criteria:**
- [ ] Zero type errors
- [ ] Zero type warnings
- [ ] No implicit `any` types
- [ ] All props properly typed

**Command:** `npx tsc --noEmit --strict --pretty false`  
**Expected:** No output (silence = success)

**Issues Found:** 🔴 **BLOCK** merge until fixed

---

### 1.3 Import & Export Validation

**Test:** Verify all imports are correct

**Criteria:**
- [ ] No circular imports
- [ ] All imports resolve to valid files
- [ ] No dead imports (unused)
- [ ] No import from /src/components/ that don't exist

**Manual Check:**
```bash
# Check for unused imports
npx eslint src/pages/SurveyDashboard.tsx --fix

# Check imports resolve
node --input-type=module -e "import('./src/pages/SurveyDashboard.tsx')"
```

**Pass/Fail:** 🟢 **MUST PASS**

---

### 1.4 No Console Errors

**Test:** Browser console check

**Criteria:**
- [ ] No red X errors on console
- [ ] No yellow ⚠️ warnings
- [ ] No React warnings (`findDOMNode`, `componentWillReceiveProps`, etc.)
- [ ] No 404 resource errors

**Manual Check:** Open dashboard in browser, check Console tab  
**Pass/Fail:** 🟢 **MUST PASS**

---

## Tier 2: Design System Compliance

### 2.1 Color Token Usage

**Test:** Scan for hardcoded colors

**Criteria:**
- [ ] Zero hardcoded hex colors (#ffffff, #000000, etc.)
- [ ] Zero RGB colors (rgb(255, 255, 255))
- [ ] All colors use UBITS CSS variables (var(--color-*))
- [ ] No inline style colors

**Search Command:**
```bash
grep -r "style.*color:\|style.*background:" src/pages/SurveyDashboard.tsx
grep -r "#[0-9A-F]\{6\}" src/pages/SurveyDashboard.tsx
grep -r "rgb(" src/pages/SurveyDashboard.tsx
```

**Expected:** No matches

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

### 2.2 Tailwind Spacing Only

**Test:** Verify spacing uses Tailwind classes

**Criteria:**
- [ ] All spacing via Tailwind classes (p-6, gap-4, m-2, etc.)
- [ ] No inline `style={{ margin, padding }}`
- [ ] No hardcoded pixel values
- [ ] Consistent spacing scale (4px grid)

**Manual Review:**
```bash
grep -r "style.*padding\|style.*margin" src/pages/SurveyDashboard.tsx
```

**Expected:** No matches

**Pass/Fail:** 🟡 **HIGH** — Should fix before merge

---

### 2.3 Typography Consistency

**Test:** Verify font usage

**Criteria:**
- [ ] All headings use semantic `<h1>`, `<h2>`, `<h3>`
- [ ] No inline font sizes
- [ ] Consistent font weights (400, 500, 600, 700)
- [ ] Text color uses `text-foreground` or semantic tokens

**Manual Review:**
```bash
grep -r "<p\|<span" src/pages/SurveyDashboard.tsx | head -20
```

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

### 2.4 Component Styling Consistency

**Test:** Verify no custom CSS needed

**Criteria:**
- [ ] Library components used exactly as designed
- [ ] No custom CSS classes for component styling
- [ ] No CSS modules for components
- [ ] No inline styles overriding library styles

**Verification:**
```bash
find src/pages -name "*.module.css" -o -name "*.css"
```

**Expected:** No CSS files in pages/ directory

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

## Tier 3: Responsive Design

### 3.1 Mobile (375px)

**Test:** Viewport 375px width

**Criteria:**
- [ ] All content visible without horizontal scroll
- [ ] Touch targets >= 44px (buttons, inputs)
- [ ] Text readable (font size >= 16px for body)
- [ ] Filter buttons stack vertically
- [ ] Metric cards: 1 per row
- [ ] Charts reflow (legend stacks below)

**Tool:** DevTools (Chrome/Firefox) → Device Toolbar → iPhone SE (375x667)

**Manual Checks:**
- [ ] No cutoff text
- [ ] No overflow beyond viewport
- [ ] Tap all buttons/filters
- [ ] Scroll smooth, no jumps

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

### 3.2 Tablet (768px)

**Test:** Viewport 768px width

**Criteria:**
- [ ] Layout shifts appropriately (grid changes to 2 columns where applicable)
- [ ] Filter row: 2 columns side-by-side
- [ ] Metric cards: 2 per row
- [ ] Favorability cards: Side-by-side
- [ ] Charts: Full width with room for legend

**Tool:** DevTools → iPad (768x1024)

**Pass/Fail:** 🟢 **MUST PASS**

---

### 3.3 Desktop (1024px+)

**Test:** Viewport 1024px+ width

**Criteria:**
- [ ] Metric cards: 4 per row (lg: breakpoint)
- [ ] Layout matches designed grid system
- [ ] All content visible above fold (after header/filters)
- [ ] Adequate whitespace; no crowding

**Tool:** DevTools → Full desktop (1440x900)

**Pass/Fail:** 🟢 **MUST PASS**

---

### 3.4 Large Desktop (1440px)

**Test:** Full browser at 1440px (standard 16:9 monitor)

**Criteria:**
- [ ] All sections clearly visible
- [ ] No excessive whitespace
- [ ] Charts use full width without wrapping
- [ ] Sidebar (if present) doesn't cause horizontal scroll

**Tool:** Real monitor or DevTools at 1440 width

**Pass/Fail:** 🟢 **MUST PASS**

---

### 3.5 No Horizontal Scroll

**Test:** Verify no horizontal overflow

**Criteria:**
- [ ] At all breakpoints, no horizontal scrollbar
- [ ] No elements with `overflow-x: scroll` or `width: X px`
- [ ] Content reflows, doesn't compress

**JavaScript Check:**
```javascript
document.body.scrollWidth <= window.innerWidth // Should be true
```

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

## Tier 4: Light & Dark Modes

### 4.1 Light Mode (Primary)

**Test:** Render dashboard in light mode

**Criteria:**
- [ ] All text readable (contrast >= 4.5:1)
- [ ] Icons visible and clear
- [ ] Card backgrounds distinct from page background
- [ ] Borders visible
- [ ] Focus indicators visible

**Manual Check:**
1. Open dashboard
2. Verify color theme toggle shows light mode active
3. Check contrast with eyedropper tool

**Pass/Fail:** 🟢 **MUST PASS**

---

### 4.2 Dark Mode (Supported)

**Test:** Toggle to dark mode

**Criteria:**
- [ ] All text readable (contrast >= 4.5:1)
- [ ] Icons visible and clear
- [ ] Card backgrounds distinct from page background
- [ ] Borders visible
- [ ] Focus indicators visible
- [ ] No white (`#ffffff`) backgrounds
- [ ] No black (`#000000`) backgrounds

**Manual Check:**
1. Toggle theme to dark mode
2. Verify all UI elements visible
3. Check no hardcoded whites/blacks

**Pass/Fail:** 🟢 **MUST PASS**

---

### 4.3 Contrast Validation

**Test:** Check color contrast ratios

**Criteria:**
- [ ] All normal text: >= 4.5:1 contrast
- [ ] All large text (18pt+): >= 3:1 contrast
- [ ] Both light and dark modes tested

**Tool:** WebAIM Contrast Checker or Chrome DevTools Accessibility

**Steps:**
1. Select element in DevTools
2. Check Accessibility panel → Color contrast
3. Should show "✓ AA" or "✓ AAA"

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

## Tier 5: Accessibility (WCAG 2.1 AA)

### 5.1 Keyboard Navigation

**Test:** Navigate entire dashboard using keyboard only

**Criteria:**
- [ ] Tab moves through all interactive elements (buttons, inputs, filters)
- [ ] Tab order is logical: top-to-bottom, left-to-right
- [ ] Shift+Tab reverses order
- [ ] Enter/Space activates buttons
- [ ] Escape closes any open modals/dropdowns
- [ ] Focus indicators visible on every focused element

**Manual Test:**
1. Click anywhere on page
2. Press Tab repeatedly
3. Verify order makes sense: Header → Filters → KPI Cards → Distribution → Timeline → Footer
4. Press Shift+Tab to go backwards
5. Test Enter on buttons, Escape on dropdowns

**Pass/Fail:** 🟢 **MUST PASS**

---

### 5.2 Screen Reader Compatibility

**Test:** Navigate dashboard with screen reader (NVDA, JAWS, VoiceOver)

**Criteria:**
- [ ] Page title announced: "Survey Analytics Dashboard"
- [ ] Navigation landmarks announced: `<main>`, `<nav>`, `<footer>`
- [ ] Section headings announced: "Key Metrics", "Sentiment Analysis", etc.
- [ ] Form labels associated with inputs (no orphaned inputs)
- [ ] Chart images have descriptive alt text
- [ ] Status messages announced (e.g., "Loading...", "No data")
- [ ] List items announced with count (e.g., "3 items")

**Tool:** macOS VoiceOver (VO+U for rotor), Windows NVDA (free)

**Test Script:**
1. Start screen reader
2. Activate at top of page
3. Navigate with arrow keys and Tab
4. Verify all content is accessible

**Pass/Fail:** 🟢 **MUST PASS**

---

### 5.3 ARIA Labels & Landmarks

**Test:** Verify ARIA attributes

**Criteria:**
- [ ] `<main>` landmark present
- [ ] Sections have `aria-label` or `aria-labelledby`
- [ ] Buttons have accessible text or `aria-label`
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Status updates have `aria-live="polite"`
- [ ] No `aria-label` duplicates

**DevTools Check:**
1. Open DevTools → Accessibility panel
2. Check "Accessibility Tree"
3. Verify landmarks and labels present

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

### 5.4 Focus Management

**Test:** Verify focus visible and predictable

**Criteria:**
- [ ] All interactive elements have visible focus indicator
- [ ] Focus not hidden (no `outline: none` without replacement)
- [ ] Focus ring color has sufficient contrast
- [ ] Focus follows logical flow

**Manual Check:**
1. Tab through page
2. Every interactive element should have visible outline/ring
3. Ring should be blue or high-contrast color

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

### 5.5 Semantic HTML

**Test:** Verify proper HTML structure

**Criteria:**
- [ ] Headings are semantic: `<h1>`, `<h2>`, etc. (not `<div>` with font-size)
- [ ] Navigation uses `<nav>` or similar landmarks
- [ ] Buttons are `<button>` (not `<div onclick>`)
- [ ] Links are `<a>` (not `<button>`)
- [ ] Lists use `<ul>`, `<ol>`, `<li>`
- [ ] No div soup or excessive nesting

**Validation:**
```bash
npx html-validate src/pages/SurveyDashboard.tsx
```

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

## Tier 6: Dark Mode Deep Dive

### 6.1 All Colors Use Tokens

**Test:** Scan for hardcoded dark-mode specific colors

**Criteria:**
- [ ] No hardcoded `#1f2937` or other dark grays
- [ ] No hardcoded `#f3f4f6` or other light grays
- [ ] All colors use `var(--color-*)` tokens
- [ ] Token definitions in `src/styles/tokens.css`

**Verification:**
```bash
grep -r "#\|rgb(" src/pages/ | grep -v "var(" 
```

**Expected:** No matches

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

### 6.2 Text Readability

**Test:** Read all text in dark mode at multiple zoom levels

**Criteria:**
- [ ] All body text readable at 100% zoom
- [ ] All text readable at 125% zoom
- [ ] All text readable at 150% zoom
- [ ] No text cut off by background
- [ ] Sufficient line-height for readability

**Manual Check:**
1. Open in dark mode
2. Zoom to 100%, 125%, 150%
3. Read all text sections
4. Zoom reset to 100%

**Pass/Fail:** 🟢 **MUST PASS**

---

### 6.3 Icon Visibility

**Test:** Verify all icons visible in dark mode

**Criteria:**
- [ ] All SVG icons have sufficient contrast against background
- [ ] Icons not disappearing due to color opacity
- [ ] Icon colors use tokens or CSS filters

**Manual Check:**
1. View each icon/button with icon
2. Verify icon visible (not hidden or washed out)
3. Check icon in both light and dark modes

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

### 6.4 Form Control Styling

**Test:** Test all inputs/selects in dark mode

**Criteria:**
- [ ] Input backgrounds contrasted with text
- [ ] Placeholders visible
- [ ] Focus indicators visible
- [ ] Error states visible
- [ ] Disabled states clearly indicated

**Manual Check:**
1. Toggle dark mode
2. Click into each input field
3. Type text
4. Check placeholder, focus, error states

**Pass/Fail:** 🟢 **MUST PASS**

---

## Tier 7: Mock Data Layer

### 7.1 No Hardcoded Data

**Test:** Scan source for inline data objects

**Criteria:**
- [ ] Zero hardcoded mock data in components
- [ ] Zero `const data = { ... }` in render files
- [ ] All data from `getMockSurveyDashboardData(filters)`
- [ ] All data passed via props, not fetched by components

**Search Command:**
```bash
grep -r "const.*=.*{.*current\|const.*metrics.*=" src/pages/SurveyDashboard.tsx
```

**Expected:** No matches

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

### 7.2 No API Calls

**Test:** Scan for fetch/axios/API calls

**Criteria:**
- [ ] Zero `fetch()` calls
- [ ] Zero `axios()` calls
- [ ] Zero `useEffect` with API dependencies
- [ ] Zero `.then()` chains for HTTP

**Search Command:**
```bash
grep -r "fetch(\|axios(\|\.then(" src/pages/SurveyDashboard.tsx
```

**Expected:** No matches

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

### 7.3 Filter State → URL Params

**Test:** Verify filters update URL and are shareable

**Criteria:**
- [ ] Changing date range updates `?from=` and `?to=` params
- [ ] Changing segments updates `?segments=` param
- [ ] URL changes without page reload
- [ ] Shared URL loads with same filters applied
- [ ] Page loads with default filters if URL empty

**Manual Test:**
1. Open dashboard with no filters
2. Change date range
3. Check URL bar → should show `?from=...&to=...`
4. Copy URL and open in new tab
5. Should show same filters applied

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

### 7.4 Mock Layer Consistency

**Test:** Verify mock data integrity

**Criteria:**
- [ ] `promoters + passives + detractors === total`
- [ ] All metric values in valid ranges (NPS 0-100, Effort 0-10)
- [ ] Response counts are non-negative integers
- [ ] Trend dates are chronologically sorted
- [ ] No null/undefined values in required fields

**Validation Script:**
```typescript
const data = getMockSurveyDashboardData(filters)
console.assert(
  data.distribution.promoters + 
  data.distribution.passives + 
  data.distribution.detractors === 
  data.distribution.total
)
```

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

## Tier 8: Component Coverage

### 8.1 Library Components Only

**Test:** Verify only approved 12 components used

**Criteria:**
- [ ] SurveyMetricCard: 4 instances
- [ ] FavorabilityDistributionCard: 1 instance
- [ ] ResponseStackedBarGroup: 1 instance
- [ ] ParticipationTrendCard: 1 instance
- [ ] TrendMetricLineChart: 1 instance
- [ ] DateFilterBar: 1 instance
- [ ] MultiSelect: 1 instance
- [ ] PageHeader: 1 instance
- [ ] Card: 5+ instances (wrappers)
- [ ] Alert: 1+ instance (error states)
- [ ] Skeleton: Multiple (loading states)
- [ ] EmptyState: Multiple (empty states)
- [ ] Zero custom components (no `function CustomMetricCard`)

**Search Command:**
```bash
grep -r "function Custom\|export default function\|const.*Component.*=" src/pages/SurveyDashboard.tsx | grep -v "import"
```

**Expected:** No custom components

**Pass/Fail:** 🔴 **CRITICAL** — Blocks merge

---

### 8.2 Component Props Type-Safe

**Test:** Verify all component props are properly typed

**Criteria:**
- [ ] All props passed to components match approved interface
- [ ] No unknown/extra props passed
- [ ] Required props present (no TypeScript complaints)
- [ ] Callback functions have correct signature

**Verification:**
```bash
npx tsc --noEmit --strict 2>&1 | grep "Property\|is not assignable"
```

**Expected:** No type errors

**Pass/Fail:** 🟢 **MUST PASS**

---

## Tier 9: Integration & States

### 9.1 Loading States

**Test:** Verify Skeleton placeholders during load

**Criteria:**
- [ ] Page shows skeletons on initial load
- [ ] Skeletons disappear when data arrives
- [ ] Each section has own loading indicator
- [ ] Loading doesn't block UI (no full-page spinner)
- [ ] Skeletons match section height

**Manual Test:**
1. Slow down network in DevTools (Throttle)
2. Refresh page
3. See skeleton placeholders
4. Data populates sections
5. Skeletons removed

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

### 9.2 Empty States

**Test:** Verify empty state UI when no data

**Criteria:**
- [ ] Filter to date range with no data
- [ ] Each section shows EmptyState message
- [ ] Messages are user-friendly
- [ ] CTA to adjust filters shown (if applicable)
- [ ] No error states incorrectly triggered

**Manual Test:**
1. Change date range to future date (2099-01-01)
2. See EmptyState in all sections
3. Check message clarity

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

### 9.3 Error States

**Test:** Verify error handling

**Criteria:**
- [ ] Mock layer error → Alert shown
- [ ] Error message is user-friendly
- [ ] Doesn't crash entire page
- [ ] Retry option available (if applicable)

**Manual Test:**
Modify mock function to return error, verify Alert displays.

**Pass/Fail:** 🟡 **MEDIUM** — Should fix before merge

---

### 9.4 Filter Change Behavior

**Test:** Verify filters re-fetch data correctly

**Criteria:**
- [ ] Changing date range triggers new mock query
- [ ] Changing segments triggers new mock query
- [ ] UI updates with new data
- [ ] No stale data displayed
- [ ] Loading state shows during re-fetch

**Manual Test:**
1. Apply filter (date change)
2. Observe data updates
3. Check URL changed
4. Verify metrics changed appropriately

**Pass/Fail:** 🟢 **MUST PASS**

---

### 9.5 Performance Metrics

**Test:** Measure page performance

**Criteria:**
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] INP (Interaction to Next Paint) < 200ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] FCP (First Contentful Paint) < 1.5s

**Tool:** Chrome DevTools → Lighthouse or WebVitals library

**Command:**
```bash
npx lighthouse http://localhost:3000/dashboard --output-path=./report.html
```

**Pass/Fail:** 🟡 **MEDIUM** — Should optimize before merge

---

## Tier 10: Visual Regression Testing (Optional)

### 10.1 Screenshot Comparison

**Test:** Capture screenshots at key breakpoints

**Criteria:**
- [ ] 375px mobile screenshot matches expected
- [ ] 768px tablet screenshot matches expected
- [ ] 1440px desktop screenshot matches expected
- [ ] Light mode screenshot matches expected
- [ ] Dark mode screenshot matches expected

**Tool:** Playwright (optional)

```bash
npx playwright codegen http://localhost:3000/dashboard
```

**Pass/Fail:** 🟡 **OPTIONAL** — Nice-to-have for visual polish

---

## Pass/Fail Criteria by Tier

| Tier | Category | Must Pass | Should Pass | Optional |
|------|----------|-----------|-------------|----------|
| 1 | Technical | Build, TS errors, imports | Console, dead code | |
| 2 | Design | Color tokens, no hex | Spacing, typography | |
| 3 | Responsive | All breakpoints, no scroll | Touch targets, readability | |
| 4 | Light/Dark | Contrast, readability | Color consistency | |
| 5 | A11y | Keyboard nav, focus | ARIA, screen readers | Landmarks |
| 6 | Dark Deep | All tokens, text readable | Icons, form controls | |
| 7 | Mock Data | No hardcoding, no APIs | Filter state, consistency | |
| 8 | Components | Library only, types | Props validation | |
| 9 | Integration | Filter behavior, performance | Loading/Empty states | Visual regression |

---

## QA Sign-Off Checklist

### Pre-Build QA
- [ ] All governance documents complete
- [ ] Component list verified
- [ ] Mock data structure reviewed
- [ ] Layout mockup approved

### Build QA
- [ ] Tier 1 (Technical): ✅ PASS
- [ ] Tier 2 (Design): ✅ PASS
- [ ] Tier 3 (Responsive): ✅ PASS
- [ ] Tier 4 (Light/Dark): ✅ PASS
- [ ] Tier 5 (A11y): ✅ PASS
- [ ] Tier 6 (Dark Deep): ✅ PASS
- [ ] Tier 7 (Mock Data): ✅ PASS
- [ ] Tier 8 (Components): ✅ PASS
- [ ] Tier 9 (Integration): ✅ PASS

### Final Gate
- [ ] Zero CRITICAL issues
- [ ] Zero HIGH issues (or documented exception)
- [ ] All MUST PASS criteria met
- [ ] Code review approved
- [ ] Ready for Phase 8.5

---

**QA Plan Status:** ✅ DEFINED  
**Ready for Phase 8.4 Build:** YES  
**QA Phase Gate:** After Phase 8.4 completion  
**Expected QA Duration:** 2-4 hours per screen  

Generated: 2026-05-05
