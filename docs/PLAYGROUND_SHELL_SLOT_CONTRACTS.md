# PLAYGROUND_SHELL_SLOT_CONTRACTS

## Contratos de Slots (Arquitectura Conceptual)

### 1. Sidebar Slot
- **Propósito**: Navegación principal jerárquica.
- **Props Conceptuales**: `items`, `activeId`, `isCollapsed`, `onToggle`.
- **Contenido Permitido**: Brand Logo, Navigation Items, User Profile Mini, Theme Toggle.
- **Contenido Prohibido**: Filtros de datos, botones de acción de página.
- **Responsive**: Se oculta en < 768px (se activa vía hamburguesa o se reemplaza por MobileTabBar).

### 2. ProductHeader Slot
- **Propósito**: Contexto de producto y acciones globales de pantalla.
- **Props Conceptuales**: `title`, `breadcrumbs`, `actions`.
- **Contenido Permitido**: Títulos, botones de "Crear", selectores de contexto (ej. selección de año).
- **Contenido Prohibido**: Navegación principal de la app.
- **Responsive**: Título se mantiene, acciones pueden colapsar en menú "More".

### 3. SubNav Slot
- **Propósito**: Navegación de segundo nivel (Tabs de sección).
- **Props Conceptuales**: `tabs`, `activeTabId`, `onChange`.
- **Contenido Permitido**: Tabs horizontales, links de anclaje.
- **Contenido Prohibido**: Contenido pesado de datos.
- **Responsive**: Scroll horizontal en móvil.

### 4. Toolbar Slot
- **Propósito**: Control local sobre el conjunto de datos mostrado.
- **Props Conceptuales**: `search`, `filters`, `sort`.
- **Contenido Permitido**: Buscador, botones de filtro con contadores, vista (Grid/List).
- **Contenido Prohibido**: Navegación global.
- **Responsive**: Los filtros se mueven a un Drawer en móvil.

### 5. Content Slot (Main)
- **Propósito**: Renderizado de la lógica principal.
- **Contenido Permitido**: Data Tables, Lists, Charts, Empty States.
- **Responsive**: Adaptable al contenedor (Flex/Grid).

### 6. MobileTabBar Slot
- **Propósito**: Navegación rápida en dispositivos táctiles.
- **Props Conceptuales**: `primaryItems` (max 5).
- **Contenido Permitido**: Home, Search, Alerts, Profile.
- **Contenido Prohibido**: Menús multinivel.
- **Responsive**: Solo visible en < 768px.

## Estados Globales del Shell
- **Initial**: Cargando estructura básica (Skeletons).
- **Immersive**: Modo sin sidebar (ej. lectura de contenido).
- **Empty**: Frame listo sin contenido inyectado.

---
*Definición de Contratos de Slots v1.0*
