# TEMPLATE_UBITS_COMPONENT_DECISION_MATRIX

## Matriz de Decisión: Playground Shell Scope

| Patrón | ¿Shell/Nav? | ¿Reusable Home? | ¿Producto Específico? | Prioridad | Decisión | Componente Nuevo | Decision Gate |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| **PlaygroundShell**| Sí | Sí | No | **Alta** | Arquitectura | Sí | No |
| **UbitsSubNav** | Sí | Sí | No | **Alta** | Build | Sí | No |
| **Mobile TabBar** | Sí | No | No | **Alta** | Build | Sí | No |
| **ToolbarPanel** | No | Sí | No | **Alta** | Pattern | Sí | No |
| **ProfileMenu** | Sí | Sí | No | Media | Refactor | Sí | No |
| **DataTable Temp**| No | Sí | No | Media | Pattern | No | No |
| **LMS Creator** | No | No | Sí | **Bloqueado** | Hold | Sí | Sí |
| **Study Chat** | No | No | Sí | **Bloqueado** | Hold | Sí | Sí |
| **Rich Text Ed** | No | No | Sí | **Bloqueado** | Hold | No | Sí |

## Reglas de Evaluación (Revisadas)
1.  **Prioridad 1**: Todo lo que componga el "Playground Shell" (Navigation + Layout Frames).
2.  **Prioridad 2**: Templates de Home que permitan instanciar dashboards rápidamente.
3.  **Exclusiones**: Todo lo que sea lógica de negocio pesada o específica de un producto (LMS, Chat, Editores Complejos).

---
*Gobernanza de Componentes v1.1*
