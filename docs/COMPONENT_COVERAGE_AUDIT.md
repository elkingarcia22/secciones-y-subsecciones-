# Component Coverage Audit · Fase 7B.1

## Inventario de Componentes Actuales

| Carpeta | Componente | Origen | Estado QA | Uso Principal |
|---|---|---|---|---|
| **ui** | Button | shadcn wrapper | ✅ Aprobado | Acciones principales/secundarias. |
| **ui** | Input | shadcn directo | ✅ Aprobado | Entradas de texto simples. |
| **ui** | Textarea | shadcn directo | ✅ Aprobado | Entradas de texto multilínea. |
| **ui** | Select | shadcn directo | ✅ Aprobado | Selección simple nativa. |
| **ui** | Badge | shadcn directo | ✅ Aprobado | Etiquetas de estado/categoría. |
| **ui** | Card | shadcn directo | ✅ Aprobado | Contenedores de contenido. |
| **ui** | Table | shadcn directo | ✅ Aprobado | Visualización de datos tabular. |
| **ui** | Command | shadcn directo | ✅ Aprobado | Dependencia técnica de Selects avanzados. |
| **ui** | Popover | shadcn directo | ✅ Aprobado | Dependencia técnica de Selects avanzados. |
| **ui** | Dialog | shadcn directo | ✅ Aprobado | Dependencia técnica. |
| **ui** | InputGroup | Propio UBITS | ✅ Aprobado | Agrupador de inputs con iconos. |
| **forms** | Field | Propio UBITS | ✅ Aprobado | Wrapper con Label, Description y Error. |
| **forms** | FormSection | Propio UBITS | ✅ Aprobado | Agrupador visual de campos. |
| **forms** | SearchableSelect| Propio UBITS | ✅ Aprobado | Combobox con búsqueda interna. |
| **forms** | MultiSelect | Propio UBITS | ✅ Aprobado | Selección múltiple con tags. |
| **data-display**| StatusBadge | Propio UBITS | ✅ Aprobado | Badge semántico para estados (Activo, etc). |
| **data-display**| TableShell | Propio UBITS | ✅ Aprobado | Contenedor estructural para tablas. |
| **feedback** | EmptyState | Propio UBITS | ✅ Aprobado | Placeholder visual para falta de datos. |
| **filters** | FilterBar | Propio UBITS | ✅ Aprobado | Infraestructura de filtrado de datos. |
| **layout** | AppShell | Propio UBITS | ✅ Aprobado | Layout principal de la aplicación. |
| **layout** | Header | Propio UBITS | ✅ Aprobado | Cabecera global. |
| **layout** | PageShell | Propio UBITS | ✅ Aprobado | Contenedor de página con ScrollArea. |
| **layout** | SidebarRail | Propio UBITS | ✅ Aprobado | Navegación lateral compacta UBITS. |
| **navigation** | Breadcrumbs | Propio UBITS | ✅ Aprobado | Navegación jerárquica. |
| **navigation** | TabsNav | Propio UBITS | ✅ Aprobado | Navegación por pestañas. |
| **ai** | AIInsightCard | Propio UBITS | ✅ Aprobado | Visualización de hallazgos IA. |
| **ai** | AIPanel | Propio UBITS | ✅ Aprobado | Contenedor semántico para capas IA. |

---

## Auditoría de Componentes Faltantes

| Componente | Tipo | Prioridad | Estrategia Recomendada | Riesgo |
|---|---|---|---|---|
| **Alert** | Feedback | Crítico | shadcn adaptado | Bajo |
| **Dropdown Menu** | Navigation | Crítico | shadcn directo | Medio (densidad) |
| **Tooltip** | Overlay | Crítico | shadcn directo | Bajo |
| **Checkbox** | Form | Crítico | shadcn directo | Bajo |
| **Radio Group** | Form | Crítico | shadcn directo | Bajo |
| **Switch** | Form | Crítico | shadcn directo | Bajo |
| **Skeleton** | Loading | Crítico | shadcn directo | Bajo |
| **Sonner (Toast)** | Feedback | Crítico | shadcn directo | Medio (z-index) |
| **Dialog (Modal)** | Overlay | Crítico | shadcn wrapper (ModalShell) | Medio |
| **Sheet (Drawer)** | Overlay | Crítico | shadcn wrapper (DrawerShell)| Medio |
| **Avatar** | Identity | Importante | shadcn directo | Bajo |
| **Separator** | Utility | Importante | shadcn directo | Bajo |
| **Scroll Area** | Utility | Importante | shadcn directo | Bajo |
| **Pagination** | Navigation | Importante | shadcn wrapper (PaginationShell)| Medio |
| **Progress** | Feedback | Importante | shadcn directo | Bajo |
| **Accordion** | Content | Opcional | shadcn directo | Bajo |
| **Tabs** | Navigation | Opcional | shadcn directo (internal) | Bajo |
| **Slider** | Form | Opcional | shadcn directo | Bajo |
| **Toggle Group** | Form | Opcional | shadcn directo | Bajo |
| **FileUpload** | Form | Futuro | Propio UBITS | Alto |
| **UploadZone** | Form | Futuro | Propio UBITS | Alto |

## Resumen de Brechas
1. **Overlays:** Falta estandarizar el uso de Modales y Drawers como contenedores de alto nivel (Shells).
2. **Controles de Formulario:** Faltan las opciones binarias (Checkbox, Switch, Radio).
3. **Feedback Dinámico:** Falta sistema de notificaciones (Sonner) y estados de carga parcial (Skeleton).
4. **Contexto:** Falta Tooltip para accesibilidad e información densa.
