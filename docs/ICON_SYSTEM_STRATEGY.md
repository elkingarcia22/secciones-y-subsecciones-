# Icon System Strategy - plantilla-proyectos-shadcn

## Overview
As part of the UBITS Enterprise Design System evolution, we are transitioning from `lucide-react` to **Iconly Pro** as our primary icon system. This strategy defines the architectural approach, technical standards, and migration path to ensure visual consistency and performance.

## Core Strategy: The "Registry & Wrapper" Pattern
To avoid vendor lock-in and enable a phased migration, we will implement a **Centralized Icon Registry**.

1. **Abstraction**: No component should import `lucide-react` or `iconly-pro` directly.
2. **Standardization**: All icons will be consumed via a unified `<UbitsIcon />` component.
3. **Phased Coexistence**: Iconly Pro y Lucide coexistirán. **Lucide es el fallback técnico** mandatorio para componentes `ui/` base. **Iconly es el brand target** para dashboards, pantallas de negocio y elementos de marca.
4. **No Mass Migration**: La migración se realizará componente por componente, sección por sección. Prohibido el reemplazo masivo vía script.
5. **Asset Dependency**: Si no hay activos Iconly disponibles, la Phase 8.5B usará Lucide como adapter interno del wrapper para no bloquear el desarrollo.

## Technical Standards

### 1. Official Icon Style: Iconly Light
- **Style**: **Iconly Light** (Outline) will be the baseline for all interactive elements and navigation.
- **Tone**: **Iconly Bulk** (Duotone) may be used for status indicators (Success, Warning, Error) to provide visual weight.
- **Stroke**: Fixed 1.5px or 2px (aligned with UBITS tokens).

### 2. Format: SVG-in-TSX
- We prefer **SVG wrapped in React components** (TSX) over a single monolithic icon font or a large npm package.
- This allows for **tree-shaking**, individual icon optimization, and dynamic property injection (tokens).

### 3. Property Inheritance
Icons must inherit styles from the design system:
- **Color**: Default to `currentColor`. Support semantic tokens (e.g., `text-primary`, `text-success`).
- **Size**: Default to 24px. Support standard T-shirt sizes (sm: 16, md: 24, lg: 32).
- **Aria**: Must support `aria-hidden` by default and `aria-label` for standalone icons.

## Implementation Workflow
1. **Fase 8.5B**: Create `UbitsIcon` wrapper and `IconRegistry`.
2. **Fase 8.5C**: Migrate UI Atoms (Button, Select, Badge).
3. **Fase 8.5D**: Migrate Complex Components (DatePickers, Uploaders).
4. **Fase 8.5E**: Migrate Dashboard specific icons.

## Governance Rules
- **No Direct Imports**: `import { ... } from 'lucide-react'` is prohibited in new features.
- **Registry Only**: New icons must be registered in `src/icons/registry.ts`.
- **Token Compliance**: Never hardcode colors in SVGs. Use `var(--color-*)`.
