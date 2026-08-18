# Migration Map (David -> Starter Kit)

| Componente | David (Legacy) | Estado | Estrategia / Archivo |
|---|---|---|---|
| **Button** | `Button` | ✅ Listo | `src/components/ui/button.tsx` |
| **Input** | `Input` | ✅ Listo | `src/components/ui/input.tsx` |
| **Badge** | `Badge` | ✅ Listo | `src/components/ui/badge.tsx` |
| **Dropdown** | `Dropdown` | ✅ Listo | `src/components/ui/dropdown-menu.tsx` |
| **Tooltip** | `Tooltip` | ✅ Listo | `src/components/ui/tooltip.tsx` |
| **Checkbox** | `Checkbox` | ✅ Listo | `src/components/ui/checkbox.tsx` |
| **Radio** | `Radio` | ✅ Listo | `src/components/ui/radio-group.tsx` |
| **Switch** | `Switch` | ✅ Listo | `src/components/ui/switch.tsx` |
| **Modal / Dialog** | `ModalShell` (Dialog) | ✅ Listo | Wrapper UBITS sobre Dialog. |
| **Drawer / Sheet** | `DrawerShell` (Sheet) | ✅ Listo | Wrapper UBITS sobre Sheet. |
| **Confirm / AlertDialog** | `ConfirmDialog` | ✅ Listo | Wrapper UBITS sobre AlertDialog. |
| **Alert** | `Alert` | ✅ Listo | `src/components/ui/alert.tsx` |
| **Skeleton** | `Skeleton` | ✅ Listo | `src/components/ui/skeleton.tsx` |
| **Progress** | `Progress` | ✅ Listo | `src/components/ui/progress.tsx` |
| **Avatar** | `Avatar` | ✅ Listo | `src/components/ui/avatar.tsx` |
| **Pagination** | `Pagination` | ✅ Listo | `src/components/navigation/PaginationShell.tsx` |
| **Accordion** | `Accordion` | ✅ Listo | `src/components/ui/accordion.tsx` |
| **Tag** | `Tag` | ✅ Listo | `src/components/utility/Tag.tsx` |
| **PageHeader** | `PageHeader` | ✅ Listo | `src/components/utility/PageHeader.tsx` |
| **EChart (Base)** | `ECharts` | ✅ Listo | `src/components/charts/EChart.tsx` |
| **ChartShell** | N/A | ✅ Listo | `src/components/charts/ChartShell.tsx` (Contenedor estado) |
| **ChartCard** | N/A | ✅ Listo | `src/components/charts/ChartCard.tsx` (Contenedor visual) |
| **BarChart** | N/A | ⏳ Impl. QA | `src/components/charts/BarChart.tsx` (Preset UBITS) |
| **LineChart** | N/A | ⏳ Impl. QA | `src/components/charts/LineChart.tsx` (Preset UBITS) |
| **AreaChart** | N/A | ✅ Listo | `src/components/charts/AreaChart.tsx` (Preset UBITS) |
| **DonutChart** | N/A | ✅ Listo | `src/components/charts/DonutChart.tsx` (Preset UBITS) |
| **SparklineChart** | N/A | ✅ Listo | `src/components/charts/SparklineChart.tsx` (Preset UBITS) |
| **KpiCard** | N/A | ✅ Listo | `src/components/charts/KpiCard.tsx` (Preset UBITS) |
| **HeatmapChart** | N/A | ✅ Listo | `src/components/charts/HeatmapChart.tsx` (Preset UBITS) |
| **Calendar** | N/A | ✅ 7D.1A | `src/components/ui/calendar.tsx` (shadcn base) |
| **DatePicker** | N/A | ✅ 7D.1A | `src/components/date/DatePicker.tsx` (Wrapper UBITS) |
| **DateRangePicker** | N/A | ✅ 7D.1A | `src/components/date/DateRangePicker.tsx` (Wrapper UBITS) |
| **Slider** | `Slider` | ✅ 7D.1B | `src/components/ui/slider.tsx` |
| **RangeSlider** | `RangeSlider` | ✅ 7D.1B | `src/components/range/RangeSlider.tsx` |

## Fase 7D: Componentes Avanzados

| Componente | Estado | Fase | Archivos |
|---|---|---|---|
| **MonthPicker, QuarterSelector, PeriodSelector, DateFilterBar** | ✅ 7D.1C | 7D.1 | `src/components/date/` |
| **Slider, RangeSlider, ThresholdSlider, PercentageSlider** | En curso (7D.1B) | 7D.1 | `src/components/ui/`, `src/components/range/` |
| **FileUpload, UploadZone** | ✅ 7D.2A | 7D.2 | `src/components/upload/` |
| **FilePreview, AttachmentList** | ✅ 7D.2B | 7D.2 | `src/components/upload/` |
| **ImportCsvPanel, UploadProgress** | ✅ 7D.2C | 7D.2 | `src/components/upload/` |
| **CardSelection, RadioCardGroup** | ✅ 7D.3A | 7D.3 | `src/components/selection/` |
| **CheckboxCardGroup, SelectableCard, OptionTile** | ✅ 7D.3B | 7D.3 | `src/components/selection/` |
| **SegmentedControl** | ✅ 7D.3C | 7D.3 | `src/components/selection/` |
| **Carousel (Base + UbitsWrapper)** | ✅ 7D.4A | 7D.4 | `src/components/media/` |
| **Gallery, ImageGrid** | ✅ 7D.4B | 7D.4 | `src/components/media/` |
| **PreviewCard, MediaPreview, EmptyGalleryState** | ✅ 7D.4C | 7D.4 | `src/components/media/` |
| **DeltaPill, InlineLegend, MetricComparisonFooter** | ✅ 7D.5A | 7D.5 | `src/components/survey-analytics/` |
| **ResponseStackedBar, ResponseStackedBarGroup** | ✅ 7D.5B | 7D.5 | `src/components/survey-analytics/` |
| **TrendMetricLineChart** | ✅ 7D.5C | 7D.5 | `src/components/survey-analytics/` |
| **SurveyMetricCard, ParticipationTrendCard, FavorabilityDistributionCard** | ✅ 7D.5D | 7D.5 | `src/components/survey-analytics/` |

## Fase 8: Gobernanza & Arquitectura

### Fase 8.0: Starter Kit Readiness (✅ 2026-05-05)
- **Status:** Documentación de gobernanza completada

### Fase 8.2: Dashboard Shell Patterns (✅ 2026-05-05)
- **Status:** Arquitectura de patrones completada

### Fase 8.3: Components Decision Gate (✅ 2026-05-05)
- **Status:** Intake & Decision Gate completado para Survey Analytics.

### Fase 8.4: First Screen Build (✅ 2026-05-05)
- **Status:** Survey Analytics Dashboard completado con Hotfix 8.4.1.

### Fase 8.5: Icon System & Production (En curso)
- **8.5A**: Iconly Pro Intake & Architecture (✅ 2026-05-05)
- **Hotfix 8.5A.1**: Icon Governance Alignment (✅ 2026-05-05)
- **8.5B**: Icon Wrapper & Registry (✅ 2026-05-05)
- **Status:** Infraestructura técnica de íconos completada. Wrapper y Registry operativos con fallback Lucide.
- **8.6A Audit: Template UBITS Gap Analysis**
- **Status**: ✅ Ajustado por Hotfix 8.6A.1
- **Foco**: Playground Shell Architecture (Sidebar, SubNav, Responsive, Home Templates).
- **Acción**: Seguir el Roadmap corregido en `TEMPLATE_UBITS_MIGRATION_ROADMAP.md`.
- **8.6B Architecture: Playground Shell Slot Contracts**
- **Status**: ✅ Finalizado
- **8.6C Navigation: Shell Components (Sidebar, SubNav, TabBar)**
- **Status**: ✅ Finalizado con Hotfix 8.6C.1 (Stabilized)
- **Acción**: Shell Demo aprobado. Proceder con Home/List Template en 8.6D.

- **8.5C**: Icon Migration Decision Gate (✅ 2026-05-06)
- **8.5D**: Icon Assets Preparation (Bloqueada - Requiere Assets)

### Fase 8.7: Advanced Interaction & AI Components (✅ 8.7A)
- **8.7A**: ✅ Advanced Interaction & AI Decision Matrix (Cerrado 2026-05-06)
- **Chip, AI-Button, IA Loader, Save Indicator**: ✅ Listo (8.7B)
- **Stepper, Coachmark, AI Panel V2**: ⏳ Diferido (8.7C)
- **Video Player, Audio Player**: ⏳ Diferido (8.7D)
- **Rich Text Editor**: 🔒 BLOQUEADO (8.7E)

## Consideraciones Críticas
1. **Gobernanza de Íconos**: Prohibido el reemplazo masivo. Uso obligatorio de `<UbitsIcon />`.
2. **shadcn/ui base**: Intocable internamente. Lucide permanece como fallback.
3. No se permite la migración directa de código HTML/CSS/JS.
4. Todos los componentes deben ser re-interpretados usando tokens UBITS y lógica de React.

> [!CAUTION]
> La migración real en Fase 8.5D está **BLOQUEADA** hasta que se entreguen los activos Iconly Pro en formato TSX/SVG para los 5 candidatos seleccionados.

---
*Documento actualizado por el equipo de Arquitectura Frontend.*
