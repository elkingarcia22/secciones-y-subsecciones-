# ADVANCED_INTERACTION_AI_COMPONENTS_AUDIT

## 1. Inventario de Componentes Candidatos
Esta auditoría evalúa la viabilidad y necesidad de la suite de componentes "Advanced Interaction & AI" para la Fase 8.7.

| Componente | Descripción | Prioridad |
|---|---|---|
| **AI Panel** | Panel especializado para visualización y gestión de insights de IA. | Media |
| **Chip** | Componente de selección/filtro interactivo más avanzado que el Tag. | Alta |
| **Coachmark** | Guía visual flotante para onboarding y descubrimiento de features. | Media |
| **IA Loader** | Indicador de carga especializado para procesos generativos. | Alta |
| **IA-Button** | Botón con branding de IA y feedback de generación. | Alta |
| **Rich Text Editor** | Editor de texto enriquecido enterprise. | Baja (Bloqueado) |
| **Save Indicator** | Feedback de persistencia de datos (autosave). | Alta |
| **Stepper** | Navegador de procesos multietapa. | Media |
| **Video Player** | Reproductor de video nativo con controles UBITS. | Media |
| **Audio Player** | Reproductor de audio nativo con controles UBITS. | Media |

## 2. Comparación con Componentes Existentes

| Candidato | Componente Actual | Gap Detectado |
|---|---|---|
| **AI Panel** | `AIPanel.tsx` | El actual es solo una `Card` con estilo. Falta soporte para chats, feedback y estados complejos. |
| **Chip** | `Tag.tsx` | `Tag` es estático (display). `Chip` requiere interacción (delete, select, active state). |
| **Coachmark** | N/A | No existe infraestructura para tooltips guiados o overlays de ayuda contextual. |
| **IA Loader** | `Loader2` (Lucide) | Falta un componente semántico que transmita "IA trabajando" (gradientes, brillo, etc.). |
| **IA-Button** | `Button` | El botón estándar no transmite la identidad visual de IA UBITS de forma nativa. |
| **Rich Text** | `Textarea` | Solo texto plano. Falta soporte para formatos, listas y links. |
| **Save Indicator** | N/A | Se están usando Toasts, lo cual es intrusivo para autosave frecuente. |
| **Stepper** | `Progress` | `Progress` es lineal/continuo. `Stepper` requiere hitos discretos y navegación. |
| **Video/Audio** | `MediaPreview` | Solo muestra placeholders o imágenes. Falta integración con el tag `<video>`/`<audio>`. |

## 3. Riesgos Técnicos y Visuales

### Riesgos de Dependencia
- **Rich Text Editor**: Es el componente de mayor riesgo. Introducir Tiptap o Lexical aumenta significativamente el bundle size y la complejidad de mantenimiento. Queda bloqueado por **Decision Gate**.
- **Media Players**: Se debe evitar el uso de reproductores de terceros (Vimeo/YouTube wrappers) para mantener la estrategia de Zero-Dependency. Se priorizará el uso de elementos nativos HTML5.

### Riesgos Visuales
- **IA Aesthetics**: El uso excesivo de gradientes o efectos de brillo puede romper la sobriedad B2B UBITS. Se debe estandarizar el uso de los tokens de IA en `tokens.css`.
- **Coachmarks**: Pueden ser intrusivos y romper el layout si no se manejan con `z-index` y `portal` correctamente.

## 4. Decisiones Iniciales
1. **Priorización de "Lightweight Status"**: Implementar primero Chip, IA-Button y Save Indicator por su bajo riesgo y alta utilidad.
2. **Estandarización de IA**: Crear un sub-directorio `src/components/ai/` consolidado (actualmente existe pero debe evolucionar).
3. **Bloqueo de Rich Text**: No se autoriza la instalación de ninguna librería de edición de texto sin el QA formal de la Fase 8.7E.

---
*Documento de Auditoría v1.0 — Fase 8.7A*
