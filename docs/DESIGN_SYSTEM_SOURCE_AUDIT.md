# Design System Source Audit

## Fuente Oficial Encontrada
Se ha localizado la fuente oficial en el directorio superior del workspace:
**Ruta:** `/Users/ub-col-pro-lf4/Documents/tokens/`

### Archivos Clave Detectados:
- `UBITS_DESIGN_SYSTEM.md`: Guía de referencia rápida (v3.0.0).
- `ubits_design_expert.skill.md`: Reglas de implementación para IA.
- `Mode 1.tokens.json`: Definiciones técnicas (Figma Tokens).
- `ubits-design-system-kit`: Assets y documentación adicional.

## Tokens Oficiales Identificados (v3.0.0)
- **Brand Action:** `#0C5BEF`
- **Surface App:** `#F4F6F8`
- **Surface Card:** `#FFFFFF`
- **Text Primary:** `#303A47`
- **Positive:** `#17B16D`
- **Negative:** `#CF0E34`
- **Neutral:** `#FFA920`
- **AI Accent:** `#0C5BEF`
- **AI Background:** `#F3F2FF`

## Reglas Visuales
- **Radios:** Muy amplios para una sensación "amigable" (8px, 16px, 24px).
- **Sombras:** Muy sutiles (1px 2px con 0.06 de opacidad).
- **Spacing:** Estricto en múltiplos de 4px.
- **Tipografía:** Inter (Regular 400, Semibold 600, Bold 700).

## Recomendaciones
- **Fuente para Tokens:** Usar `UBITS_DESIGN_SYSTEM.md` como referencia humana y `Mode 1.tokens.json` para validación técnica.
- **Fuente para Assets:** Usar la carpeta `ubits-design-system-kit` para logos y SVG oficiales.
- **Fidelidad:** Cualquier valor en el código que no coincida con estas fuentes debe ser corregido inmediatamente (Hotfix Fase 1).
