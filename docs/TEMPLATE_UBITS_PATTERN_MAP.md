# TEMPLATE_UBITS_PATTERN_MAP

## Mapeo de Patrones de UX: Playground Shell

| Patrón Legacy (HTML/JS) | Concepto React Playground Shell | Implementación Recomendada |
| :--- | :--- | :--- |
| **Sidebar (Admin/Collab)** | `PlaygroundSidebar` | Componente con prop `variant` y `menuItems`. |
| **SubNav (Fixed)** | `UbitsSubNav` | Componente de navegación secundaria con sticky top. |
| **Admin Home (List)** | `HomeListTemplate` | Composición de `ProductHeader` + `Toolbar` + `Table`. |
| **Collaborator Home** | `CollaboratorHomeTemplate` | Layout tipo "Entrypoint" para usuarios finales. |
| **Mobile Navigation** | `UbitsMobileTabBar` | Fixed bottom bar con iconos clave. |
| **Toolbar de filtros** | `ToolbarPanel` | Contenedor flexible con Slots para filtros y acciones. |
| **Card blanca de contenido**| `PageContentFrame` | Card con paddings UBITS tokens y max-width variable. |

## Principios de Implementación
1.  **State over Class**: En el legacy se usaban clases como `.is-active`. En React usaremos props y estados booleanos.
2.  **Composition over Bloat**: Evitar componentes con cientos de props. Usar `children` y sub-componentes.
3.  **Token Consistency**: Todos los colores y espaciados deben venir de `tailwind.config.ts`.

---
*Mapping Patterns v1.1*
