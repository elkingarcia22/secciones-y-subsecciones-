# Icon Migration Map - Phase 8.5A

## Category: UI Atoms (High Priority Audit - NO IMPLEMENTATION)
> [!IMPORTANT]
> **Regla de Oro**: Los componentes base de `shadcn/ui` (Button, Select, Badge, etc.) NO se modifican internamente. Su prioridad alta en este mapa significa que se auditará su capacidad para recibir íconos personalizados via props (`UbitsIcon`) en composiciones de negocio, pero su implementación SVG interna permanece en Lucide como fallback técnico.

| Component | Current Lucide Icon | Iconly Pro Equivalent | Status |
|---|---|---|---|
| Button | Chevron, Arrow | Arrow-Right, Arrow-Left | Audit Only |
| Select | ChevronDown | Chevron-Down | Audit Only |
| Checkbox | Check | Tick-Square | Audit Only |
| Badge | X (Close) | Close-Square | Audit Only |
| Alert | AlertCircle, CheckCircle | Danger, Tick-Square | Audit Only |

## Category: Business Components (Real Migration Target)
> Estos componentes de negocio sí migrarán su implementación interna a Iconly Pro una vez confirmados los activos.

| Component | Current Lucide Icon | Iconly Pro Equivalent | Status |
|---|---|---|---|
| Survey Analytics Suite | AlertCircle, TrendingUp/Down | Info-Square, Chart-Up/Down | Pending |
| Dashboard Layout | Bell, Search | Notification, Search | Pending |
| Participation Cards | CalendarIcon | Calendar | Pending |

## Category: Date & Range (Medium Priority)
| Component | Current Lucide Icon | Iconly Pro Equivalent | Status |
|---|---|---|---|
| DatePicker | CalendarIcon | Calendar | Pending |
| RangeSlider | N/A | Filter | Pending |
| MonthPicker | ChevronLeft/Right | Arrow-Left/Right | Pending |

## Category: Upload & Files (Medium Priority)
| Component | Current Lucide Icon | Iconly Pro Equivalent | Status |
|---|---|---|---|
| FileUpload | Upload | Upload | Pending |
| UploadZone | UploadCloud | Document-Upload | Pending |
| FilePreview | FileText, Image, Video | Document, Image, Video | Pending |

## Category: Survey Analytics (Phase 8.4 Support)
| Component | Current Lucide Icon | Iconly Pro Equivalent | Status |
|---|---|---|---|
| DeltaPill | TrendingUp/Down | Chart-Up/Down | Pending |
| KPI Cards | AlertCircle | Info-Square | Pending |
| Dashboard Header | Bell, Search | Notification, Search | Pending |

## Components to EXCLUDE from initial migration
- `echarts` internal icons (managed by library).
- `sonner` internal icons (managed by library until next hotfix).
- `lucide-react` internal references in `node_modules`.
