# Icon Migration Risk Assessment - Phase 8.5C

## Overview
Identification of technical and visual risks associated with the first batch of icon migrations.

## Risk Matrix

| Risk | Impact | Probability | Mitigation Strategy |
|---|---|---|---|
| **Visual Mismatch** | Medium | High | Prohibition of mixing Lucide/Iconly styles in the same section. |
| **Sizing Inconsistency** | Low | Medium | Standardized `sizeClasses` in `UbitsIcon.tsx`. |
| **Broken Accessibility** | Medium | Low | Mandatory `decorative` vs `meaningful` audit in QA Plan. |
| **Bundle Bloat** | Low | Low | SVG-in-TSX format ensures efficient tree-shaking. |
| **Licensing Liability** | High | Low | **Decision Gate**: Migration is blocked until license is confirmed. |

## Specific Component Impact
- **DeltaPill**: High visual sensitivity. Changing `trendUp/Down` must maintain color semantics (green/red).
- **Sidebar**: High brand sensitivity. New icons must maintain 24px optical balance.
