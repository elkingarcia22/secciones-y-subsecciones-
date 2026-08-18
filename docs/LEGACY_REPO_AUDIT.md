# Legacy Repo Audit

## Datos del Repositorio
- **Ruta Local:** `references/template-ubits/`
- **Origen:** `https://github.com/DavidVegaM91/template-ubits.git`

## Estructura General
El repositorio legacy es una colección de prototipos estáticos (HTML/CSS/JS vainilla).
- `ubits-admin/`: Pantallas de administración (Certificados, Usuarios, Diagnóstico, etc.)
- `ubits-colaborador/`: Pantallas para el usuario final (Catálogo, Home, Perfil, Reclutamiento, etc.)
- `general-styles/`: Definición de tokens de color (`ubits-colors.css`) y estilos base.
- `components/`: Definiciones CSS de componentes individuales (Buttons, Cards, Modals).
- `images/`: Assets visuales.

## Componentes Principales Encontrados
- **Layout:** Sidebar oscuro (`--ubits-sidebar-bg: #202837`), Header con logo, Contenedores centrados.
- **UI Base:** Botones con gradientes sutiles, Cards con elevación plana, Badges de estado (Success, Error, Info, Warning).
- **IA:** Paneles de chat de IA, Módulos de "Estudio IA".
- **Analítica:** Estilos para tablas de resultados y Heatmaps (conceptuales en CSS).

## Patrones Visuales Relevantes
- **Tonal Layering:** Uso de variaciones de gris/blanco para separar capas sin bordes pesados.
- **Brand Consistency:** Uso extensivo del azul marca `#0C5BEF`.
- **Sidebar Rail:** Navegación lateral persistente con iconos.

## Riesgos de Migración
- **Tecnología:** El paso de HTML estático a React/shadcn requiere una re-implementación completa de la lógica de componentes.
- **Tokens:** Existen discrepancias entre los nombres de variables legacy y los nuevos tokens semánticos de UBITS (ej. Sidebar background).
- **Estilos Ad-hoc:** Muchos estilos están acoplados a clases específicas de pantallas; se deben abstraer en componentes reutilizables shadcn.

## Patrones a Preservar (Conceptualmente)
- La jerarquía de información en las pantallas de administración.
- El look & feel de las tarjetas de curso/contenido.
- La paleta de estados de feedback.

## Patrones a NO Copiar
- El uso de IDs globales en CSS.
- Layouts basados en floats o posiciones fijas manuales (usar Flexbox/Grid de Tailwind).
- Dependencias de JS vainilla para modales o dropdowns.
