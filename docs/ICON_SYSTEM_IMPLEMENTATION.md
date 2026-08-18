# Icon System Implementation - Phase 8.5B

## Overview
This document describes the technical implementation of the UBITS Icon System infrastructure. The system uses a **Registry & Wrapper** pattern to abstract icon providers and enable a phased migration to Iconly Pro while maintaining Lucide as a technical fallback.

## Components

### 1. `UbitsIcon` Wrapper
The central component for all icon usage. It ensures consistency in sizing, toning, and accessibility.

- **Path**: `src/icons/UbitsIcon.tsx`
- **Usage**:
```tsx
import { UbitsIcon } from '@/icons';

// Decorative icon
<UbitsIcon name="dashboard" size="md" tone="primary" />

// Meaningful icon with label
<UbitsIcon name="warning" tone="warning" decorative={false} label="Atención: Riesgo alto" />
```

### 2. `IconRegistry`
A central mapping of semantic UBITS names to actual icon components.

- **Path**: `src/icons/iconRegistry.ts`
- **Status**: Currently using **Lucide-react** as a fallback.
- **Migration Path**: To migrate to Iconly, replace the provider components in this registry. No changes will be required in consuming components.

### 3. Types
Strict TypeScript definitions for names, sizes, and tones.

- **Path**: `src/icons/iconTypes.ts`

## Design System Integration

### Sizes
| Token | Tailwind Class | Pixel equivalent (ref) |
|---|---|---|
| `xs` | `size-3.5` | 14px |
| `sm` | `size-4` | 16px |
| `md` | `size-6` | 24px |
| `lg` | `size-8` | 32px |
| `xl` | `size-10` | 40px |

### Tones
Uses semantic UBITS tokens via Tailwind classes:
- `default`: `text-foreground`
- `muted`: `text-muted-foreground`
- `primary`: `text-primary`
- `positive`: `text-success`
- `negative`: `text-destructive`
- `warning`: `text-warning`
- `info`: `text-info`
- `inverse`: `text-primary-foreground`

## Accessibility Standards
- **Decorative Icons**: `decorative={true}` (default) adds `aria-hidden="true"`.
- **Meaningful Icons**: `decorative={false}` requires a `label` prop, adds `role="img"` and `aria-label`.
- **Color Contrast**: All tones are mapped to WCAG AA compliant design tokens.

## Implementation Rules
1. **No Direct Imports**: Do not import `lucide-react` or `iconly-pro` in feature components.
2. **Registry First**: All new icons must be registered in `iconRegistry.ts`.
3. **No HEX**: Icons inherit color via `currentColor`.
4. **Strict Typing**: No `any` is allowed in icon usage.

## Current Status: Phase 8.5B
- ✅ Infrastructure implemented.
- ✅ Semantic naming API established.
- ✅ Fallback mechanism active.
- ⏳ **Migration to Iconly Pro**: Blocked until local assets (TSX/SVG) and license are confirmed.
