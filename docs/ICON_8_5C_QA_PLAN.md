# Icon Migration QA Plan - Batch #1 (Phase 8.5C)

## Overview
Test strategy for the first controlled migration of icons to Iconly Pro.

## Test Tiers

### Tier 1: Technical Integrity
- [ ] **Build Validation**: `npm run build` must pass.
- [ ] **TypeScript**: Zero errors in `src/icons/` and consuming components.
- [ ] **Tree-shaking**: Verify that only imported icons are included in the bundle.

### Tier 2: Visual Fidelity
- [ ] **Style Alignment**: Verify all Batch #1 icons use the "Light/Outline" style.
- [ ] **Optical Balance**: Icons must appear centered and balanced at 16px, 24px, and 32px.
- [ ] **Color Inheritance**: Icons must correctly inherit `text-primary`, `text-success`, etc.
- [ ] **Dark Mode**: Verify visibility and contrast in Dark Mode.

### Tier 3: Accessibility (WCAG 2.1)
- [ ] **Aria-hidden**: Verify decorative icons have `aria-hidden="true"`.
- [ ] **Aria-label**: Verify functional icons (if any in Batch 1) have `role="img"` and `aria-label`.
- [ ] **Contrast**: All icons must meet 4.5:1 contrast ratio.

## Regression Testing
- [x] Verify that `shadcn/ui` base components (Button, Checkbox) still use Lucide icons correctly.
- [x] Verify that un-migrated business icons still function via Lucide fallback.

## QA Execution Results (2026-05-06)
- **Outcome**: ✅ PASSED (Gated)
- **Technical Status**: Build stable, 0 TS errors, 0 unauthorized dependencies.
- **Governance Status**: Migration officially BLOCKED.
- **Next Check**: Required when assets for Phase 8.5D are delivered.

---
*Reporte final de QA - Fase 8.5C*
