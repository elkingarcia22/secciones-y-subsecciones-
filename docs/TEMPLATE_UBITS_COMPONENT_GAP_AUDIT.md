# TEMPLATE_UBITS_COMPONENT_GAP_AUDIT

## Resumen
Este documento detalla la comparativa técnica entre el repositorio legacy `template-ubits` y el Starter React, con un enfoque exclusivo en la creación de un **Playground Shell / App Shell** reusable.

> [!IMPORTANT]
> **Cambio de Enfoque**: El objetivo NO es migrar todo el repositorio `template-ubits`. Se utilizará únicamente como referencia de arquitectura de navegación y templates de "Home/Entrypoint" para acelerar la creación de pantallas funcionales (ej. Encuestas, Dashboards, Home de Colaborador).

## Fuente analizada
- **Repo**: `https://github.com/DavidVegaM91/template-ubits.git`
- **Foco de Auditoría**: Estructura de navegación, Sidebar, SubNav, Responsive TabBar y Home List Templates.

## Alcance Prioritario (Playground Shell)
| Componente / Patrón | Es Shell/Nav | Reusable Home | Prioridad | Decisión |
| :--- | :---: | :---: | :---: | :--- |
| PlaygroundShell | Sí | Sí | **Alta** | Arquitectura base del shell. |
| Sidebar (Admin/Collab)| Sí | Sí | **Alta** | Navegación vertical con variantes. |
| UbitsSubNav | Sí | Sí | **Alta** | Navegación secundaria. |
| ProductHeader | Sí | Sí | **Alta** | Cabecera con breadcrumbs y acciones. |
| Mobile TabBar | Sí | Sí | **Alta** | Navegación responsive para móviles. |
| PageContentFrame | Sí | Sí | **Alta** | Contenedor de card blanca estándar. |
| ToolbarPanel | No | Sí | **Alta** | Patrón de filtros y acciones unificado. |
| HomeListTemplate | No | Sí | **Alta** | Layout predefinido para listados. |
| Theme Dark/Light | Sí | Sí | **Alta** | Comportamiento global del shell. |

## Faltantes Críticos
1.  **Toolbar Panel**: El template-ubits usa un patrón de "Action Bar" o "Toolbar" persistente en dashboards que no tenemos unificado.
2.  **SubNav (Secondary Navigation)**: Vital para la jerarquía de productos UBITS. Actualmente solo tenemos Sidebar.
3.  **Layout Inmersivo**: El modo "full focus" para actividades de aprendizaje.

## Faltantes de Prioridad Media
1.  **Selection Card**: Crucial para la "humanización" de interfaces B2B (onboarding, selección de planes).
2.  **Empty State System**: El template tiene ilustraciones y CTAs específicos que el starter aún no integra de forma sistémica.

## Componentes Específicos de Producto
- **LMS Creator (Secciones, Índices, D&D)**: Se consideran fuera del core del starter por ahora, pero se mapean para futura migración de producto.

---
*Audit finalizado el 2026-05-06 por Senior Governance Lead.*
