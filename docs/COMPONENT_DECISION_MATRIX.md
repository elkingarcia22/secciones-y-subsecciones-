# Component Decision Matrix

| Componente | Starter actual | Comparativo | Legacy David | Existe en shadcn | Decisión final | Tipo implementación | Prioridad |
|---|---|---|---|---|---|---|---|
| **Button** | Prueba | Nativo | Custom | Sí | shadcn + Wrapper | shadcn wrapper UBITS | ✅ Aprobado |
| **Card** | Prueba | Nativo | Custom | Sí | shadcn + Wrapper | shadcn wrapper UBITS | ✅ Aprobado |
| **Badge** | Adaptado | Nativo | Custom | Sí | shadcn directo | Variantes UBITS. | ✅ Aprobado |
| **Input** | Adaptado | Nativo | Custom | Sí | shadcn directo | Altura 40px, focus azul. | ✅ Aprobado |
| **Dropdown Menu** | Instalado | N/A | Custom | Sí | shadcn directo | Estilo B2B compacto. | ✅ Aprobado |
| **Tooltip** | Instalado | N/A | Custom | Sí | shadcn directo | Delay 200ms, sobrio. | ✅ Aprobado |
| **Checkbox** | Instalado | N/A | Custom | Sí | shadcn directo | Estado checked azul UBITS.| ✅ Aprobado |
| **Radio Group** | Instalado | N/A | Custom | Sí | shadcn directo | Radios sobrios enterprise. | ✅ Aprobado |
| **Switch** | Instalado | N/A | Custom | Sí | shadcn directo | Alternancia binaria clara. | ✅ Aprobado |
| **ModalShell** | Adaptado | N/A | Custom | Sí | UBITS Wrapper | Wrapper sobre Dialog base. | ✅ Aprobado |
| **ConfirmDialog** | Adaptado | N/A | Custom | Sí | UBITS Wrapper | Wrapper sobre AlertDialog. | ✅ Aprobado |
| **DrawerShell** | Adaptado | N/A | Custom | Sí | UBITS Wrapper | Wrapper sobre Sheet base. | ✅ Aprobado |
| **Alert** | Adaptado | N/A | Custom | Sí | shadcn adaptado | Inline feedback. | ✅ Aprobado |
| **Skeleton** | Adaptado | N/A | Custom | Sí | shadcn directo | Loading states. | ✅ Aprobado |
| **Progress** | Adaptado | N/A | Custom | Sí | shadcn directo | Task completion. | ✅ Aprobado |
| **Avatar** | Instalado | N/A | Custom | Sí | shadcn directo | Identidad visual. | ✅ Aprobado |
| **Pagination** | Instalado | N/A | Custom | Sí | shadcn directo | Navegación base. | ✅ Aprobado |
| **PaginationShell** | Creado | N/A | N/A | No | UBITS Wrapper | Wrapper para tablas. | ✅ Aprobado |
| **Accordion** | Instalado | N/A | Custom | Sí | shadcn directo | Contenido colapsable. | ✅ Aprobado |
| **Tag** | Creado | N/A | N/A | No | UBITS Custom | Categorización ligera. | ✅ Aprobado |
| **SectionHeader** | Creado | N/A | N/A | No | UBITS Custom | Encabezados sección. | ✅ Aprobado |
| **PageHeader** | Creado | N/A | N/A | No | UBITS Custom | Encabezados página. | ✅ Aprobado |
| **Sonner** | Instalado | N/A | Custom | Sí | shadcn directo | Feedback efímero. | ✅ Aprobado |
| **UbitsToaster** | Creado | N/A | N/A | No | UBITS Wrapper | Wrapper sobre Sonner. | ✅ Aprobado |
| **EChart** | Creado | N/A | N/A | No | Apache ECharts | Wrapper base React. | ✅ Aprobado |
| **ChartShell** | Creado | N/A | N/A | No | UBITS Wrapper | Contenedor de estado. | ✅ Aprobado |
| **ChartCard** | Creado | N/A | N/A | No | UBITS Wrapper | Contenedor visual. | ✅ Aprobado |
| **BarChart** | Creado | N/A | N/A | No | UBITS Preset | Gráfico de barras. | ⏳ Pendiente QA |
| **LineChart** | Creado | N/A | N/A | No | UBITS Preset | Gráfico de líneas. | ⏳ Pendiente QA |
| **AreaChart** | Creado | N/A | N/A | No | UBITS Preset | Gráfico de área. | ✅ Aprobado |
| **DonutChart** | Creado | N/A | N/A | No | UBITS Preset | Gráfico circular. | ✅ Aprobado |
| **SparklineChart** | Creado | N/A | N/A | No | UBITS Preset | Gráfico sparkline ultra-compacto. | ✅ Aprobado |
| **KpiCard** | Creado | N/A | N/A | No | UBITS Preset | Card de indicador clave. | ✅ Aprobado |
| **HeatmapChart** | Creado | N/A | N/A | No | UBITS Preset | Gráfico de densidad 2D. | ✅ Aprobado |
| **Calendar** | Creado | Instalado | Sí | Calendar (shadcn) | Selección de fecha en calendario. | ✅ 7D.1A Listo |
| **DatePicker** | Creado | N/A | N/A | No | UBITS Wrapper | Selección de fecha única con popover. | ✅ 7D.1A Listo |
| **DateRangePicker** | Creado | N/A | N/A | No | UBITS Wrapper | Selección de rango temporal. | ✅ 7D.1A Listo |
| **Slider** | Creado | N/A | N/A | Sí | shadcn base | Selector de valor. | ✅ 7D.1B |
| **RangeSlider** | Creado | N/A | N/A | No | UBITS Wrapper | Selector de rango de valores. | ✅ 7D.1B |
| **MonthPicker** | Creado | N/A | N/A | No | UBITS Custom | Selección de mes/año. | ✅ 7D.1C |
| **QuarterSelector** | Creado | N/A | N/A | No | UBITS Custom | Selección de Q1-Q4/año. | ✅ 7D.1C |
| **PeriodSelector** | Creado | N/A | N/A | No | UBITS Custom | Selección periodos predefinidos. | ✅ 7D.1C |
| **DateFilterBar** | Creado | N/A | N/A | No | UBITS Composed | Barra de filtros temporal. | ✅ 7D.1C |
| **FileUpload** | Creado | N/A | N/A | No | UBITS Custom | Selección de archivos nativa. | ✅ 7D.2A |
| **UploadZone** | Creado | N/A | N/A | No | UBITS Custom | Área drag & drop nativa. | ✅ 7D.2A |
| **FilePreview** | Creado | N/A | N/A | No | UBITS Custom | Visualización de metadata de archivo. | ✅ 7D.2B |
| **AttachmentList** | Creado | N/A | N/A | No | UBITS Custom | Lista/Grid de previsualizaciones. | ✅ 7D.2B |
| **UploadProgress** | Creado | N/A | N/A | No | UBITS Custom | Feedback visual de carga/procesamiento. | ✅ 7D.2C |
| **ImportCsvPanel** | Creado | N/A | N/A | No | UBITS Composed | Experiencia completa de importación CSV. | ✅ 7D.2C |
| **CardSelection** | Creado | N/A | N/A | No | UBITS Custom | Selección visual única mediante Cards. | ✅ 7D.3A |
| **RadioCardGroup** | Creado | Radix UI | RadioGroup | No | UBITS Wrapper | Radio group con estética de Cards. | ✅ 7D.3A |
| **SelectableCard** | Creado | N/A | N/A | No | UBITS Custom | Card base seleccionable reusable. | ✅ 7D.3B |
| **OptionTile** | Creado | N/A | N/A | No | UBITS Custom | Tile denso para listas compactas. | ✅ 7D.3B |
| **CheckboxCardGroup** | Creado | N/A | N/A | No | UBITS Custom | Selección múltiple mediante Cards. | ✅ 7D.3B |
| **SegmentedControl** | Creado | N/A | N/A | No | UBITS Custom | Alternador de opciones compacto (solid/underline). | ✅ 7D.3C |
| **Carousel** | Instalado | shadcn/ui | Embla | No | shadcn Base | Componente base de carrusel (Embla). | ✅ 7D.4A |
| **UbitsCarousel** | Creado | N/A | Carousel | No | UBITS Wrapper | Wrapper enterprise con controles y dots. | ✅ 7D.4A |
| **ImageGrid** | Creado | N/A | Card | No | UBITS Custom | Grilla de media con soporte Bento y Compact. | ✅ 7D.4B |
| **Gallery** | Creado | N/A | ImageGrid | No | UBITS Composed | Contenedor de galería con header y estados vacíos. | ✅ 7D.4B |
| **PreviewCard** | Creado | N/A | Card | No | UBITS Custom | Card de previsualización técnica con metadata. | ✅ 7D.4C |
| **MediaPreview** | Creado | N/A | N/A | No | UBITS Custom | Visor estructurado inline para recursos multimedia. | ✅ 7D.4C |
| **EmptyGalleryState** | Creado | N/A | EmptyState | No | UBITS Wrapper | Estado vacío especializado para colecciones media. | ✅ 7D.4C |
| **DeltaPill** | Creado | N/A | Badge | No | UBITS Custom | Indicador de cambio (delta) con tonos semánticos. | ✅ 7D.5A |
| **InlineLegend** | Creado | N/A | N/A | No | UBITS Custom | Leyenda compacta para visualización de datos. | ✅ 7D.5A |
| **MetricComparisonFooter** | Creado | N/A | DeltaPill | No | UBITS Custom | Footer de comparación de métricas en cards. | ✅ 7D.5A |
| **ResponseStackedBar** | Creado | N/A | N/A | No | UBITS Custom | Barra 100% apilada para distribución de respuestas. | ✅ 7D.5B |
| **ResponseStackedBarGroup** | Creado | N/A | ResponseStackedBar | No | UBITS Custom | Grupo de barras apiladas para comparativas. | ✅ 7D.5B |
| **TrendMetricLineChart** | Creado | N/A | LineChart | No | UBITS Preset | Gráfico de tendencia de métrica (ECharts). | ✅ 7D.5C |
| **SurveyMetricCard** | Creado | N/A | KpiCard | No | UBITS Composed | Card de métrica analítica especializada. | ✅ 7D.5D |
| **FavorabilityDistributionCard** | Creado | N/A | ResponseStackedBar | No | UBITS Composed | Card de distribución de favorabilidad. | ✅ 7D.5D |
| **ParticipationTrendCard** | Creado | N/A | TrendMetricLineChart | No | UBITS Composed | Card de tendencia de participación. | ✅ 7D.5D |

## Notas
- **Fase 7B.3:** Controles binarios integrados exitosamente.
- **Fase 7B.5:** Feedback & Status (Alert, Skeleton, Progress, Sonner) integrados.
- **Fase 7C:** Charts suite (BarChart, LineChart, AreaChart, DonutChart, SparklineChart, KpiCard, HeatmapChart) completada.
- **Fase 7D.0:** 29 componentes avanzados faltantes documentados en `ADVANCED_COMPONENT_DECISION_MATRIX.md` (Fase 7D.1-7D.6 planificadas).
- **Fase 8.7A:** Suite de interacción avanzada e IA documentada (Chip, IA-Button, AI Panel V2, Media Players).
