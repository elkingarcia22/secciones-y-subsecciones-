# Reference Repositories Audit

| Repo | Rol en el proyecto | Qué se puede reutilizar | Qué NO se debe reutilizar | Riesgos |
|---|---|---|---|---|
| **plantilla-proyectos-shadcn** (Actual) | Target / Starter Kit | Estructura de carpetas, setup de Vite/Tailwind. | Configuración de colores inicial. | Desincronización con DS oficial. |
| **comparativo-de-encuestas** | Prototipo de Referencia | Arquitectura de tokens en Tailwind, lógica de SidebarRail, estructura de `docs/`. | Componentes específicos de encuestas hardcodeados. | Arrastrar deuda técnica de prototipos rápidos. |
| **template-ubits** (Legacy) | Referencia Conceptual | UX de navegación admin/colaborador, inventario de pantallas. | Código CSS/JS legacy, lógica de manipulación de DOM directa. | Copiar patrones visuales obsoletos (v2). |
| **Design System UBITS** (Oficial) | Fuente de Verdad | Tokens HEX oficiales, radios, sombras, logos assets. | N/A | Ignorar cambios recientes en la v3.0.0. |

## Conclusiones
1. **La fuente de verdad absoluta es el Design System UBITS (v3.0.0)** encontrado localmente en `../tokens/`.
2. El **Comparativo de Encuestas** es la mejor referencia para la implementación técnica de Tailwind + shadcn.
3. El **Starter Kit actual** requiere una regularización para alinear sus tokens con el DS oficial antes de avanzar.
