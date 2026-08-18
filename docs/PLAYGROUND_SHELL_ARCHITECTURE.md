# PLAYGROUND_SHELL_ARCHITECTURE

## Definición
El **PlaygroundShell** es el marco estructural (App Shell) que define la anatomía de navegación y disposición de las aplicaciones UBITS. Es un componente de infraestructura diseñado para ser altamente reusable, desacoplado del contenido de las pantallas.

### Qué ES PlaygroundShell
- Un contenedor de layout con **Slots** predefinidos.
- Un gestor de estados de navegación (Sidebar colapsado, modo móvil).
- Un orquestador de comportamiento responsive (TabBar vs Sidebar).
- Un guardián de la consistencia visual (Theming Dark/Light).

### Qué NO es PlaygroundShell
- No es una pantalla específica (ej. Dashboard).
- No es una ruta del router.
- No es un componente de negocio.
- No contiene lógica de API o fetch de datos.

## Anatomía por Slots
La arquitectura se basa en un contrato de "huecos" (slots) donde se inyectan los componentes específicos:

1.  **Sidebar Slot**: Navegación vertical principal (Admin/Collaborator).
2.  **Product Context Slot**: Header superior que indica en qué producto/sección está el usuario.
3.  **SubNav Slot**: Navegación secundaria horizontal (Tabs, Breadcrumbs).
4.  **Content Frame Slot**: El área de trabajo principal (Card blanca).
5.  **Toolbar Area Slot**: Espacio para filtros, búsquedas y acciones de página.
6.  **Main Content Slot**: El contenido real (Tablas, Listados, Gráficos).
7.  **Mobile Nav Slot**: Navegación inferior (TabBar) para resoluciones pequeñas.

## Relación Estructural
```text
PlaygroundShell (Frame)
├── Sidebar (Navigation State)
├── TopArea
│   ├── ProductHeader (Context)
│   └── SubNav (Secondary Nav)
└── MainArea (Background Surface)
    └── PageContentFrame (White Card)
        ├── Toolbar (Actionable)
        └── [PAGE_CONTENT] (Injected)
```

## Diferencias Conceptuales
- **Shell**: El esqueleto exterior (Sidebar + Headers).
- **Template**: La disposición interna del `MainArea` (ej. `HomeListTemplate`).
- **Screen**: La composición final de Shell + Template + Mock Data.
- **Dashboard**: Un tipo específico de contenido para el Slot de Main Content.

## Reglas de Composición
- El Shell es agnóstico al contenido: no sabe si dentro hay una encuesta o un curso.
- La navegación debe ser parametrizable mediante un **Navigation Contract**.
- Los Slots pueden estar vacíos (ej. una pantalla sin SubNav).

---
*Arquitectura de Shells UBITS v1.0*
