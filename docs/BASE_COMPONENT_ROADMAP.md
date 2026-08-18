# Base Component Roadmap · Fase 7B

## Estrategia General
Cerrar el catálogo de componentes base mediante fases granulares para asegurar la calidad visual UBITS y la estabilidad técnica antes de introducir librerías de visualización (ECharts).

---

## Fases de Construcción

### Fase 7B.2: Overlays & Context
**Objetivo:** Habilitar interactividad de profundidad y ayuda contextual.
- **Componentes:**
  - `Dropdown Menu` (shadcn)
  - `Tooltip` (shadcn)
  - `Separator` (shadcn)
  - `Scroll Area` (shadcn)
- **QA:** Validar z-index y colisiones en AppShell.

### Fase 7B.3: Binary Form Controls
**Objetivo:** Completar la suite de entradas de formulario.
- **Componentes:**
  - `Checkbox` (shadcn)
  - `Radio Group` (shadcn)
  - `Switch` (shadcn)
  - `Label` (shadcn - dependencia técnica)
- **Integración:** Deben ser compatibles con el componente `Field`.

### Fase 7B.4: Shell Overlays (Modals & Drawers)
**Objetivo:** Crear contenedores de alto nivel para flujos complejos.
- **Componentes:**
  - `Dialog` -> `ModalShell` (Wrapper UBITS)
  - `Sheet` -> `DrawerShell` (Wrapper UBITS)
  - `Alert Dialog` (shadcn)
- **QA:** Validar bloqueo de scroll y accesibilidad de foco.

### Fase 7B.5: Feedback & Status
**Objetivo:** Mejorar la comunicación de estados y carga.
- **Componentes:**
  - `Alert` (shadcn adaptado)
  - `Skeleton` (shadcn)
  - `Progress` (shadcn)
  - `Sonner` (Toast)
- **QA:** Validar visibilidad en Light/Dark mode.

### Fase 7B.6: Identity & Navigation Extra
**Objetivo:** Pulir detalles de usuario y navegación paginada.
- **Componentes:**
  - `Avatar` (shadcn)
  - `Pagination` -> `PaginationShell` (Wrapper UBITS)
- **QA:** Consistencia con SidebarRail y TableShell.

### Fase 7B.7: Complex Utilities (Futuro)
**Objetivo:** Manejo de archivos y controles avanzados.
- **Componentes:**
  - `FileUpload` (Propio UBITS)
  - `UploadZone` (Propio UBITS)
  - `Slider` (shadcn)

---

## Restricciones por Fase
- **No HEX:** Prohibido el uso de valores hexadecimales.
- **Density:** Mantener el estándar UBITS (40px de altura base para controles).
- **Accessibility:** WCAG AA obligatorio.
- **Dependencies:** Solo se permiten componentes de shadcn/ui. Prohibido TanStack o ECharts hasta completar estas fases.
