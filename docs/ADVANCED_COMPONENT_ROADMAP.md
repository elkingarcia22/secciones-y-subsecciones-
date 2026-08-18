# Fase 7D: Advanced Component Roadmap

**Status:** Pendiente implementación  
**Objetivo:** Implementar 29 componentes avanzados en 6 fases granulares (7D.1 - 7D.6).

---

## Timeline Overview

```
Fase 7D.0 (Completada) → Audit
    ↓
Fase 7D.1 → Date/Calendar + Range Inputs
Fase 7D.2 → Upload/Files
Fase 7D.3 → Visual Selection  
Fase 7D.4 → Carousel/Gallery
Fase 7D.5 → Survey Analytics Patterns
Fase 7D.6 → QA Integral Advanced Components
    ↓
Fase 8 → Starter Kit Readiness
```

---

## Fase 7D.1: Date & Range Inputs

**Status:** 7D.1A, 7D.1B, 7D.1C ✅ Listo  
**Duración estimada:** 2-3 sprints  
**Prioridad:** 🔴 ALTA

### Componentes

| Componente | Tipo | Fuente | Dependencias | Estado |
|---|---|---|---|---|
| Calendar | Input | shadcn base | Dialog, Button | ✅ 7D.1A Listo |
| DatePicker | Input | Wrapper UBITS | Calendar, Popover | ✅ 7D.1A Listo |
| DateRangePicker | Input | Wrapper UBITS | Calendar x2, Popover | ✅ 7D.1A Listo |
| MonthPicker | Input | Custom UBITS | Calendar (month mode) | ✅ 7D.1C Listo |
| QuarterSelector | Input | Custom UBITS | Month selector, Button | ✅ 7D.1C Listo |
| PeriodSelector | Input | Custom UBITS | DateRangePicker | ✅ 7D.1C Listo |
| DateFilterBar | Composed | Custom UBITS | DatePicker, DateRangePicker, Button | ✅ 7D.1C Listo |
| Slider | Input | shadcn base / custom | Range input | ✅ 7D.1B Listo |
| RangeSlider | Input | Wrapper UBITS | Slider x2 | ✅ 7D.1B Listo |
| ThresholdSlider | Input | Custom UBITS | Slider, Input | 🔵 Futuro |
| PercentageSlider | Input | Custom UBITS | RangeSlider (0-100) | 🔵 Futuro |

### Orden de Implementación

1. **Calendar** (shadcn base) → DatePicker, DateRangePicker.
2. **Slider** (base) → RangeSlider, ThresholdSlider, PercentageSlider.
3. **MonthPicker** (custom sobre Calendar).
4. **QuarterSelector, PeriodSelector** (compound).
5. **DateFilterBar** (composite UBITS).

### Archivos a Crear

```
src/components/date/
├─ Calendar.tsx           (shadcn base)
├─ DatePicker.tsx         (wrapper UBITS)
├─ DateRangePicker.tsx    (wrapper UBITS)
├─ MonthPicker.tsx        (custom UBITS)
├─ QuarterSelector.tsx    (custom UBITS)
├─ PeriodSelector.tsx     (custom UBITS)
├─ DateFilterBar.tsx      (composite UBITS)
└─ index.ts

src/components/selection/  (o en ui/)
├─ Slider.tsx             (shadcn base / custom)
├─ RangeSlider.tsx        (wrapper UBITS)
├─ ThresholdSlider.tsx    (custom UBITS)
├─ PercentageSlider.tsx   (custom UBITS)
└─ index.ts
```

### Restricciones

- ❌ No instalar date-fns, dayjs, moment u otro parser pesado.
- ❌ No usar bibliotecas de date picker externas.
- ✅ Usar JavaScript nativo (Date, Intl.DateTimeFormat).
- ✅ shadcn Calendar si existe, sino custom UBITS.
- ✅ Tailwind + CSS custom para styling.

### QA Checklist

- [ ] Calendar y DatePicker renderean sin errores.
- [ ] DateRangePicker resuelve rangos correctamente.
- [ ] Slider/RangeSlider validan números.
- [ ] Accesibilidad: ARIA labels, navegación por teclado.
- [ ] Responsive: desktop-first + mobile fallback.
- [ ] Estado: disabled, readonly, error.
- [ ] Integración con Form / Field component.

---

## Fase 7D.2: Upload & Files

**Duración estimada:** 2-3 sprints  
**Prioridad:** 🔴 ALTA

### Componentes

| Componente | Tipo | Fuente | Dependencias | Estado |
|---|---|---|---|---|
| FileUpload | Input | Custom UBITS | Input file, Button, Alert | ✅ 7D.2A Listo |
| UploadZone | Input | Custom UBITS | Drag-drop, FileUpload | ✅ 7D.2A Listo |
| FilePreview | Display | Custom UBITS | Card, Button, Icon | ✅ 7D.2B Listo |
| AttachmentList | Composed | Custom UBITS | FilePreview, Button | ✅ 7D.2B Listo |
| ImportCsvPanel | Composed | Custom UBITS | FileUpload, TableShell | ✅ 7D.2C Listo |
| UploadProgress | Feedback | Custom UBITS | Progress bar | ✅ 7D.2C Listo |

### Orden de Implementación

1. **FileUpload** (input file + validación).
2. **UploadZone** (drop zone + FileUpload).
3. **FilePreview** (card con metadata).
4. **AttachmentList** (lista de FilePreview).
5. **UploadProgress** (progreso + feedback).
6. **ImportCsvPanel** (composite: UploadZone + preview).

### Archivos a Crear

```
src/components/upload/
├─ FileUpload.tsx         (custom UBITS)
├─ UploadZone.tsx         (custom UBITS)
├─ FilePreview.tsx        (custom UBITS)
├─ AttachmentList.tsx     (custom UBITS)
├─ ImportCsvPanel.tsx     (composite UBITS)
├─ UploadProgress.tsx     (custom UBITS)
└─ index.ts
```

### Restricciones

- ❌ No usar dropzone.js ni react-dropzone.
- ❌ No conectar con APIs reales.
- ✅ Drag-drop nativo (HTML5 DragEvent).
- ✅ File API (FileReader, Blob, etc.).
- ✅ Validaciones: tipo (mime), tamaño, cantidad.
- ✅ UI: Card + Button + Progress + Alert.

### QA Checklist

- [ ] FileUpload acepta archivos (click + drag-drop).
- [ ] UploadZone visualiza zona de drop.
- [ ] FilePreview muestra metadata (nombre, tamaño, tipo).
- [ ] AttachmentList lista múltiples archivos.
- [ ] Validaciones funcionan (tipo, tamaño).
- [ ] UploadProgress barra numérica.
- [ ] Estados: uploading, success, error.
- [ ] Accesibilidad: labels, descripciones, keyboard.

---

## Fase 7D.3: Visual Selection

**Duración estimada:** 2 sprints  
**Prioridad:** 🟡 MEDIA

### Componentes

| Componente | Tipo | Fuente | Dependencias | Estado |
|---|---|---|---|---|
| CardSelection | Input | Custom UBITS | Card, Checkbox/Radio | 🔵 Futuro |
| RadioCardGroup | Input | Custom UBITS | CardSelection x N | 🔵 Futuro |
| CheckboxCardGroup | Input | Custom UBITS | CardSelection x N | 🔵 Futuro |
| SegmentedControl | Input | Custom UBITS / Tabs | Button group | 🔵 Futuro |
| OptionTile | Input | Custom UBITS | Card, Badge | 🔵 Futuro |
| SelectableCard | Input | Custom UBITS | Card, Checkbox | 🔵 Futuro |

### Orden de Implementación

1. **CardSelection** (base: card + hidden input).
2. **RadioCardGroup** (N CardSelection + radio logic).
3. **CheckboxCardGroup** (N CardSelection + checkbox logic).
4. **SegmentedControl** (button group alternancia).
5. **OptionTile** (CardSelection + Badge).
6. **SelectableCard** (CardSelection + visual feedback).

### Archivos a Crear

```
src/components/selection/
├─ CardSelection.tsx      (custom UBITS)
├─ RadioCardGroup.tsx     (custom UBITS)
├─ CheckboxCardGroup.tsx  (custom UBITS)
├─ SegmentedControl.tsx   (custom UBITS)
├─ OptionTile.tsx         (custom UBITS)
├─ SelectableCard.tsx     (custom UBITS)
└─ index.ts
```

### Restricciones

- ❌ No usar librerías externas de radio/checkbox.
- ✅ Reutilizar Checkbox y RadioGroup de shadcn.
- ✅ CSS custom para card states (selected, hover, disabled).
- ✅ Accesibilidad: role, aria-checked, aria-selected.

### QA Checklist

- [ ] CardSelection renderea card + input hidden.
- [ ] RadioCardGroup exclusión mutua (una sola).
- [ ] CheckboxCardGroup múltiple (varias).
- [ ] SegmentedControl toggle entre opciones.
- [ ] Estados visuales: default, selected, hover, disabled.
- [ ] Accesibilidad: keyboard, ARIA labels.
- [ ] Integración con Form / Field.

---

## Fase 7D.4: Carousel & Gallery

**Duración estimada:** 2 sprints  
**Prioridad:** 🟢 BAJA

### Componentes

| Componente | Tipo | Fuente | Dependencias | Estado |
|---|---|---|---|---|
| Carousel | Display | Custom UBITS / shadcn | Button, Icon | 🔵 Futuro |
| Gallery | Display | Custom UBITS | Image, CSS grid | 🔵 Futuro |
| ImageGrid | Display | Custom UBITS | CSS grid | 🔵 Futuro |
| PreviewCard | Display | Custom UBITS | Card, Modal, Image | 🔵 Futuro |
| MediaPreview | Display | Custom UBITS | Modal, Media element | 🔵 Futuro |
| EmptyGalleryState | Feedback | Custom UBITS | Icon, Text | 🔵 Futuro |

### Orden de Implementación

1. **Gallery** (CSS grid responsivo).
2. **ImageGrid** (variant bento-style).
3. **Carousel** (slide + prev/next buttons).
4. **PreviewCard** (Gallery item + modal click).
5. **MediaPreview** (modal para video/audio).
6. **EmptyGalleryState** (feedback vacío).

### Archivos a Crear

```
src/components/media/
├─ Carousel.tsx           (custom UBITS)
├─ Gallery.tsx            (custom UBITS)
├─ ImageGrid.tsx          (custom UBITS)
├─ PreviewCard.tsx        (custom UBITS)
├─ MediaPreview.tsx       (custom UBITS)
├─ EmptyGalleryState.tsx  (custom UBITS)
└─ index.ts
```

### Restricciones

- ❌ No usar librerías Carousel (swiper, etc.).
- ✅ Nativo CSS + JavaScript para carousel.
- ✅ CSS Grid para gallery.
- ✅ Responsive: grid-auto-fit, clamp().
- ✅ Lazy loading images (loading="lazy").

### QA Checklist

- [ ] Carousel navega con prev/next.
- [ ] Gallery respeta aspectRatio.
- [ ] ImageGrid responsive (bento-style).
- [ ] PreviewCard abre modal en click.
- [ ] MediaPreview soporta img, video, audio.
- [ ] EmptyGalleryState visible sin datos.
- [ ] Accesibilidad: keyboard (arrow keys), ARIA.

---

## Fase 7D.5: Survey Analytics Patterns

**Duración estimada:** 3-4 sprints  
**Prioridad:** 🔴 ALTA

### Componentes

| Componente | Tipo | Fuente | Dependencias | Estado |
|---|---|---|---|---|
| DeltaPill | Display | Custom UBITS | Icon, Badge | ✅ 7D.5A Listo |
| MetricComparisonFooter | Composed | Custom UBITS | DeltaPill, Text | ✅ 7D.5A Listo |
| InlineLegend | Display | Custom UBITS | Badge, Flex | ✅ 7D.5A Listo |
| ChartSegmentedTabs | Composed | Custom UBITS | SegmentedControl, Chart | 🔵 Futuro |
| ResponseStackedBar | Chart | Custom UBITS (SVG/HTML) | Div, CSS | ✅ 7D.5B Listo |
| ResponseStackedBarGroup | Composed | Custom UBITS | ResponseStackedBar x N | ✅ 7D.5B Listo |
| TrendMetricLineChart | Chart | ECharts preset | EChart, LineChart config | ✅ 7D.5C Listo |
| SurveyMetricCard | Composed | Custom UBITS | Card, Chart, DeltaPill, MetricComparisonFooter | ✅ 7D.5D Listo |
| ParticipationTrendCard | Composed | Custom UBITS | TrendMetricLineChart, Card | ✅ 7D.5D Listo |
| FavorabilityDistributionCard | Composed | Custom UBITS | ResponseStackedBar, Card | ✅ 7D.5D Listo |

### Orden de Implementación

1. **DeltaPill** (↑ ↓ badge simple).
2. **ResponseStackedBar** (SVG/HTML 100% stacked).
3. **ResponseStackedBarGroup** (grupo de barras).
4. **TrendMetricLineChart** (ECharts preset line + area).
5. **InlineLegend** (leyenda inline).
6. **MetricComparisonFooter** (Base | vs Q2 | vs Q1).
7. **ChartSegmentedTabs** (tabs para cambiar periodo).
8. **SurveyMetricCard** (composite principal).
9. **ParticipationTrendCard** (TrendMetricLineChart + metadata).
10. **FavorabilityDistributionCard** (ResponseStackedBar + metadata).

### Archivos a Crear

```
src/components/survey-analytics/
├─ DeltaPill.tsx          (custom UBITS)
├─ MetricComparisonFooter.tsx (custom UBITS)
├─ InlineLegend.tsx       (custom UBITS)
├─ ChartSegmentedTabs.tsx (custom UBITS)
├─ ResponseStackedBar.tsx (custom UBITS SVG)
├─ ResponseStackedBarGroup.tsx (custom UBITS)
├─ TrendMetricLineChart.tsx (ECharts preset)
├─ SurveyMetricCard.tsx   (composite UBITS)
├─ ParticipationTrendCard.tsx (composite UBITS)
├─ FavorabilityDistributionCard.tsx (composite UBITS)
└─ index.ts

src/components/charts/
├─ TrendMetricLineChart.tsx (agregar a charts/)
└─ registerECharts.ts (actualizar si aplica)
```

### Decisiones Técnicas

**ResponseStackedBar:**
- Implementación: SVG inline (no ECharts).
- Razón: control visual fino, accesibilidad, colores por segment.
- Props: segments[], labels[], colors[], percentages.

**TrendMetricLineChart:**
- Implementación: ECharts preset (LineChart + areaStyle + symbols).
- Razón: reutilizar suite, consistencia con otros charts.
- Props: data[], xLabels[], yLabels[], color, showArea, showPoints.

**SurveyMetricCard:**
- Componente compuesto.
- Estructura: header (título + segmentedTabs) + chart + footer (MetricComparisonFooter).
- Props: title, data, periods[], currentPeriod, onPeriodChange.

### Restricciones

- ❌ No crear ECharts custom plugins.
- ✅ ResponseStackedBar: SVG / HTML + CSS.
- ✅ TrendMetricLineChart: reutilizar ECharts config.
- ✅ Colores: usar tokens UBITS (--color-positive, --color-warning, --color-negative).
- ✅ Accesibilidad: describedBy, role="img", accessible data.

### QA Checklist

- [ ] DeltaPill muestra ↑ ↓ con color correcto.
- [ ] ResponseStackedBar renderea 100% stacked.
- [ ] ResponseStackedBarGroup alinea varias barras.
- [ ] TrendMetricLineChart renderea línea + área + symbols.
- [ ] InlineLegend posiciona inline en gráfico.
- [ ] MetricComparisonFooter muestra Base | Q2 | Q1 + deltas.
- [ ] ChartSegmentedTabs cambian período.
- [ ] SurveyMetricCard composición correcta.
- [ ] ParticipationTrendCard datos correctos.
- [ ] FavorabilityDistributionCard visualiza bien.
- [ ] Accesibilidad: ARIA, descriptions, keyboard.
- [ ] Responsive: mobile breakpoint.

---

## Fase 7D.6: QA Integral Advanced Components

**Duración estimada:** 1-2 sprints  
**Prioridad:** 🔴 ALTA

### Scope

- QA automático: tipo, lint, build.
- QA manual: visual regression (screenshots 320px, 768px, 1024px, 1440px).
- QA de accesibilidad: axe, keyboard nav, screen reader.
- QA de integración: componentes juntos en un mockup demo.
- QA de performance: sin memory leaks, renders optimizados.

### Tareas

1. **Unit Tests:** Cada componente tiene test básico (render, props, events).
2. **Integration Tests:** Composites (SurveyMetricCard, DateFilterBar) con datos.
3. **E2E Tests:** Flujo demo completo (seleccionar fecha, subir archivo, ver gráfico).
4. **Visual Regression:** Screenshots en breakpoints clave.
5. **Accessibility Audit:** axe-core, keyboard, ARIA.
6. **Performance Profile:** React DevTools, no memory creaks.
7. **Documentation:** Ejemplos de uso para cada componente.

### Archivos a Generar

```
docs/
├─ SURVEY_ANALYTICS_PATTERNS.md (creado en 7D.0)
├─ ADVANCED_COMPONENT_COVERAGE_AUDIT.md (creado en 7D.0)
├─ ADVANCED_COMPONENT_ROADMAP.md (este archivo)
├─ ADVANCED_COMPONENT_DECISION_MATRIX.md (creado en 7D.0)
├─ ADVANCED_COMPONENTS_QA_REPORT.md (nuevo en 7D.6)
└─ ADVANCED_COMPONENTS_EXAMPLES.md (nuevo en 7D.6)
```

### QA Checklist Fase 7D.6

- [ ] Todos los componentes 7D.1-7D.5 renderean sin error.
- [ ] Build exitoso (`npm run build`).
- [ ] TypeScript no errors.
- [ ] ESLint no errors.
- [ ] Unit tests ≥ 80% coverage (advanced components).
- [ ] E2E tests: flujo demo completo.
- [ ] Visual regression: screenshots OK en 4 breakpoints.
- [ ] Accessibility: axe score ≥ 95%.
- [ ] Keyboard navigation OK (tabs, arrows, enter).
- [ ] Screen reader OK (ARIA labels, descriptions).
- [ ] Performance: no memory leaks, renders < 16ms.
- [ ] Responsive: mobile, tablet, desktop.
- [ ] Dark mode: colores visibles en ambos modos.
- [ ] Documentación: ejemplos de uso creados.
- [ ] Demo/sandbox: página con todos los componentes.

---

## Fase 8: Starter Kit Readiness

**Estado:** Desbloqueada tras 7D.6  
**Objetivo:** Documentación final, guía de adopción, templates de uso.

### Tareas

1. **Migration Guide:** Cómo copiar componentes a nuevos proyectos.
2. **Component Library Docs:** Specs de cada componente.
3. **Design Tokens Reference:** Guía UBITS tokens.
4. **Accessibility Guide:** Cómo hacer componentes accesibles.
5. **Performance Guide:** Best practices.
6. **Examples & Recipes:** Patrones reales de uso.

---

## Restricciones Globales (Fases 7D.1 - 7D.6)

### ❌ Prohibido

- Instalar nuevas dependencias (npm install).
- Ejecutar `shadcn add`.
- Modificar package.json.
- Modificar tokens.css.
- Modificar tailwind.config.js.
- Crear pantallas o dashboards.
- Conectar APIs reales.
- Usar datos hardcodeados en UI.
- Modificar src/styles/.
- Usar librerías pesadas (date-fns, dayjs, dropzone, swiper, etc.).

### ✅ Permitido

- Crear componentes en src/components/ (nuevas carpetas).
- Usar JavaScript nativo (Date, Intl, FileAPI, DragEvent, etc.).
- Usar Tailwind CSS.
- Usar CSS custom variables de tokens.css.
- Usar React hooks (useState, useReducer, useEffect, etc.).
- Integrar con existing components (Button, Card, Input, etc.).
- Reutilizar ECharts (no agregar gráficos nuevos a suite).
- Tests (vitest, Playwright).
- Documentación.

---

## Dependencias Permitidas

### Internas (Reutilizar)
- shadcn componentes existentes.
- ECharts (suite actual).
- Tailwind CSS.
- React, TypeScript.

### No Permitidas
- date-fns, dayjs, moment.
- dropzone.js, react-dropzone.
- swiper, embla-carousel.
- Nuevas dependencias.

---

## Success Criteria

Fase completada cuando:

1. ✅ Todas las fases 7D.1-7D.5 implementadas.
2. ✅ QA integral (7D.6) aprobada.
3. ✅ Build exitoso sin errores.
4. ✅ TypeScript sin warnings.
5. ✅ Tests ≥ 80% coverage.
6. ✅ Visual regression OK.
7. ✅ Accesibilidad ≥ 95%.
8. ✅ Documentación completada.
9. ✅ Fase 8 (Starter Kit Readiness) desbloqueada.
