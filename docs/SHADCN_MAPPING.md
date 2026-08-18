# shadcn Mapping

| Necesidad UBITS | Componente shadcn | Directorio | Adaptación / Estilo |
|---|---|---|---|
| Botón Primario | Button | `ui/` | Sólido, azul brand, sin gradientes |
| Inputs / Forms | Input, Select | `ui/` | Bordes 1px, sobrio, desktop-first |
| Cards / Shells | Card | `data-display/` | Fondo blanco sólido, bordes sutiles |
| Sidebar Navy | - | `layout/` | Compacto, #0A0A60, iconos centrados |
| Navegación | Tabs, Breadcrumb | `navigation/` | Estilo lineal, sin decoraciones |
| Modales | Dialog, Sheet | `overlays/` | Backdrop sólido/oscuro, sin glassmorphism |
| IA Panel | - | `ai/` | Capa funcional, diseño integrado |

## Notas de Implementación
- **Cero Gradientes:** No se permite el uso de gradientes en ningún componente de la interfaz.
- **Cero Glassmorphism:** No se utilizarán efectos de desenfoque de fondo.
- **Tablas Densas:** El enfoque para tablas es maximizar la información visible sin sacrificar la legibilidad.
- **Acción Primaria:** El uso del azul brand (`#0C5BEF`) debe ser intencional para guiar al usuario.
