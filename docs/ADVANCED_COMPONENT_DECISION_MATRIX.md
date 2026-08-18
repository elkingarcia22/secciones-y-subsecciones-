# Fase 7D: Advanced Component Decision Matrix

**Estado:** Fase 7D.0 Completada  
**Fecha:** 2026-05-05  
**Objetivo:** Matriz decisional exhaustiva de los 29 componentes avanzados faltantes — tipo, prioridad, fase, dependencias, restricciones.

---

## Resumen Ejecutivo

| Aspecto | Dato |
|---|---|
| **Total componentes** | 29 |
| **Componentes Fase 7D.1** | 11 (Date/Calendar + Sliders) |
| **Componentes Fase 7D.2** | 6 (Upload/Files) |
| **Componentes Fase 7D.3** | 6 (Visual Selection) |
| **Componentes Fase 7D.4** | 6 (Carousel/Gallery) |
| **Componentes Fase 7D.5** | 10 (Survey Analytics) |
| **High Priority** | 5 |
| **Medium Priority** | 5 |
| **Low Priority** | 19 |

---

## Matriz Decisional Completa

### Fase 7D.1: Date & Range Inputs (11 componentes)

| # | Componente | Tipo | Prioridad | Dependencias | Restricciones | Notas | Estado |
|---|---|---|---|---|---|---|---|
| 1 | Calendar | shadcn base | 🔴 Alta | Dialog, Button | No date-fns | Base para DatePicker, DateRangePicker | ✅ 7D.1A Listo |
| 2 | DatePicker | UBITS wrapper | 🔴 Alta | Calendar, Popover | Nativo JS (Date) | Fecha única + icono calendario | ✅ 7D.1A Listo |
| 3 | DateRangePicker | UBITS wrapper | 🔴 Alta | Calendar x2, Popover | Nativo JS | Dual calendar, control rango | ✅ 7D.1A Listo |
| 4 | MonthPicker | Custom UBITS | 🟡 Media | Calendar (modo) | Nativo JS | Selección mes (MM/YYYY) | ✅ 7D.1C Listo |
| 5 | QuarterSelector | Custom UBITS | 🟢 Baja | Month selector, Button | Nativo JS | Selector Q1-Q4 + año | ✅ 7D.1C Listo |
| 6 | PeriodSelector | Custom UBITS | 🟢 Baja | DateRangePicker | Nativo JS | Preset ranges (Today, Week, Month) | ✅ 7D.1C Listo |
| 7 | DateFilterBar | Composed | 🟡 Media | DatePicker, DateRangePicker, Button | Nativo JS | Barra de filtros temporal compuesta | ✅ 7D.1C Listo |
| 8 | Slider | shadcn base | 🟡 Media | Range input | Nativo HTML | Base para RangeSlider, Threshold | ✅ 7D.1B Listo |
| 9 | RangeSlider | UBITS wrapper | 🟡 Media | Slider x2 | Nativo HTML | Dual slider (min-max) | ✅ 7D.1B Listo |
| 10 | ThresholdSlider | Custom UBITS | 🟢 Baja | Slider, Input | Nativo HTML | Slider + threshold indicator |
| 11 | PercentageSlider | Custom UBITS | 🟢 Baja | RangeSlider | 0-100 range | Slider especializado % |

**Archivos a crear:**
```
src/components/date/
├─ Calendar.tsx (shadcn base)
├─ DatePicker.tsx
├─ DateRangePicker.tsx
├─ MonthPicker.tsx
├─ QuarterSelector.tsx
├─ PeriodSelector.tsx
├─ DateFilterBar.tsx
└─ index.ts

src/components/range/
├─ RangeSlider.tsx
└─ index.ts

src/components/selection/
├─ CardSelection.tsx
├─ RadioCardGroup.tsx
├─ CheckboxCardGroup.tsx
├─ SegmentedControl.tsx
├─ OptionTile.tsx
├─ SelectableCard.tsx
└─ index.ts
```

**Restricciones Globales 7D.1:**
- ❌ No date-fns, dayjs, moment, luxon
- ❌ No bibliotecas de date picker externas
- ❌ No react-range-slider, react-input-range
- ✅ Nativo JS (Date, Intl.DateTimeFormat)
- ✅ HTML5 range input
- ✅ Tailwind + CSS custom

---

### Fase 7D.2: Upload & Files (6 componentes)

| # | Componente | Tipo | Prioridad | Dependencias | Restricciones | Notas |
|---|---|---|---|---|---|---|
| 12 | FileUpload | Custom UBITS | 🔴 Alta | Input file, Button, Alert | HTML5 File API | Input file + validación (tipo, tamaño) | ✅ 7D.2A Listo |
| 13 | UploadZone | Custom UBITS | 🔴 Alta | Drag-drop, FileUpload | HTML5 DragEvent | Drop zone visible, feedback visual | ✅ 7D.2A Listo |
| 14 | FilePreview | Custom UBITS | 🟡 Media | Card, Button, Icon | File metadata | Thumbnail + nombre + tamaño + delete | ✅ 7D.2B Listo |
| 15 | AttachmentList | Composed | 🟡 Media | FilePreview, Button | - | Lista de FilePreview + acciones | ✅ 7D.2B Listo |
| 16 | ImportCsvPanel | Composed | 🟡 Media | FileUpload, TableShell | CSV parsing | Upload + preview tabla (parsing simple) | ✅ 7D.2C Listo |
| 17 | UploadProgress | Custom UBITS | 🟡 Media | Progress bar | - | Barra progreso + feedback estado | ✅ 7D.2C Listo |

**Archivos a crear:**
```
src/components/upload/
├─ FileUpload.tsx
├─ UploadZone.tsx
├─ FilePreview.tsx
├─ AttachmentList.tsx
├─ ImportCsvPanel.tsx
├─ UploadProgress.tsx
└─ index.ts
```

**Restricciones Globales 7D.2:**
- ❌ No dropzone.js, react-dropzone
- ❌ No conectar a APIs reales
- ✅ HTML5 Drag-Drop API
- ✅ File API (FileReader, Blob)
- ✅ Validaciones: mime-type, tamaño, cantidad
- ✅ CSV parsing simple (string.split)

---

### Fase 7D.3: Visual Selection (6 componentes)

| # | Componente | Tipo | Prioridad | Dependencias | Restricciones | Notas |
|---|---|---|---|---|---|---|
| 18 | CardSelection | Custom UBITS | 🟡 Media | Card, Input hidden | - | Card seleccionable (visual state) | ✅ 7D.3A Listo |
| 19 | RadioCardGroup | Custom UBITS | 🟡 Media | CardSelection, RadioGroup | Accesible ARIA | Grupo radio como cards | ✅ 7D.3A Listo |
| 20 | CheckboxCardGroup | Custom UBITS | 🟡 Media | CardSelection, Checkbox | Accesible ARIA | Grupo checkbox como cards | ✅ 7D.3B Listo |
| 21 | SegmentedControl | Custom UBITS | 🟡 Media | Button, RadioGroup | - | Control segmentado (pestañas visuales) | ✅ 7D.3C Listo |
| 22 | OptionTile | Custom UBITS | 🟢 Baja | Card, Input hidden | - | Tile seleccionable pequeño | ✅ 7D.3B Listo |
| 23 | SelectableCard | Custom UBITS | 🟢 Baja | Card, state hook | - | Card generic + estado seleccionado | ✅ 7D.3B Listo |

**Archivos a crear:**
```
src/components/selection/
├─ CardSelection.tsx
├─ RadioCardGroup.tsx
├─ CheckboxCardGroup.tsx
├─ SegmentedControl.tsx
├─ OptionTile.tsx
├─ SelectableCard.tsx
└─ index.ts
```

**Restricciones Globales 7D.3:**
- ✅ Sin dependencias externas
- ✅ Accesibilidad WCAG 2.1 (ARIA roles, keyboard nav)
- ✅ Tailwind + CSS custom para estado visual
- ✅ Integrar con RadioGroup, Checkbox base

---

### Fase 7D.4: Carousel & Gallery (6 componentes)

| # | Componente | Tipo | Prioridad | Dependencias | Restricciones | Notas |
|---|---|---|---|---|---|---|
| 24 | Carousel | shadcn + UBITS | 🔴 Alta | embla-carousel-react | - | Navegación horizontal de items | ✅ 7D.4A Listo |
| 25 | Gallery | Custom UBITS | 🟢 Baja | Grid, Image | CSS grid responsivo | Grid de imágenes (3-4 columnas) | ✅ 7D.4B Listo |
| 26 | ImageGrid | Custom UBITS | 🟢 Baja | Gallery, Image | Bento-style grid | Grid bento layout | ✅ 7D.4B Listo |
| 27 | PreviewCard | Custom UBITS | 🟢 Baja | Card, Modal, Image | - | Card con preview modal al click | ✅ 7D.4C Listo |
| 28 | MediaPreview | Custom UBITS | 🟢 Baja | Dialog, Image/Video | - | Visor media (img, video preview) | ✅ 7D.4C Listo |
| 29 | EmptyGalleryState | Custom UBITS | 🟢 Baja | EmptyState | - | Estado vacío especializado | ✅ 7D.4C Listo |

**Archivos a crear:**
```
src/components/media/
├─ UbitsCarousel.tsx
├─ mediaTypes.ts
├─ index.ts
├─ Gallery.tsx
├─ ImageGrid.tsx
├─ PreviewCard.tsx
├─ MediaPreview.tsx
├─ EmptyGalleryState.tsx
└─ index.ts
```

**Restricciones Globales 7D.4:**
- ❌ No swiper.js, embla.js (revisar shadcn primero)
- ✅ CSS grid, flexbox nativo
- ✅ Accesible keyboard + focus management
- ✅ Responsive mobile-first

---

### Fase 7D.5: Survey Analytics Patterns (10 componentes)

| # | Componente | Tipo | Prioridad | Dependencias | Restricciones | Notas |
|---|---|---|---|---|---|---|
| 30 | DeltaPill | Custom UBITS | 🟢 Baja | Badge, Icon | - | Indicador de cambio (delta) | ✅ 7D.5A Listo |
| 31 | MetricComparisonFooter | Custom UBITS | 🟢 Baja | Card, DeltaPill | - | Footer de comparación de métricas | ✅ 7D.5A Listo |
| 32 | InlineLegend | Custom UBITS | 🟢 Baja | - | - | Leyenda compacta de datos | ✅ 7D.5A Listo |
| 33 | ChartSegmentedTabs | UBITS wrapper | 🟡 Media | Tabs, Button | - | Tabs para cambiar periodos |
| 34 | ResponseStackedBar | Custom UBITS | 🔴 Alta | SVG/HTML | 100% stacked bar accesible | Barra 100% segmentada (HTML/SVG) | ✅ 7D.5B Listo |
| 35 | ResponseStackedBarGroup | Custom UBITS | 🟡 Media | ResponseStackedBar | - | Grupo de barras 100% segmentadas | ✅ 7D.5B Listo |
| 36 | TrendMetricLineChart | ECharts preset | 🔴 Alta | EChart, LineChart | - | LineChart + areaStyle + symbols | ✅ 7D.5C Listo |
| 37 | SurveyMetricCard | Composed | 🔴 Alta | Card, TrendMetricLineChart, DeltaPill | - | Card compuesta (métrica + chart + delta) | ✅ 7D.5D |
| 38 | ParticipationTrendCard | Composed | 🟡 Media | Card, TrendMetricLineChart | - | Card compuesta especializada | ✅ 7D.5D |
| 39 | FavorabilityDistributionCard | Composed | 🟡 Media | Card, ResponseStackedBar | - | Card compuesta especializada | ✅ 7D.5D |

**Archivos a crear:**
```
src/components/survey-analytics/
├─ DeltaPill.tsx
├─ MetricComparisonFooter.tsx
├─ InlineLegend.tsx
├─ ChartSegmentedTabs.tsx
├─ ResponseStackedBar.tsx
├─ ResponseStackedBarGroup.tsx
├─ TrendMetricLineChart.tsx
├─ SurveyMetricCard.tsx
├─ ParticipationTrendCard.tsx
├─ FavorabilityDistributionCard.tsx
└─ index.ts

src/components/charts/
├─ TrendMetricLineChart.tsx (nuevo preset)
```

**Restricciones Globales 7D.5:**
- ✅ ECharts preset para TrendMetricLineChart
- ✅ Custom HTML/SVG para ResponseStackedBar (máximo control visual + a11y)
- ✅ Usar tokens de color UBITS (--color-positive, --color-warning, --color-negative)
- ✅ Accesibilidad: ARIA labels, data summary, keyboard nav

---

## Matriz Resumida por Tipo

### shadcn base (3)
| Componente | Fase | Prioridad | Notas |
|---|---|---|---|
| Calendar | 7D.1 | 🔴 Alta | Base para pickers |
| Slider | 7D.1 | 🟡 Media | Base para range sliders |
| Carousel | 7D.4 | 🟢 Baja | Revisar shadcn primero |

### UBITS Wrapper (7)
| Componente | Fase | Prioridad | Notas |
|---|---|---|---|
| DatePicker | 7D.1 | 🔴 Alta | Calendar + Popover |
| DateRangePicker | 7D.1 | 🔴 Alta | Calendar x2 + Popover |
| RangeSlider | 7D.1 | 🟡 Media | Slider x2 |
| ChartSegmentedTabs | 7D.5 | 🟡 Media | Tabs + Button |
| UIShell (overlays) | - | - | Ya implementados |

### Custom UBITS (16)
| Componente | Fase | Prioridad | Notas |
|---|---|---|---|
| MonthPicker | 7D.1 | 🟡 Media | Especializado fecha |
| QuarterSelector | 7D.1 | 🟢 Baja | Q1-Q4 selector |
| PeriodSelector | 7D.1 | 🟢 Baja | Preset ranges |
| DateFilterBar | 7D.1 | 🟡 Media | Barra compuesta |
| ThresholdSlider | 7D.1 | 🟢 Baja | Slider + threshold |
| PercentageSlider | 7D.1 | 🟢 Baja | 0-100 range |
| FileUpload | 7D.2 | 🔴 Alta | Input file + validación |
| UploadZone | 7D.2 | 🔴 Alta | Drag-drop zone |
| FilePreview | 7D.2 | 🟡 Media | Metadata card |
| AttachmentList | 7D.2 | 🟡 Media | Lista archivos |
| UploadProgress | 7D.2 | 🟡 Media | Progress bar |
| CardSelection | 7D.3 | 🟡 Media | Card seleccionable |
| RadioCardGroup | 7D.3 | 🟡 Media | Radio + card |
| CheckboxCardGroup | 7D.3 | 🟡 Media | Checkbox + card |
| SegmentedControl | 7D.3 | 🟡 Media | Control segmentado |
| OptionTile | 7D.3 | 🟢 Baja | Tile pequeño |
| SelectableCard | 7D.3 | 🟢 Baja | Card + estado |
| Gallery | 7D.4 | 🟢 Baja | Grid imágenes |
| ImageGrid | 7D.4 | 🟢 Baja | Bento layout |
| PreviewCard | 7D.4 | 🟢 Baja | Card + modal |
| MediaPreview | 7D.4 | 🟢 Baja | Visor media |
| EmptyGalleryState | 7D.4 | 🟢 Baja | Empty state |
| DeltaPill | 7D.5 | 🟢 Baja | Indicador cambio | ✅ 7D.5A |
| MetricComparisonFooter | 7D.5 | 🟢 Baja | Footer comparativo | ✅ 7D.5A |
| InlineLegend | 7D.5 | 🟢 Baja | Leyenda inline | ✅ 7D.5A |
| ResponseStackedBar | 7D.5 | 🔴 Alta | Barra 100% segmentada | ✅ 7D.5B |
| ResponseStackedBarGroup | 7D.5 | 🟡 Media | Grupo barras | ✅ 7D.5B |

### ECharts Preset (2)
| Componente | Fase | Prioridad | Notas |
|---|---|---|---|
| TrendMetricLineChart | 7D.5 | 🔴 Alta | LineChart especializado |

### Composed (4)
| Componente | Fase | Prioridad | Notas |
|---|---|---|---|
| ImportCsvPanel | 7D.2 | 🟡 Media | Upload + preview tabla |
| SurveyMetricCard | 7D.5 | 🔴 Alta | Card compuesta |
| ParticipationTrendCard | 7D.5 | 🟡 Media | Card especializada |
| FavorabilityDistributionCard | 7D.5 | 🟡 Media | Card especializada |

---

## Análisis de Dependencias

### Cadena de Dependencias Crítica

```
Calendar (7D.1)
  ↓
DatePicker, DateRangePicker (7D.1)
  ↓
PeriodSelector, DateFilterBar (7D.1)
  ↓
Survey Analytics patterns (7D.5)
```

```
Slider (7D.1)
  ↓
RangeSlider, ThresholdSlider, PercentageSlider (7D.1)
```

```
FileUpload (7D.2)
  ↓
UploadZone, FilePreview (7D.2)
  ↓
AttachmentList, ImportCsvPanel (7D.2)
```

```
CardSelection (7D.3)
  ↓
RadioCardGroup, CheckboxCardGroup, SelectableCard (7D.3)
```

```
Gallery (7D.4)
  ↓
ImageGrid, PreviewCard, MediaPreview (7D.4)
```

```
ResponseStackedBar (7D.5)
  ↓
ResponseStackedBarGroup, FavorabilityDistributionCard (7D.5)

TrendMetricLineChart (7D.5)
  ↓
SurveyMetricCard, ParticipationTrendCard (7D.5)

DeltaPill, MetricComparisonFooter, InlineLegend (7D.5)
  ↓
SurveyMetricCard, ParticipationTrendCard, FavorabilityDistributionCard (7D.5)
```

### Orden Recomendado por Fase

**7D.1:** Calendar → (DatePicker, Slider) → DateRangePicker → (MonthPicker, RangeSlider) → (QuarterSelector, PercentageSlider, ThresholdSlider) → (PeriodSelector, DateFilterBar)

**7D.2:** FileUpload → UploadZone → (FilePreview, UploadProgress) → AttachmentList → ImportCsvPanel

**7D.3:** CardSelection → (RadioCardGroup, CheckboxCardGroup) → (SegmentedControl, OptionTile, SelectableCard)

**7D.4:** Gallery → (ImageGrid, PreviewCard) → (MediaPreview, EmptyGalleryState, Carousel)

**7D.5:** ResponseStackedBar → ResponseStackedBarGroup → (DeltaPill, MetricComparisonFooter, InlineLegend) → (TrendMetricLineChart, SurveyMetricCard) → (ParticipationTrendCard, FavorabilityDistributionCard)

---

## Criterios de Aceptación por Componente

### High Priority (5)

**DateRangePicker (7D.1)**
- [ ] Renderea dual calendar sin errores
- [ ] Resuelve rango correctamente (start + end)
- [ ] Navegación keyboard completa
- [ ] ARIA roles y labels
- [ ] Responsive mobile

**FileUpload (7D.2)**
- [ ] Acepta archivos (click + drag-drop)
- [ ] Valida tipo MIME, tamaño
- [ ] Feedback visual de error
- [ ] Progress upload
- [ ] Accesible

**ResponseStackedBar (7D.5)**
- [ ] Barra 100% segmentada
- [ ] Colores semánticos UBITS
- [ ] Tooltip datos
- [ ] Accesible (ARIA, keyboard)
- [ ] Responsive

**TrendMetricLineChart (7D.5)**
- [ ] LineChart + areaStyle
- [ ] Symbols en puntos
- [ ] Tooltip + legend
- [ ] ECharts integration
- [ ] Dark/light mode

**SurveyMetricCard (7D.5)**
- [ ] Card container
- [ ] TrendMetricLineChart + DeltaPill
- [ ] MetricComparisonFooter
- [ ] Estado loading/error
- [ ] Accesible

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Fragmentación date pickers** | Alto | Estandarizar Calendar base en 7D.1 |
| **Upload sin validación robusta** | Alto | Definir validaciones exhaustivas antes de code |
| **Survey patterns inconsistentes** | Alto | Crear spec visual unificada en 7D.5 |
| **Incompatibilidad ECharts vs CSS** | Medio | Usar resolución CSS variables en runtime |
| **A11y incomplete (selection)** | Medio | Auditar RadioCardGroup, CheckboxCardGroup |
| **Dependency chaining failure** | Medio | Respetar orden fase (Calendar antes de DateRangePicker) |

---

## Estructura Final de Carpetas (Post 7D.5)

```
src/components/
├─ date/                    # NEW: Calendar, DatePicker, DateRangePicker, MonthPicker, etc.
├─ upload/                  # NEW: FileUpload, UploadZone, FilePreview, AttachmentList
├─ selection/               # NEW: CardSelection, SegmentedControl, RadioCardGroup, etc.
│                           # MOVED from ui: Slider, RangeSlider, ThresholdSlider, PercentageSlider
├─ media/                   # NEW: Carousel, Gallery, ImageGrid, PreviewCard
├─ survey-analytics/        # NEW: ResponseStackedBar, TrendMetricLineChart, SurveyMetricCard, DeltaPill, etc.
├─ charts/                  # UPDATED: Agregar TrendMetricLineChart preset
├─ ui/                      # (shadcn base)
├─ forms/                   # (SearchableSelect, MultiSelect, Field)
├─ filters/                 # (FilterBar)
├─ overlays/                # (ModalShell, DrawerShell, ConfirmDialog)
├─ feedback/                # (EmptyState, Alert, Skeleton, Progress, UbitsToaster)
├─ layout/                  # (AppShell, PageShell, Header)
├─ navigation/              # (TabsNav, PaginationShell, Breadcrumbs)
├─ utility/                 # (PageHeader, SectionHeader, Tag)
├─ data-display/            # (TableShell, StatusBadge)
└─ ai/                      # (AIInsightCard, AIPanel)
```

---

## QA Checklist - Fase 7D (Todos los componentes)

- [ ] Todos los componentes renderean sin errores de console
- [ ] TypeScript types estrictos (no `any`)
- [ ] Props documentadas con JSDoc o TS interfaces
- [ ] Accesibilidad WCAG 2.1 (ARIA, keyboard, contrast)
- [ ] Responsive (mobile-first: 320, 768, 1024, 1440)
- [ ] Estados: default, hover, focus, active, disabled
- [ ] Dark/light mode compatibility
- [ ] No hardcoded colors (usar tokens CSS)
- [ ] Build y lint sin errores
- [ ] Test coverage >= 80%
- [ ] Documentación completa (README, examples)
- [ ] Integration con Form, FilterBar, etc.

## Fase 8.7: Advanced Interaction & AI Components (Nueva Suite)

| # | Componente | Tipo | Prioridad | Base sugerida | Riesgo | Estado |
|---|---|---|---|---|---|---|
| 40 | Chip | UBITS Wrapper | 🔴 Alta | Badge + Button | Bajo | ✅ 8.7B |
| 41 | IA-Button | UBITS Wrapper | 🔴 Alta | Button + Sparkles | Bajo | ✅ 8.7B |
| 42 | IA Loader | Custom UBITS | 🔴 Alta | SVG / Skeleton | Bajo | ✅ 8.7B |
| 43 | Save Indicator | Custom UBITS | 🔴 Alta | Badge / Alert | Bajo | ✅ 8.7B |
| 44 | Stepper | Custom UBITS | 🟡 Media | Button / Card | Medio | ⏳ 8.7C |
| 45 | Coachmark | Composed UBITS | 🟡 Media | Popover / Portal | Medio | ⏳ 8.7C |
| 46 | AI Panel V2 | Composed UBITS | 🟡 Media | Card / Tabs | Medio | ⏳ 8.7C |
| 47 | Video Player | Custom UBITS | 🟡 Media | HTML5 `<video>` | Medio | ⏳ 8.7D |
| 48 | Audio Player | Custom UBITS | 🟡 Media | HTML5 `<audio>` | Medio | ⏳ 8.7D |
| 49 | Rich Text Editor | **Bloqueado** | 🟢 Baja | N/A | **Alto** | 🔒 8.7E |

**Archivos conceptuales:**
```
src/components/ai/
├─ IAButton.tsx
├─ IALoader.tsx
└─ AIPanel.tsx (V2)

src/components/utility/
├─ Chip.tsx
└─ SaveIndicator.tsx

src/components/navigation/
└─ Stepper.tsx

src/components/overlays/
└─ Coachmark.tsx

src/components/media/
├─ VideoPlayer.tsx
├─ AudioPlayer.tsx
```

**Restricciones Globales 8.7:**
- ❌ No dependencias externas pesadas (Tiptap, Plyr, etc.)
- ❌ No gradientes decorativos fuera de la identidad IA
- ✅ Uso estricto de tokens de IA (`color-ai-*`)
- ✅ Accesibilidad WCAG 2.1 (ARIA, focus trap en Coachmarks)
- ✅ Media players basados en elementos nativos HTML5
- [ ] Dark/light mode compatibility
- [ ] No hardcoded colors (usar tokens CSS)
- [ ] Build y lint sin errores
- [ ] Test coverage >= 80%
- [ ] Documentación completa (README, examples)
