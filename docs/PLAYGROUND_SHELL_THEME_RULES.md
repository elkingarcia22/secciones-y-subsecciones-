# PLAYGROUND_SHELL_THEME_RULES

## Paleta Semántica del Shell

### 1. Fondos y Superficies
- **App Background**: `bg-surface-main` (Gris muy claro #F4F4F9 aprox).
- **Content Card**: `bg-surface-card` (Blanco puro #FFFFFF).
- **Sidebar**: `bg-surface-nav` (Navy Blue #0A0A60 - Token UBITS).

### 2. Estados de Navegación (Sidebar)
- **Active Item**: Fondo con opacidad suave del color primario o borde lateral.
- **Hover Item**: `bg-white/10` sobre el fondo oscuro.
- **Text/Icon Color**: `text-white` o `text-nav-foreground`.

### 3. Modos Visuales

#### Light Mode
- El Sidebar se mantiene **Dark** (Navy Blue) por identidad de marca.
- El contenido principal es **Light** con cards blancas.

#### Dark Mode
- El Sidebar se mantiene **Dark** (Navy Blue).
- El fondo de la app pasa a tonos grises oscuros profundos.
- Las cards pasan a un gris carbón con bordes sutiles.

## Prohibiciones Estéticas
- **No HEX**: El uso de colores hexadecimales en los componentes del shell está prohibido. Usar clases de Tailwind mapeadas a tokens.
- **No Text-White ad-hoc**: Solo permitido en el Sidebar mediante tokens de navegación.
- **No Sombras Agresivas**: Usar `shadow-sm` o custom tokens aprobados. No `shadow-lg` para el layout general.
- **No Glassmorphism**: El shell debe ser sólido y profesional (Enterprise B2B).
- **No Gradientes**: Fondos sólidos para el shell para mantener la legibilidad.

---
*Reglas de Theming v1.0*
