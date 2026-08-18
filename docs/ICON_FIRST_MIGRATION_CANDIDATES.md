# First Icon Migration Candidates - Phase 8.5C

## Overview
This document identifies the first batch of icons selected for migration from Lucide to Iconly Pro once assets are available.

## Candidate Batch #1: Brand & Business Essentials
These icons are prioritized because they appear in brand-touching areas (Navigation) or critical business logic (Survey Analytics).

| UBITS Name | Usage | Target Component/Screen | Current Provider |
|---|---|---|---|
| `dashboard` | Sidebar Navigation | `AppShell` / `Sidebar` | Lucide |
| `analytics` | Sidebar Navigation | `AppShell` / `Sidebar` | Lucide |
| `trendUp` | KPI Growth | `DeltaPill` / `SurveyMetricCard` | Lucide |
| `trendDown` | KPI Decline | `DeltaPill` / `SurveyMetricCard` | Lucide |
| `calendar` | Date Filtering | `ParticipationTrendCard` | Lucide |

## Selection Rationale
1. **Low Risk**: These icons are used in composition-based components, not inside shadcn/ui primitives.
2. **High Impact**: Navigation and KPIs are the most visible parts of the Enterprise UI.
3. **Registry-Safe**: Already mapped in `iconRegistry.ts`.

## Exclusion List (DO NOT MIGRATE)
- `chevronDown`: Used inside shadcn `Select` and `Accordion`. Internal library icons remain Lucide.
- `check`: Used inside shadcn `Checkbox`.
- `close`: Used inside shadcn `Alert` and `Badge`.
