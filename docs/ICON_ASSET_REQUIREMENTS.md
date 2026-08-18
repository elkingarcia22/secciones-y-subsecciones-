# Icon Asset Requirements - Phase 8.5C

## Technical Specifications
To ensure performance and consistency, all Iconly Pro assets must meet the following standards before being added to the repository.

### 1. Format: TSX (React Component)
Assets must be provided as individual React components wrapping optimized SVG code.
- **Path**: `src/icons/assets/[name].tsx` (Proposed)
- **SVG optimization**: Use SVGO to remove IDs, metadata, and hardcoded colors.

### 2. Styling Rules
- **Stroke**: Use `stroke="currentColor"`.
- **Stroke Width**: Fixed to `1.5px` or `2px` (matching UBITS design tokens).
- **Fill**: Default to `none` (Outline style) or `currentColor` (Bulk style).
- **Size**: Viewbox must be consistent (e.g., `0 0 24 24`).

### 3. Naming Convention
Assets must match the semantic names defined in `iconTypes.ts`.
- `dashboard.tsx`
- `trend-up.tsx`
- `calendar.tsx`

### 4. Accessibility
- Must NOT include hardcoded `title` or `desc` tags inside SVG.
- Must accept `UbitsIconProps` inherited from the wrapper.

## Delivery Checklist
- [ ] Optimized SVGs (no noise).
- [ ] Stroke/Fill mapped to `currentColor`.
- [ ] TSX wrapper with `forwardRef` support.
- [ ] License key confirmed for commercial use.
