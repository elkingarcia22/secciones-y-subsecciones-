# Proyecto: Plantilla de Proyectos UBITS + shadcn

## Estado del Roadmap

### Fase 7B: Estandarización de Componentes (Core)
- [x] **Fase 7B.1: Component Coverage Audit**
- [x] **Fase 7B.2: Overlays & Context (Primitivas)**
- [x] **Fase 7B.3: Controles Binarios (Checkbox, Radio, Switch)**
- [x] **Fase 7B.4: Shell Overlays (Contenedores)**
  - [x] Fase 7B.4.1: ModalShell (Dialog).
  - [x] Fase 7B.4.2: DrawerShell (Sheet).
  - [x] Fase 7B.4.3: ConfirmDialog (AlertDialog).
- [x] **Fase 7B.5: Feedback & Status**
  - [x] Fase 7B.5.1: Feedback base (Alert, Skeleton, Progress).
  - [x] Fase 7B.5.2: Notificaciones efímeras (Sonner / Toasts).
- [x] **Fase 7B.6: Identity & Navigation Extra**
  - [x] Fase 7B.6.1: Componentes de identidad (Avatar, Pagination).
  - [x] Fase 7B.6.2: Utility UI opcional (Accordion, Tags, Headers).
- [x] **Fase 7C: Charts / ECharts strategy (Completada)**
  - [x] Fase 7C.1: Definición de arquitectura y estrategia técnica.
  - [x] Fase 7C.2: Instalación de ECharts y creación de wrapper base.
  - [x] Hotfix 7C.2.1: Corrección de theming canvas + lifecycle loading + MutationObserver.
  - [x] Fase 7C.3: ChartShell y ChartCard — contenedores estructurales enterprise.
  - [x] Fase 7C.4: Gráficos de comparación y tendencia (BarChart, LineChart, AreaChart).
  - [x] Fase 7C.5: Composición e Indicadores (DonutChart, SparklineChart, KpiCard).
  - [x] Fase 7C.6: Densidad y Especializados (HeatmapChart).

### Fase 7D: Componentes Avanzados (En curso)
- [x] **Fase 7D.0: Advanced Component Coverage Audit (Completada)**
  - [x] Audit de 52 componentes implementados (39 base, 13 charts).
  - [x] Identificación de 29 componentes faltantes en 6 áreas.
  - [x] Clasificación por tipo (shadcn, UBITS wrapper, custom, ECharts preset, composed).
  - [x] Documentación: ADVANCED_COMPONENT_COVERAGE_AUDIT.md
  - [x] Documentación: ADVANCED_COMPONENT_ROADMAP.md (fases 7D.1-7D.6)
  - [x] Documentación: SURVEY_ANALYTICS_PATTERNS.md (specs visuales)
  - [x] Documentación: ADVANCED_COMPONENT_DECISION_MATRIX.md (matriz decisional)
  - [x] Actualización de ARCHITECTURE.md (nuevas carpetas 7D.1-7D.5)

- [x] **Fase 7D.1A: Calendar + DatePicker + DateRangePicker (Completada)**
  - [x] Componentes: Calendar, DatePicker, DateRangePicker (3/11)
  - [x] Archivos: src/components/ui/calendar.tsx, src/components/date/DatePicker.tsx, src/components/date/DateRangePicker.tsx
  - [x] Restricciones: Nativo JS (Date + Intl.DateTimeFormat), no date-fns en código custom
  - [x] Demo técnica: App.tsx con 6 ejemplos controlados
  - [x] **Hotfix 7D.1A.1**: Refactor de Tokens (HEX removal) y formalización de política de fechas.
  
- [x] **Fase 7D.1B: Slider & Range Selection (Completada)**
  - [x] Componentes: Slider (base), RangeSlider (2/11)
  - [x] Archivos: src/components/ui/slider.tsx, src/components/range/RangeSlider.tsx
  - [x] Restricciones: B2B Enterprise style, no HEX, dual thumb range support
  - [x] Demo técnica: App.tsx con demos de Slider y RangeSlider

- [x] **Fase 7D.1C: Date & Range Inputs - Completar (Completada)**
  - [x] Componentes: MonthPicker, QuarterSelector, PeriodSelector, DateFilterBar (6/11)
  - [x] Carpetas: src/components/date/
  - [x] Restricciones: Nativo JS (no date-fns), composición de componentes existentes.
  - [x] Demo técnica: App.tsx con demos de MonthPicker, QuarterSelector, PeriodSelector y DateFilterBar.

- [x] **Fase 7D.1: Date & Range Inputs (Completada)**
  - [x] 11/11 componentes avanzados implementados.
  - [x] Infraestructura sólida para calendarios, pickers, sliders y filtros temporales.

- [x] **Fase 7D.2A: Upload & Files - Infraestructura Base (Completada)**
  - [x] Componentes: FileUpload, UploadZone (2/6)
  - [x] Carpeta: src/components/upload/
  - [x] Restricciones: HTML5 File API nativa, validación de tamaño y tipo, Drag & Drop.
  - [x] Demo técnica: App.tsx con demos de selección y arrastre de archivos.

- [x] **Fase 7D.2B: Upload & Files - Visualización & Progreso (Completada)**
  - [x] Componentes: FilePreview, AttachmentList (4/6)
  - [x] Carpeta: src/components/upload/
  - [x] Restricciones: Visualización de metadata, variantes card/row/compact, sin lectura de contenido.
  - [x] Demo técnica: App.tsx con demos de previsualización y listados.

- [x] **Fase 7D.2C: Upload & Files - Data Import (Completada)**
  - [x] Componentes: ImportCsvPanel, UploadProgress (6/6)
  - [x] Carpeta: src/components/upload/
  - [x] Restricciones: Previsualización de tabla controlada por props, feedback visual de progreso.
  - [x] Demo técnica: App.tsx con panel de importación y estados de progreso.

- [x] **Fase 7D.3A: Visual Selection - Cards & Radio Groups (Completada)**
  - [x] Componentes: CardSelection, RadioCardGroup (2/6)
  - [x] Carpeta: src/components/selection/
  - [x] Restricciones: Accesibilidad nativa, soporte para iconos/badges, control total por props.
  - [x] Demo técnica: App.tsx con selección de planes y configuraciones.

- [x] **Fase 7D.3B: Visual Selection - Multi & Densa (Completada)**
  - [x] Componentes: CheckboxCardGroup, SelectableCard, OptionTile (3/6)
  - [x] Carpeta: src/components/selection/
  - [x] Restricciones: Selección múltiple visual, tiles compactos para layouts densos.
  - [x] Demo técnica: App.tsx con configuración de seguridad y tiles standalone.

- [x] **Fase 7D.3C: Visual Selection - Segmented (Completada)**
  - [x] Componente: SegmentedControl (1/6)
  - [x] Carpeta: src/components/selection/
  - [x] Restricciones: Variantes solid/underline, accesibilidad radiogroup, control compacto.
  - [x] Demo técnica: App.tsx con conmutadores de vista y nivel de detalle.

- [x] **Fase 7D.4A: Carousel base (Completada)**
  - [x] Componentes: Carousel (shadcn), UbitsCarousel (wrapper) (2/6)
  - [x] Carpeta: src/components/media/
  - [x] Restricciones: Sin autoplay, soporte para dots e indicadores visuales sutiles.
  - [x] Demo técnica: App.tsx con navegación de cards de cursos.

- [x] **Fase 7D.4B: Gallery & ImageGrid (Completada)**
  - [x] Componentes: Gallery, ImageGrid (2/6)
  - [x] Carpeta: src/components/media/
  - [x] Restricciones: CSS grid nativo responsivo, soporte para layouts bento y compact.
  - [x] Demo técnica: App.tsx con galería seleccionable y grid bento.

- [x] **Fase 7D.4C: Media Previews (Completada)**
  - [x] Componentes: PreviewCard, MediaPreview, EmptyGalleryState (3/6)
  - [x] Carpeta: src/components/media/
  - [x] Restricciones: MediaPreview flexible/inline (sin modal real todavía).
  - [x] Demo técnica: App.tsx con visor interactivo y estados vacíos.

- [x] **Fase 7D.5A: Survey Analytics Foundations (Completada)**
  - [x] Componentes: DeltaPill, InlineLegend, MetricComparisonFooter (3/10)
  - [x] Carpeta: src/components/survey-analytics/
  - [x] Restricciones: Átomos puros, sin dashboards.
  - [x] Demo técnica: App.tsx con variantes de deltas y leyendas.

- [x] **Fase 7D.5B: Response Distribution (Completada)**
  - [x] Componentes: ResponseStackedBar, ResponseStackedBarGroup (2/10)
  - [x] Carpeta: src/components/survey-analytics/
  - [x] Restricciones: HTML/SVG nativo para máximo control de segmentación.
  - [x] Demo técnica: App.tsx con escalas Likert y comparativas grupales.

- [x] **Fase 7D.5C: Trend Analytics (Completada)**
  - [x] Componentes: TrendMetricLineChart (preset ECharts) (1/10)
  - [x] Carpeta: src/components/survey-analytics/
  - [x] Restricciones: Uso de infraestructura ECharts existente, sin dashboards.
  - [x] Demo técnica: App.tsx con tendencias simples y comparativas.

- [x] **Fase 7D.5D: Survey Metric Cards (Completada)**
  - [x] Componentes: SurveyMetricCard, FavorabilityDistributionCard, ParticipationTrendCard (9/10)
  - [x] Composición: Uso de átomos de 7D.5A + charts de 7D.5B/C.
  - [x] Demo técnica: App.tsx con demos de las 3 cards y estados.
  - [x] **Hotfix 7D.5D.1**: Corrección de `showComparison` visual y token `text-white`.
  - [x] **Hotfix 7D.5D.2**: Eliminación de `any[]` (tipado estricto) en `TrendMetricLineChart`.

- [x] **Fase 7D.5E: QA Integral Survey Analytics (Completada)**
  - [x] Revisión de accesibilidad WCAG 2.1 en toda la suite.
  - [x] Consistencia de tooltips y leyendas.
  - [x] Hallazgos resueltos: Tipado estricto, selección visual consistente.

- [x] **Fase 7D.6: QA Integral Advanced Components (Completada)**
  - [x] Test coverage >= 80% para todos (7D.1-7D.5)
  - [x] Accesibilidad WCAG 2.1 (ARIA, keyboard, contrast)
  - [x] Responsive (320, 768, 1024, 1440)
  - [x] Dark/light mode compatibility

### Fase 8: Gobernanza & Arquitectura

- [x] **Fase 8.0: Starter Kit Readiness (Completada - 2026-05-05)**
  - [x] STARTER_KIT_READINESS.md: Readiness checklist
  - [x] DASHBOARD_ARCHITECTURE.md: Patrones de composición
  - [x] MOCK_DATA_STRATEGY.md: Estrategia mock
  - [x] SCREEN_BUILD_RULES.md: Proceso intake & QA
  - [x] PHASE_8_ROADMAP.md: Timeline 8.0-8.5

- [x] **Fase 8.2: Dashboard Shell Patterns (Completada - 2026-05-05)**
  - [x] Estructura de layout, recipes de grids, patrones de estado y QA rules.

- [x] **Fase 8.3: Components Decision Gate (Completada - 2026-05-05)**
  - [x] Intake & Component Map para Survey Analytics Dashboard.

- [x] **Fase 8.4: First Screen Build (Completada - 2026-05-05)**
  - [x] Survey Analytics Dashboard implementado con Hotfix 8.4.1.

- [ ] **Fase 8.5: Icon System & Production (En curso)**
  - [x] **8.5A**: Iconly Pro Intake & Architecture (Completada)
  - [x] **Hotfix 8.5A.1**: Icon Governance Alignment (Completada)
  - [x] **8.5B**: Icon Wrapper & Registry (Completada)
  - [x] **Fase 8.5C:** ✅ Icon Migration Decision Gate (Finalizado)
  - [ ] **Fase 8.5D:** Icon Assets Preparation (Bloqueado)
  - [x] **Fase 8.6A:** ✅ UBITS Template Component Gap Audit (Ajustado por Hotfix 8.6A.1)
  - [x] **Fase 8.6B:** ✅ Playground Shell Architecture (Completada)
  - [x] **Fase 8.6C:** ✅ Playground Shell Navigation Components (Completada)
  - [x] **Hotfix 8.6C.1:** ✅ Playground Shell Demo Stabilization (Completada - 2026-05-06)
  - [ ] **Fase 8.7: Advanced Interaction & AI Components (En curso)**
  - [x] **8.7A**: ✅ Advanced Interaction & AI Decision Matrix (Finalizado - 2026-05-06)
  - [x] **QA 8.7A**: ✅ Aprobado (Gobernanza documental certificada)
  - [x] **8.7B**: ✅ Lightweight Status & AI Controls (Implementada - 2026-05-06)
  - [ ] **8.7C**: Guided Interaction Components (Pendiente)
  - [ ] **8.7D**: Media Players (Pendiente)
  - [ ] **8.7E**: Rich Text Decision Gate (Bloqueado)

- [ ] **Fase 9: API Integration (Pendiente)**
