# Iconly Pro Integration: Decision Gate - Phase 8.5A

## Objective
Evaluate and approve the integration of Iconly Pro as the official icon set for UBITS Enterprise.

## Decision Matrix

| Criteria | Lucide (Current) | Iconly Pro (Proposed) | Winner |
|---|---|---|---|
| **Visual Style** | Generic / Open Source | Enterprise / Premium | **Iconly Pro** |
| **Customization** | Standard | High (Bulk/Light/Bold) | **Iconly Pro** |
| **Consistency** | High | Extreme (UBITS Brand Align) | **Iconly Pro** |
| **Bundle Size** | Tree-shakeable | Tree-shakeable (if TSX) | **Tie** |
| **License** | MIT | Commercial / Pro | **Lucide** (Cost-wise) |

## Final Decision: Hybrid Coexistence
We will adopt **Iconly Pro** for all brand-touching and business-logic components, while maintaining **Lucide** as a fallback for internal shadcn/ui library primitives during the transition.

## Architecture Gate: "The Proxy Wrapper"
We will NOT perform a find-and-replace of icons. Instead, we will implement a Proxy pattern:

```tsx
// src/components/icons/UbitsIcon.tsx
export const UbitsIcon = ({ name, ...props }) => {
  const IconComponent = IconRegistry[name] || LucideFallback[name];
  return <IconComponent {...props} />;
}
```

## Approved Specifications
1. **Primary Style**: Iconly Light (Outline).
2. **Secondary Style**: Iconly Bulk (for Status cards).
3. **Internal Format**: TSX components (React SVGs).
4. **Registry Path**: `src/icons/` folder.

## Risk & Prerequisite Assessment
- **Licencia/Activos**: **Fase 8.5B puede implementarse con placeholders/adapters** si no hay activos Iconly Pro disponibles. Antes de cualquier migración real de íconos, se debe confirmar:
  - Disponibilidad de SVGs/TSX locales optimizados.
  - Confirmación de licencia de uso para el proyecto.
- **Mezcla de Estilos**: Prohibido mezclar Lucide e Iconly dentro de la misma sección visual sin justificación de UX.
- **Modificación Base**: Re-confirmado: **0 modificaciones en shadcn/ui base** durante Phase 8.5.

## Sign-off Required
- [ ] Design Lead Approval
- [ ] Tech Lead Approval
- [ ] Brand Consistency Check
