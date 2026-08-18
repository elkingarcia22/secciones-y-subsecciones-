# Diseño UBITS (B2B Enterprise)

## Filosofía Visual
El sistema de diseño de UBITS para esta plantilla se aleja de los estilos SaaS genéricos (gradientes, glassmorphism, decoraciones excesivas) para centrarse en la eficiencia operativa y la sobriedad corporativa.

## Estrategia de Temas (Fase 5D)
1. **Light Mode (Principal):** Es el modo oficial y prioritario de la plataforma. Toda la arquitectura está optimizada para máxima legibilidad en este modo.
2. **Dark Mode (Soporte Técnico):** Se incluye como una capacidad técnica preparada. No es el foco visual principal, pero permite reducir la fatiga visual en entornos de baja luminosidad.
3. **SidebarRail Invariante:** El color Navy Blue (`#0A0A60`) de la barra de navegación se mantiene constante en ambos modos para preservar la identidad de marca.
4. **Consistencia B2B:** El modo oscuro debe evitar colores "neón" o excesivamente saturados. Se prefieren tonos oscuros neutros y grises profundos que mantengan la sobriedad enterprise.

## Atributos Clave
- **B2B Enterprise:** Estilo profesional, serio y orientado a la productividad.
- **Desktop-First:** Optimizado para flujos de trabajo en escritorio y pantallas de alta densidad.
- **Limpieza y Sobriedad:** Uso generoso de espacios en blanco y jerarquía clara.
- **Fondo de Aplicación:** Gris claro (`#F4F6F8`) para generar contraste suave con las superficies de trabajo.
- **Cards:** Fondos blancos sólidos (`#FFFFFF`) con bordes sutiles de 1px.
- **Texto Primario:** Azul grisáceo oscuro (`#303A47`) para máxima legibilidad.
- **Acción Primaria:** Azul UBITS (`#0C5BEF`) utilizado de forma estratégica para botones primarios.
- **Navegación:** Sidebar Navy Blue (`#0A0A60`) compacto (80px).
- **Tablas:** Densidad de información optimizada, legibilidad alta, bordes claros.
- **IA Accionable:** Los elementos de IA se presentan como herramientas de soporte y análisis, no como elementos decorativos.

## No-Go List (Prohibido)
- **Glassmorphism:** No usar transparencias con desenfoque de fondo.
- **Gradientes:** No usar gradientes lineales o radiales premium. Colores sólidos.
- **Sombras:** Evitar `box-shadow` difusos; preferir bordes sutiles para delimitar áreas.
- **Animaciones:** Mantener transiciones funcionales y breves. Evitar animaciones puramente cosméticas.
- **Hardcoded Colors:** No usar valores HEX directamente en los componentes por modo; usar siempre las variables semánticas mapeadas en `globals.css`.
