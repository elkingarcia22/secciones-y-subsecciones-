# TEMPLATE_UBITS_MIGRATION_ROADMAP

## Visión General
Hoja de ruta ajustada para la implementación del **Playground Shell**, priorizando la navegación y los templates de Home reusables.

### Fase 8.6B · Playground Shell Architecture (✅ Finalizado)
*Meta: Definir la arquitectura técnica del shell.*
- **8.6B.1**: Definición de la estructura de slots del Shell.
- **8.6B.2**: Estrategia de composición de navegación (Sidebar + SubNav).
- **8.6B.3**: Definición de tokens para Dark/Light mode en el shell.

### Fase 8.6C · Navigation Shell Components (✅ Finalizado)
*Meta: Construir los componentes de navegación core.*
- **8.6C.1**: `PlaygroundSidebar` (Variants Admin/Collaborator).
- **8.6C.2**: `UbitsSubNav` (Breadcrumbs integrados).
- **8.6C.3**: `UbitsMobileTabBar` (Navegación móvil).
- **8.6C.4**: Lógica de toggle de temas integrada en el shell.
- **Hotfix 8.6C.1**: ✅ Estabilización de visuales y tokens (Aprobado).

### Fase 8.6D · Home/List Template (Prioridad Alta)
*Meta: Crear el frame para pantallas de entrada (Entrypoints).*
- **8.6D.1**: `ProductHeader` (Título + Acciones).
- **8.6D.2**: `PageContentFrame` (Contenedor de card blanca).
- **8.6D.3**: `ToolbarPanel` (Buscador + Filtros + List/Table template).

### Fase 8.6E · Responsive + Dark/Light QA
*Meta: Estabilización integral.*
- Validación en Desktop, Tablet y Mobile.
- QA de contraste en Dark Mode.
- Build final v8.6.

### Fase 8.6F · Optional Product-Specific Extensions
- LMS Creator, Rich Text, D&D, Study Chat.
- **Requieren Decision Gate individual.**

---
## Reglas de Migración (Shell Focus)
- **No crear todo a la vez**: Primero arquitectura, luego navegación, luego home template.
- **No crear pantallas de negocio**: El starter solo provee el SHELL y los TEMPLATES.
- **Primero arquitectura**: No construir UI sin el contrato de slots definido.
