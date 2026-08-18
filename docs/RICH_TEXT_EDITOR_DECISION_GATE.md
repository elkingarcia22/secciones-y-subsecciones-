# RICH_TEXT_EDITOR_DECISION_GATE

## Estado: BLOQUEADO 🔒
La implementación de un Rich Text Editor (RTE) queda suspendida hasta la aprobación formal de la Fase 8.7E.

## Justificación del Bloqueo
1. **Complejidad de Dependencia**: Un RTE robusto no puede construirse desde cero (Zero-Dependency) de forma eficiente. Requiere un motor como Tiptap, Lexical o Slate.
2. **Impacto en Bundle Size**: Estas librerías añaden entre 50kb y 150kb (Gzipped), lo cual impacta el performance del Starter Kit.
3. **Mantenimiento**: La sanitización de HTML, el manejo de Paste (especialmente desde Word/Excel) y la accesibilidad son retos críticos.

## Opciones en Evaluación

| Opción | Pros | Contras | Recomendación |
|---|---|---|---|
| **ContentEditable Nativo** | 0 dependencias. Ligero. | Inconsistente entre navegadores. Difícil de controlar. | No recomendado. |
| **Tiptap (Prosemirror)** | Muy popular. Headless. Gran ecosistema. | Curva de aprendizaje alta. Prosemirror es pesado. | **Candidato A** |
| **Lexical (Meta)** | Moderno. Optimizado para React. Accesible. | Ecosistema más joven que Tiptap. | **Candidato B** |
| **Slate** | Totalmente personalizable. | Modelo de datos complejo. Requiere mucho boilerplate. | No recomendado. |
| **Mock Editor (Visual)** | 0 riesgo. Ideal para prototipos rápidos. | No es funcional para edición real. | **Opción Temporal** |

## Próximos Pasos (Fase 8.7E)
1. Definir los casos de uso mínimos (ej: solo Negrita, Itálica, Listas y Links).
2. Evaluar si un `RichTextPreview` es suficiente para la mayoría de los casos de uso del Starter.
3. Realizar pruebas de integración con el sistema de tokens UBITS.

---
## Decisión Provisional
No instalar dependencias. Para prototipos iniciales que requieran la visualización de texto enriquecido, se utilizará un contenedor con estilos UBITS que renderice HTML sanitizado, sin capacidades de edición.

---
*Decision Gate v1.0 — Fase 8.7A*
