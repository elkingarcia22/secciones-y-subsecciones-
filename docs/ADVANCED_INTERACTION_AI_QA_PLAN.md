# ADVANCED_INTERACTION_AI_QA_PLAN

## Framework de Validación Suite 8.7

### 1. Technical Tier (Build & Integrity)
- [ ] **Build Check**: `npm run build` debe pasar sin advertencias de bundle size excesivo.
- [ ] **Type Safety**: 0 `any`, 0 `as any`. Uso estricto de interfaces en `*Types.ts`.
- [ ] **Package Integrity**: No se permiten dependencias nuevas sin aprobación previa (Gate 8.7E).
- [ ] **Zero-API**: Los componentes deben ser puros (Props-driven), sin llamadas a `fetch` o `axios`.

### 2. Design System Tier (Tokens & UI)
- [ ] **Zero HEX**: Prohibido el uso de códigos hexadecimales en archivos TSX.
- [ ] **IA Branding**: Uso obligatorio de los tokens `color-ai-*` definidos en `tokens.css`.
- [ ] **Aesthetics**: Sobriedad B2B. No gradientes decorativos, no glassmorphism.
- [ ] **Dark Mode**: Validación de contraste de chips y loaders en modo oscuro.

### 3. Accessibility Tier (WCAG 2.1 AA)
- [ ] **Keyboard Nav**: El `Stepper` y `Chip` deben ser operables mediante teclado (Tab, Space, Enter, Arrows).
- [ ] **Aria Regions**: El `AI Panel` debe estar marcado como una región semántica si contiene contenido dinámico.
- [ ] **Focus Management**: Los `Coachmarks` deben manejar el trap de foco correctamente durante el tour.
- [ ] **Screen Readers**: Uso de `aria-live` para el `IA Loader` y `Save Indicator`.
- [ ] **Media A11y**: El `Video Player` debe soportar captions y tener etiquetas claras para todos los botones de control.

### 4. Component-Specific Scenarios

#### Chip
- Verificar que el botón de borrado tiene un target táctil de al menos 44px (o padding suficiente).
- Validar truncado de texto largo con elipsis.

#### Stepper
- Validar comportamiento responsivo (cambio de horizontal a vertical en mobile).
- Asegurar que los pasos futuros no sean clickeables si el flujo es lineal.

#### Media Players
- Verificar que no hay autoplay por defecto (respetar preferencias del usuario).
- Validar estados de error (video no encontrado, audio fallido).

#### AI Components
- Verificar que las animaciones de carga no causen distracción o problemas de sensibilidad al movimiento.

---
*QA Plan v1.0 — Fase 8.7A*
