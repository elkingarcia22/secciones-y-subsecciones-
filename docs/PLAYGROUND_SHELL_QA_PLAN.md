# PLAYGROUND_SHELL_QA_PLAN

## Escenarios de Validación (Fases 8.6C - 8.6E)

### 1. Estabilidad Técnica
- [ ] **Build**: `npm run build` debe ser exitoso sin warnings de chunks.
- [ ] **TypeScript**: 0 errores en los contratos de props.
- [ ] **Zero Code Bloat**: No se permiten imports de librerías externas para el layout.

### 2. Fidelidad de Diseño (Fidelity)
- [ ] Sidebar usa el color `#0A0A60` (Navy Blue).
- [ ] El fondo de la pantalla no es blanco puro (Gris claro).
- [ ] Las cards de contenido tienen bordes redondeados consistentes con shadcn.

### 3. Responsive (Breakpoints)
- [ ] **375px**: Sidebar no visible, MobileTabBar visible con iconos centrados.
- [ ] **768px**: Sidebar en modo Rail (solo iconos) sin etiquetas de texto.
- [ ] **1024px**: Sidebar completo visible.
- [ ] **1440px**: El contenido no se estira infinitamente (Max-width aplicado).

### 4. Accesibilidad (A11y)
- [ ] **Keyboard**: Se puede navegar por todos los links del Sidebar usando TAB.
- [ ] **Contrast**: El texto del Sidebar tiene contraste suficiente contra el fondo oscuro.
- [ ] **Aria**: El Sidebar tiene `role="navigation"` y el Main tiene `role="main"`.

### 5. Navegación & Estado
- [ ] El ítem activo en el Sidebar es visualmente distinto.
- [ ] El SubNav refleja correctamente la sub-sección activa.
- [ ] El Toggle de Dark/Light mode cambia los tokens en el `:root` sin romper el layout.

### 6. Contenido
- [ ] El Shell maneja correctamente contenidos largos (Scroll del área principal, no del shell completo).
- [ ] El SubNav es pegajoso (sticky) al hacer scroll.

---
*Plan de QA para Playground Shell v1.0*
