# Icon QA Checklist - Phase 8.5A (Updated Hotfix 8.5A.1)

## Governance Alignment (Critical)
- [ ] **No shadcn base modification**: Confirmado que `src/components/ui/` no ha sido alterado internamente para cambiar íconos.
- [ ] **No mass migration**: Verificado que no hay reemplazos masivos de `lucide-react`.
- [ ] **Asset Availability**: Confirmado que los activos TSX/SVG locales están disponibles antes de registrarlos en el registry real.
- [ ] **Style Consistency**: Verificado que no se mezclan Lucide e Iconly en el mismo bloque visual.

## Technical Quality
- [ ] `UbitsIcon` wrapper implemented with TypeScript strict typing.
- [ ] `IconRegistry` centralizes all imports.
- [ ] No direct imports of `lucide-react` in business components.
- [ ] No direct imports of `iconly-pro` (if npm) in business components.
- [ ] Icons use `currentColor` and inherit Tailwind classes.
- [ ] SVGs are optimized (no `id` collisions, no hardcoded colors).

## Visual & Brand
- [ ] Style is consistent (all Light or all Bulk in same context).
- [ ] Stroke weight matches UBITS design tokens (1.5px/2px).
- [ ] Iconly Pro license verified for repo usage.
- [ ] No visual "noise" (mixed styles in same component).

## Accessibility
- [ ] `aria-hidden="true"` by default for decorative icons.
- [ ] `role="img"` and `aria-label` support for standalone icons.
- [ ] Focus indicators do not hide icons.
- [ ] Contrast meets WCAG AA on all icons.

## Performance
- [ ] Tree-shaking verified (no importing full lib).
- [ ] SVGs are tiny (<1KB per icon).
- [ ] No double-rendering of icon containers.
