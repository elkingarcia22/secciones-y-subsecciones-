# ANTIGRAVITY · Governance Framework for Screen & Dashboard Development

**Status:** ✅ DEFINED  
**Date:** 2026-05-05  
**Purpose:** Establish mandatory operating constraints for Antigravity during prototype development

---

## Executive Summary

ANTIGRAVITY is the architectural governance framework ensuring that all screen, dashboard, and prototype development in `plantilla-proyectos-shadcn` adheres to a singular principle:

**Screens are assembled, not built. Dashboards compose components, not creation.**

This document defines how Antigravity should work during Phases 8.3 through 8.5 (and beyond).

---

## Core Operating Principle

> **Every screen = (100% library components) + (mock data) + (URL state) + (accessible interactions)**  
> **No APIs. No new components. No hardcoded data. No scope creep.**

---

## Mandatory Constraints

### 1. Intake-First Requirement

❌ **BLOCKED:** Building any screen without an intake document  
✅ **REQUIRED:** Complete intake before ANY code touches src/screens/ or src/pages/

**Intake must include:**
- Screen name and purpose
- Target users and frequency
- Component list (verified against library)
- Mock data structure
- Success criteria
- Accessibility requirements
- Dark mode specification

---

### 2. One Screen at a Time

❌ **BLOCKED:** Building multiple screens in parallel  
✅ **REQUIRED:** Complete Phase 8.4 (first screen) before starting Phase 8.5 (second screen)

**Reason:** Validates patterns, prevents divergence, ensures consistency.

**Sequence:**
- Phase 8.4: First screen (Survey Analytics Dashboard)
- Phase 8.4 QA: Full validation
- Phase 8.5: Second screen (using patterns from 8.4)

---

### 3. Component Freeze for Core Library

❌ **BLOCKED:** Modifying approved components (Phases 7B-7D)  
✅ **REQUIRED:** Using components exactly as approved (no wrapping, no variants, no custom versions)

**If a variant is needed:**
- Document in intake as "Component Variant Request"
- Request during Phase 8.3 (Decision Gate), not during build
- Creates new component in library, not dashboard-specific

**Core frozen components:**
- All in src/components/ui/
- All in src/components/charts/
- All in src/components/survey-analytics/
- All in src/components/date/
- All in src/components/upload/
- All in src/components/selection/
- All in src/components/media/

---

### 4. No Hardcoded Data in Visual Components

❌ **BLOCKED:** Inline data (const data = { ... })  
✅ **REQUIRED:** All data from src/mocks/ via query functions

**Pattern:**
```typescript
// ✅ CORRECT
function SurveyDashboard({ dateRange, segment }) {
  const data = getMockSurveyDashboardData({
    dateRange,
    segment,
    region: undefined
  })
  return <Dashboard data={data} />
}

// ❌ WRONG
function SurveyDashboard() {
  const data = {
    metrics: [
      { label: 'NPS', value: 75 }
    ]
  }
  return <Dashboard data={data} />
}
```

---

### 5. No API Connections in Prototypes

❌ **BLOCKED:** fetch(), axios, service layer, API calls  
✅ **REQUIRED:** Mock data only (src/mocks/)

**Timeline:**
- Phase 8.4-8.5: Mock layer only
- Phase 9.0+: API connection if authorized

**If API integration is needed during 8.4-8.5:**
- Document as "API Integration Backlog"
- Do NOT implement, only design query interface
- Create adapter placeholder
- Implement in Phase 9.0

---

### 6. Mandatory Mock Data Layer Usage

Every screen must use src/mocks/:

- **getMockSurveyDashboardData()** — complete survey dashboard
- **getMockResponseDistribution()** — response segment breakdown
- **getMockTrendData()** — temporal metrics
- **getMockMetricsOnly()** — KPI summary
- **getMockEmptyDashboardData()** — empty state
- **getMockErrorResponse()** — error state

**Rules:**
- No creating mock functions outside src/mocks/
- No modifying mock structure mid-phase
- All mock data must match query interface (types.ts)

---

### 7. Library Components Only

Available component families:

**UI Foundations:**
- Card, Button, Input, Badge, Alert, Skeleton, Progress, Empty State

**Charts:**
- LineChart, BarChart, AreaChart, DonutChart, HeatmapChart, SparklineChart, KpiCard

**Survey Analytics:**
- SurveyMetricCard, FavorabilityDistributionCard, ParticipationTrendCard
- ResponseStackedBar, ResponseStackedBarGroup, TrendMetricLineChart
- DeltaPill, InlineLegend, MetricComparisonFooter

**Forms & Filters:**
- DateFilterBar, MultiSelect, SearchableSelect, FilterBar

**Layout:**
- PageHeader, SectionHeader, Card, Badge

**Prohibited:**
- Custom dashboard cards
- Custom chart wrappers
- Custom filter components
- Screen-specific anything

---

### 8. UBITS B2B Enterprise Standards

Every screen must maintain:

**Visual:**
- UBITS design tokens only (no hardcoded hex/#colors)
- Light mode as primary
- Dark mode fully functional
- No gradients, glassmorphism, or decorative effects
- Subtle shadows, clean cards, professional spacing

**Responsive:**
- Desktop-first (1200px baseline)
- Tested at 375px (mobile), 768px (tablet), 1440px (desktop)
- Touch-friendly targets (≥44px)

**Accessibility:**
- WCAG 2.1 AA compliance (4.5:1 contrast minimum)
- Semantic HTML (main, section, article, aside, header, footer)
- ARIA labels and landmarks
- Keyboard navigation (Tab, Enter, Escape)
- Focus visible on all interactive elements

---

### 9. QA After Every Phase

**Phase 8.3 (Decision Gate):**
- Component coverage list validated
- Mock data structure documented
- Intake document complete
- No UI code written

**Phase 8.4 (First Screen Build):**
- npm run build passes
- TypeScript 0 errors
- No hardcoded data
- No APIs
- Responsive 375/768/1440px
- Dark mode works
- Keyboard navigation works
- Screen reader basics verified
- All required states (loading/empty/error)
- Visual UBITS compliance
- Accessibility WCAG AA

**Phase 8.5 (Second Screen):**
- Same as Phase 8.4
- Plus: Pattern consistency with 8.4

---

### 10. Documentation as Source of Truth

These documents are AUTHORITATIVE:

**Immutable (until Phase 9.0):**
- docs/DESIGN.md — Visual & styling rules
- docs/ARCHITECTURE.md — Codebase structure
- docs/QA_CHECKLIST.md — Testing requirements
- docs/ANTIGRAVITY.md — This file

**Reference (Phases 8.0+):**
- docs/DASHBOARD_SHELL_PATTERNS.md — Layout rules
- docs/DASHBOARD_LAYOUT_RECIPES.md — Reusable patterns
- docs/DASHBOARD_STATE_PATTERNS.md — State handling
- docs/DASHBOARD_QA_RULES.md — Multi-tier validation

**Phase-Specific (created per phase):**
- FIRST_SCREEN_INTAKE.md
- FIRST_SCREEN_COMPONENT_DECISION_GATE.md
- FIRST_SCREEN_COMPONENT_MAP.md
- FIRST_SCREEN_MOCK_DATA_MAP.md
- FIRST_SCREEN_QA_PLAN.md
- FIRST_SCREEN_BUILD_PROMPT.md

---

## Operating Model (Phases 8.3 — 8.5)

```
Phase 8.3 (Decision Gate)
├── Select candidate screen
├── Create intake document
├── Validate component coverage
├── Document mock data requirements
├── Create component decision gate
└── Get approval before Phase 8.4

         ↓ (Approval)

Phase 8.4 (First Screen Build)
├── Assemble screen from library components
├── Wire mock data layer
├── Implement state handling
├── Add accessibility & dark mode
├── Execute full QA
└── Get approval before Phase 8.5

         ↓ (Approval)

Phase 8.5 (Second Screen)
├── Select second candidate
├── Repeat Phase 8.3-8.4
├── Validate pattern consistency with 8.4
├── Execute QA
└── Production readiness review

         ↓ (Approval)

Phase 9.0 (API & Real Data)
├── Design API integration layer
├── Replace mock queries with real queries
├── Authentication & authorization
├── Real data validation & transforms
└── Certification for production
```

---

## What ANTIGRAVITY Prevents

| ❌ Anti-Pattern | ✅ What We Do Instead |
|---|---|
| Building 3 dashboards at once | Build one, validate it, move to next |
| Modifying components mid-phase | Request variants during Decision Gate |
| Hardcoding data in JSX | Use getMockData() from src/mocks/ |
| Connecting to APIs in prototype | Mock layer only, API phase is Phase 9.0+ |
| Creating custom components | Use library only, request variants in Decision Gate |
| Skipping accessibility | WCAG 2.1 AA is mandatory, not optional |
| One-off dark mode handling | UBITS tokens handle both light/dark |
| Building without intake | Intake first, always |
| Scope creep mid-build | Intake defines boundaries, changes go to backlog |
| Silent feature flags | All features documented in intake |

---

## Contact & Escalation

If you encounter a blocker:

1. **Component not available?**  
   → Document in Decision Gate → Request during Phase 8.3 → Get approval before Phase 8.4

2. **Mock data shape doesn't fit?**  
   → Document in Mock Data Map → Propose change → Get approval before building

3. **Need to modify approved component?**  
   → Request variant during Decision Gate → Does NOT modify existing

4. **Need API integration before Phase 9.0?**  
   → Document as "Future API Layer" → Design adapter interface → Implement in Phase 9.0

5. **Requirement not in intake?**  
   → Document in intake revision → Get approval → Adds scope to next phase or backlog

---

## Summary

**ANTIGRAVITY ensures:**
- One screen at a time
- No new components without Decision Gate approval
- No APIs until Phase 9.0
- No hardcoded data
- No modifications to frozen components
- Intake documents as single source of truth
- UBITS B2B enterprise maintained
- QA executed every phase

**The result:** Prototypes that are assembled, not built. Consistent, maintainable, accessible screens built from proven components.

---

**Effective:** 2026-05-05  
**Next Review:** Post-Phase 8.5

