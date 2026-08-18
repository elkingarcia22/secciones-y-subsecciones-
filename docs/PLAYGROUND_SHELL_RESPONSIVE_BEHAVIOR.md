# PLAYGROUND_SHELL_RESPONSIVE_BEHAVIOR

## Breakpoints & Layout Adapters

| Breakpoint | Sidebar Behavior | Navigation Strategy | Content Density |
| :--- | :--- | :--- | :--- |
| **Mobile** (375px) | Hidden (Hamburguer) | **UbitsMobileTabBar** | One Column |
| **Tablet** (768px) | Collapsed (Icon Rail) | Sidebar Rail | Adaptive Grid |
| **Desktop** (1024px)| Fixed (Full) | Sidebar + SubNav | Max-width 1200px |
| **Large** (1440px) | Fixed (Full) | Sidebar + SubNav | Max-width 1440px |

## Comportamiento por Componente

### 1. Sidebar
- En Desktop: Siempre visible (240px aprox).
- En Tablet: Se convierte en un riel de iconos (80px).
- En Mobile: Se oculta. Se accede mediante un Drawer lateral si es necesario.

### 2. Top Navigation (SubNav)
- Desktop: Lista horizontal de Tabs.
- Mobile: Scroll horizontal con indicadores de gradiente en los bordes para indicar más contenido.

### 3. Toolbar (Filtros)
- Desktop: Inline (Buscador + Filtros uno al lado del otro).
- Tablet/Mobile: Botón "Filtros" que abre un **DrawerShell**. El buscador ocupa el 100% del ancho.

### 4. PageContentFrame (Card Blanca)
- Desktop/Tablet: Card con sombras suaves y paddings.
- Mobile: Full width (sin bordes redondeados ni sombras) para maximizar el espacio de lectura.

## Reglas de Seguridad
- **No Overflow Horizontal**: Está terminantemente prohibido que el Shell genere scroll horizontal.
- **Touch Targets**: Botones en móvil deben tener un mínimo de 44x44px.
- **Keyboard Safety**: El orden de tabulación debe seguir el flujo visual (Sidebar -> Header -> Content).

---
*Manual de Comportamiento Responsive v1.0*
