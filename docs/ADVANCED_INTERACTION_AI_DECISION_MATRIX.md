# ADVANCED_INTERACTION_AI_DECISION_MATRIX

## Matriz de Decisión Tecnológica

| Componente | Base sugerida | Tipo | Dep. Externa | Riesgo | Prioridad | Fase |
|---|---|---|---|---|---|---|
| **Chip** | `Badge` + `Button` | Wrapper UBITS | No | Bajo | Alta | 8.7B |
| **IA-Button** | `Button` + `UbitsIcon` | Wrapper UBITS | No | Bajo | Alta | 8.7B |
| **IA Loader** | `Skeleton` / `SVG` | Custom UBITS | No | Bajo | Alta | 8.7B |
| **Save Indicator** | `Badge` / `Lucide` | Custom UBITS | No | Bajo | Alta | 8.7B |
| **Stepper** | `Button` / `Card` | Custom UBITS | No | Medio | Media | 8.7C |
| **Coachmark** | `Popover` / `Portal` | Composed UBITS | No | Medio | Media | 8.7C |
| **AI Panel** | `Card` / `Tabs` | Composed UBITS | No | Medio | Media | 8.7C |
| **Video Player** | HTML5 `<video>` | Custom UBITS | No | Medio | Media | 8.7D |
| **Audio Player** | HTML5 `<audio>` | Custom UBITS | No | Medio | Media | 8.7D |
| **Rich Text Editor** | N/A | **Bloqueado** | **Gate Req.** | Alto | Baja | 8.7E |

## Criterios de Aceptación y QA

### 1. Chip (8.7B)
- **Props**: `label`, `onDelete`, `onClick`, `active`, `variant` (outline/solid).
- **QA**: Click target accesible, estado de foco visible, iconografía `X` consistente.

### 2. IA-Button (8.7B)
- **Props**: `loading`, `sparkleTone` (IA default), standard button props.
- **QA**: Animación de entrada de sparkles sutil, contraste de texto AI-first.

### 3. IA Loader (8.7B)
- **Props**: `size`, `label`, `variant` (shimmer/pulse).
- **QA**: No causa jank, aria-live="polite", tokens de IA respetados.

### 4. Save Indicator (8.7B)
- **Props**: `status` (saving/saved/error), `lastSaved`.
- **QA**: Transiciones suaves, colores semánticos (no HEX), texto localizado.

### 5. Stepper (8.7C)
- **Props**: `steps[]`, `currentStep`, `orientation` (h/v), `clickable`.
- **QA**: Keyboard navigation (arrow keys), estados "completed" claros.

### 6. Coachmark (8.7C)
- **Props**: `target`, `title`, `content`, `onNext`, `onSkip`, `totalSteps`.
- **QA**: Portal rendering, backdrop click handling, no rompe el flujo principal.

### 7. Video/Audio Player (8.7D)
- **Props**: `src`, `poster`, `autoPlay`, `controls` (custom).
- **QA**: Controles de volumen/progreso accesibles, fallback de formato, no dependencias pesadas.

## Riesgos y Mitigación
- **Riesgo Visual**: Divergencia en la estética de IA. **Mitigación**: Centralizar tokens en `tokens.css`.
- **Riesgo Técnico**: Complejidad de Stepper responsivo. **Mitigación**: Definir layout stack para móvil.
- **Riesgo Accesibilidad**: Media Players sin etiquetas. **Mitigación**: Seguir estándares ARIA para reproductores.

---
*Matriz de Decisión v1.0 — Fase 8.7A*
