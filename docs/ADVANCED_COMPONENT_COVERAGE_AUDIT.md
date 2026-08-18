# Fase 7D.0: Advanced Component Coverage Audit

**Estado:** Implementado  
**Fecha:** 2026-05-05  
**Objetivo:** Auditar, clasificar y documentar componentes avanzados faltantes antes de QA integral final.

---

## Resumen Ejecutivo

Tras completar **Fase 7C** (Charts Suite), el starter kit cubre componentes base enterprise (overlays, controles binarios, feedback, navegación, gráficos) pero carece de:

- **Date/Calendar inputs** → Calendar, DatePicker, DateRangePicker, etc.
- **Upload/Files** → FileUpload, UploadZone, FilePreview, AttachmentList.
- **Visual Selection** → CardSelection, SegmentedControl, RadioCardGroup, CheckboxCardGroup.
- **Media/Carousel** → Carousel, Gallery, ImageGrid, PreviewCard.
- **Survey Analytics Patterns** → DeltaPill, ResponseStackedBar, TrendMetricLineChart, SurveyMetricCard, MetricComparisonFooter, InlineLegend.

**Impacto:** Sin estos componentes, no pueden reproducirse interfaces enterprise reales de:
- Formularios con filtros avanzados.
- Gestión de archivos y carga.
- Cards analíticas de encuestas y reportes.
- Comparativos y deltas.
- Galerías de medios.

**Decisión:** Implementar roadmap granular **7D.1 a 7D.6** para cubrir gaps antes de QA integral (7D.6).

---

## Inventario Actual (Fase 7C Completa)

### Componentes UI Base (shadcn)
| Componente | Carpeta | Tipo | Estado |
|---|---|---|---|
| Button | ui | shadcn | ✅ |
| Card | ui | shadcn | ✅ |
| Input | ui | shadcn | ✅ |
| Textarea | ui | shadcn | ✅ |
| Select | ui | shadcn | ✅ |
| Checkbox | ui | shadcn | ✅ |
| RadioGroup | ui | shadcn | ✅ |
| Switch | ui | shadcn | ✅ |
| Badge | ui | shadcn | ✅ |
| Dropdown Menu | ui | shadcn | ✅ |
| Tooltip | ui | shadcn | ✅ |
| Accordion | ui | shadcn | ✅ |
| Avatar | ui | shadcn | ✅ |
| Pagination | ui | shadcn | ✅ |
| Progress | ui | shadcn | ✅ |
| Skeleton | ui | shadcn | ✅ |
| Popover | ui | shadcn | ✅ |
| Dialog | ui | shadcn | ✅ |
| Sheet | ui | shadcn | ✅ |
| AlertDialog | ui | shadcn | ✅ |
| Command (SearchableSelect base) | ui | shadcn | ✅ |
| Sonner | ui | shadcn | ✅ |

### Componentes UBITS Wrapper/Custom (Base Enterprise)
| Componente | Carpeta | Tipo | Estado |
|---|---|---|---|
| ModalShell | overlays | Wrapper UBITS | ✅ |
| DrawerShell | overlays | Wrapper UBITS | ✅ |
| ConfirmDialog | overlays | Wrapper UBITS | ✅ |
| UbitsToaster | feedback | Wrapper UBITS | ✅ |
| SearchableSelect | forms | Wrapper UBITS | ✅ |
| MultiSelect | forms | Wrapper UBITS | ✅ |
| FilterBar | filters | Wrapper UBITS | ✅ |
| PaginationShell | navigation | Wrapper UBITS | ✅ |
| TabsNav | navigation | Wrapper UBITS | ✅ |
| PageHeader | utility | Custom UBITS | ✅ |
| SectionHeader | utility | Custom UBITS | ✅ |
| Tag | utility | Custom UBITS | ✅ |
| EmptyState | feedback | Custom UBITS | ✅ |
| Alert | feedback | shadcn adaptado | ✅ |
| StatusBadge | data-display | Custom UBITS | ✅ |
| TableShell | data-display | Custom UBITS | ✅ |
| Breadcrumbs | navigation | Custom UBITS | ✅ |
| AIInsightCard | ai | Custom UBITS | ✅ |
| AIPanel | ai | Custom UBITS | ✅ |
| AppShell | layout | Custom UBITS | ✅ |
| PageShell | layout | Custom UBITS | ✅ |
| Header | layout | Custom UBITS | ✅ |

### Componentes Charts (Apache ECharts Presets)
| Componente | Carpeta | Tipo | Estado |
|---|---|---|---|
| EChart | charts | ECharts wrapper | ✅ |
| ChartShell | charts | Wrapper UBITS | ✅ |
| ChartCard | charts | Wrapper UBITS | ✅ |
| BarChart | charts | ECharts preset | ✅ |
| LineChart | charts | ECharts preset | ✅ |
| AreaChart | charts | ECharts preset | ✅ |
| DonutChart | charts | ECharts preset | ✅ |
| SparklineChart | charts | ECharts preset | ✅ |
| KpiCard | charts | ECharts preset | ✅ |
| HeatmapChart | charts | ECharts preset | ✅ |

**Total:** 52 componentes implementados (39 base, 13 charts).

---

## Brechas Identificadas

### 1. Date / Calendar / Time Filters
**Brecha:** Sin date picker inteligente, date range picker ni calendar, no hay forma de:
- Filtrar datos por rango de fechas.
- Seleccionar período (Quarter, Month, Year).
- Comparar períodos (Q2 vs Q1, etc.).

**Componentes faltantes:**
- `Calendar` — shadcn base adaptado.
- `DatePicker` — wrapper UBITS sobre Calendar + Popover.
- `DateRangePicker` — wrapper UBITS.
- `MonthPicker` — wrapper UBITS.
- `QuarterSelector` — custom UBITS.
- `PeriodSelector` — custom UBITS.
- `DateFilterBar` — custom UBITS compuesto.

**Fase sugerida:** 7D.1

---

### 2. Upload / Files
**Brecha:** Sin componentes de carga de archivos, importación CSV, o gestión de adjuntos.

**Componentes faltantes:**
- `FileUpload` — custom UBITS (drag-drop, file validation).
- `UploadZone` — custom UBITS (drop zone visible).
- `FilePreview` — custom UBITS (thumbnails, metadata).
- `AttachmentList` — custom UBITS (listado con acciones).
- `ImportCsvPanel` — custom UBITS (CSV import con preview).
- `UploadProgress` — custom UBITS (barra de progreso de carga).

**Fase sugerida:** 7D.2

---

### 3. Slider / Range
**Brecha:** Sin sliders numéricos para filtros de rango o ajuste de valores.

**Componentes faltantes:**
- `Slider` — shadcn base adaptado.
- `RangeSlider` — wrapper UBITS.
- `ThresholdSlider` — custom UBITS (slider con threshold).
- `PercentageSlider` — custom UBITS (0-100).

**Fase sugerida:** 7D.1

---

### 4. Visual Selection (Cards, Tiles, Segmented)
**Brecha:** Sin componentes de selección visual (radio/checkbox como cards), ni segmented controls.

**Componentes faltantes:**
- `CardSelection` — custom UBITS (card seleccionable).
- `RadioCardGroup` — custom UBITS (grupo de radio cards).
- `CheckboxCardGroup` — custom UBITS (grupo de checkbox cards).
- `SegmentedControl` — custom UBITS o adaptado de Tabs.
- `OptionTile` — custom UBITS (tile seleccionable).
- `SelectableCard` — custom UBITS (card con estado seleccionado).

**Fase sugerida:** 7D.3

---

### 5. Carousel / Gallery / Media
**Brecha:** Sin carousels interactivos, galerías de imágenes o previsualizadores de medios.

**Componentes faltantes:**
- `Carousel` — shadcn base si aplica, sino custom UBITS.
- `Gallery` — custom UBITS (grid de imágenes).
- `ImageGrid` — custom UBITS (grid responsivo).
- `PreviewCard` — custom UBITS (card con preview modal).
- `MediaPreview` — custom UBITS (visor de medios).
- `EmptyGalleryState` — custom UBITS (estado vacío).

**Fase sugerida:** 7D.4

---

### 6. Survey Analytics Patterns
**Brecha:** Sin componentes especializados para cards analíticas de encuestas (favorabilidad, participación, tendencia, comparativos, deltas).

**Componentes faltantes:**
- `DeltaPill` — custom UBITS (indicador de cambio ↑ ↓).
- `MetricComparisonFooter` — custom UBITS (footer comparativo Base vs Q2 vs Q1).
- `InlineLegend` — custom UBITS (leyenda inline en gráficos).
- `ChartSegmentedTabs` — wrapper UBITS (tabs para cambiar periodos).
- `ResponseStackedBar` — custom UBITS CSS/HTML (barra 100% segmentada).
- `ResponseStackedBarGroup` — custom UBITS (grupo de barras segmentadas).
- `TrendMetricLineChart` — ECharts preset (línea con puntos y labels).
- `SurveyMetricCard` — componente compuesto UBITS (card con métrica + chart).
- `ParticipationTrendCard` — componente compuesto UBITS.
- `FavorabilityDistributionCard` — componente compuesto UBITS.

**Fase sugerida:** 7D.5

---

## Chart Gaps Audit

**¿La suite actual de charts (Fase 7C) cubre los patrones enterprise?**

| Patrón | Cobertura | Componente | Decisión |
|---|---|---|---|
| Stacked horizontal 100% response bars | ❌ No | ResponseStackedBar | Custom HTML/CSS (accesibilidad, control visual) |
| Line trend with points & labels | ⚠️ Parcial | LineChart | TrendMetricLineChart (ECharts preset específico) |
| Area trend with highlighted point | ⚠️ Parcial | AreaChart | Extender AreaChart o usar TrendMetricLineChart |
| Comparison footer (Base/Q2/Q1) | ❌ No | MetricComparisonFooter | Custom UBITS compuesto |
| Donut/Pie | ✅ Sí | DonutChart | ✅ Listo |
| Sparkline | ✅ Sí | SparklineChart | ✅ Listo |
| Heatmap | ✅ Sí | HeatmapChart | ✅ Listo |
| KPI | ✅ Sí | KpiCard | ✅ Listo |
| Chart empty/loading/error | ✅ Sí | ChartCard | ✅ ChartShell maneja estados |
| Chart accessibility summary | ✅ Sí | ChartCard.summary | ✅ Slot disponible |

**Decisión:** TrendMetricLineChart es **ECharts preset** (no duplicar LineChart). ResponseStackedBar es **custom HTML/CSS** para máximo control visual y accesibilidad.

---

## Riesgos Identificados

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Fragmentación de datos date pickers** | Alto | Estandarizar en Fase 7D.1 con calendarios compartidos |
| **Upload sin validación** | Alto | Definir reglas de validación en Fase 7D.2 |
| **Survey patterns inconsistentes** | Alto | Crear spec visual unificada en Fase 7D.5 |
| **Incompatibilidad ECharts vs CSS** | Medio | Definir límites claros (ECharts para datos, CSS para estructura) |
| **Accesibilidad de selección visual** | Medio | Auditar RadioCardGroup, CheckboxCardGroup en Fase 7D.3 |

---

## Prioridades

### 🔴 Alta Prioridad (Bloquean prototipos reales)
1. **DateRangePicker** — necesario en todo filtro temporal.
2. **FileUpload / UploadZone** — necesario para importaciones.
3. **ResponseStackedBar** — clave en encuestas.
4. **SurveyMetricCard** — patrón reincidente en dashboards.
5. **TrendMetricLineChart** — evolución temporal imprescindible.

### 🟡 Media Prioridad (Mejoran UX, no bloquean)
1. DatePicker simple.
2. Slider / RangeSlider.
3. SegmentedControl.
4. CardSelection.
5. MetricComparisonFooter.

### 🟢 Baja Prioridad (Polish, opcional)
1. MonthPicker, QuarterSelector.
2. Carousel.
3. Gallery / ImageGrid.
4. DeltaPill (puede existir como utility).
5. PreviewCard.

---

## Decisiones de Implementación

### Por Componente

**Inputs & Selection:**
- `Calendar` → shadcn base directo.
- `DatePicker` → Wrapper UBITS (Calendar + Popover, fecha única).
- `DateRangePicker` → Wrapper UBITS (Calendar dual, rango).
- `Slider` → shadcn base directo (si existe) o custom.
- `RangeSlider` → Wrapper UBITS.
- `CardSelection` → Custom UBITS (card + input hidden).
- `SegmentedControl` → Custom UBITS o adaptar Tabs.

**Upload:**
- `FileUpload` → Custom UBITS (drag-drop, input file, validación).
- `UploadZone` → Custom UBITS (drop zone visible, similar a Dropzone.js pero simple).
- `FilePreview` → Custom UBITS (card con thumbnail, metadata, delete).
- `AttachmentList` → Custom UBITS (lista de FilePreview + acciones).

**Media:**
- `Carousel` → Evaluar shadcn + Embla. Si no existe, custom UBITS.
- `Gallery` → Custom UBITS (CSS grid responsivo).
- `ImageGrid` → Custom UBITS (bento-style grid).

**Charts:**
- `ResponseStackedBar` → Custom UBITS (SVG/HTML, 100% stacked, accesible).
- `TrendMetricLineChart` → ECharts preset (LineChart + areaStyle + symbols).
- `SurveyMetricCard` → Componente compuesto (Card + TrendMetricLineChart + MetricComparisonFooter + badge).

---

## Estructura de Carpetas (Futura)

Tras 7D.1-7D.5:

```text
src/components/
├─ date/                    # NEW: Calendar, DatePicker, DateRangePicker, MonthPicker
├─ upload/                  # NEW: FileUpload, UploadZone, FilePreview, AttachmentList
├─ selection/               # NEW: CardSelection, SegmentedControl, RadioCardGroup, CheckboxCardGroup
├─ media/                   # NEW: Carousel, Gallery, ImageGrid, PreviewCard
├─ survey-analytics/        # NEW: ResponseStackedBar, TrendMetricLineChart, SurveyMetricCard, DeltaPill, MetricComparisonFooter
├─ charts/                  # UPDATED: agregar TrendMetricLineChart preset
├─ ui/                      # (sin cambios)
├─ forms/                   # (sin cambios)
├─ filters/                 # (sin cambios)
├─ overlays/                # (sin cambios)
├─ feedback/                # (sin cambios)
├─ layout/                  # (sin cambios)
├─ navigation/              # (sin cambios)
├─ utility/                 # (sin cambios)
├─ data-display/            # (sin cambios)
└─ ai/                      # (sin cambios)
```

---

## Próximos Pasos

1. ✅ Crear **docs/ADVANCED_COMPONENT_ROADMAP.md** (phases 7D.1-7D.6).
2. ✅ Crear **docs/SURVEY_ANALYTICS_PATTERNS.md** (specs visuales).
3. ✅ Crear **docs/ADVANCED_COMPONENT_DECISION_MATRIX.md** (matriz detallada).
4. ✅ Actualizar **docs/ARCHITECTURE.md** (nuevas carpetas).
5. ✅ Actualizar **docs/ROADMAP.md** (fases 7D).
6. ✅ Actualizar **docs/QA_CHECKLIST.md** (7D.0 checklist).
7. ✅ Actualizar **docs/PROMPT_LOG.md** (registro de fase).

---

## QA Checklist - Fase 7D.0

- [x] Audit completado sin src/ changes.
- [x] Audit completado sin package.json changes.
- [x] Componentes faltantes identificados (29 total).
- [x] Brechas clasificadas por área (6 áreas principales).
- [x] Decisiones por componente documentadas.
- [x] Roadmap 7D.1-7D.6 definido.
- [x] Riesgos identificados.
- [x] Prioridades claras.
- [x] Documentación lista para 7D.1.
