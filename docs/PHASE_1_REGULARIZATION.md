# Phase 1 Regularization

## Diagnóstico
La Fase 1 fue ejecutada prematuramente, resultando en una base técnica funcional pero desalineada visualmente con el Design System oficial (v3.0.0).

## Resoluciones
1. **¿Fase 1 se mantiene?** Sí. La infraestructura de Vite + React + TypeScript es correcta y no requiere reconstrucción desde cero.
2. **¿Fase 1 requiere hotfix?** **SÍ.** Es obligatorio realizar un ajuste en `src/styles/tokens.css` y `tailwind.config.js` para corregir los valores HEX (Surface App, Text Primary) y los radios de borde.
3. **¿Tailwind v3 queda aprobado?** Sí. Se aprueba formalmente el uso de Tailwind v3 para garantizar la estabilidad con el ecosistema actual de herramientas shadcn/ui.
4. **¿Los tokens actuales son correctos?** No del todo. Deben sincronizarse con la `TOKEN_DECISION_MATRIX.md`.
5. **¿App.tsx de prueba técnica puede quedarse?** Temporalmente sí, pero será reemplazado por la estructura de Layout en la Fase 3.

## Plan de Acción (Fase 1.1: Hotfix de Alineación)
- Corregir `--color-bg-app` a `#F4F6F8`.
- Corregir `--color-text-primary` a `#303A47`.
- Ampliar escala de radios (sm: 8px, lg: 16px, xl: 24px).
- Sincronizar sombras sutiles de UBITS.
- Ajustar `tailwind.config.js` para reflejar estos cambios.

## Estado de Congelación
**ESTADO:** Fase 1.1 (Hotfix) implementada. El repositorio está listo para la validación de QA antes de proceder con la Fase 2 (shadcn/ui).a
