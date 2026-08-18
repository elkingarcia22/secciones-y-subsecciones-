# Plantilla Maestra de Handoff: Comparativo de Encuestas UBITS

Este documento es el activo definitivo de entrega (Handoff) que integra la visión de Diseño, Producto y Desarrollo. Es la evolución final del manual técnico y funcional.

---

## 1. Resumen Ejecutivo
El **Comparativo de Encuestas** es una herramienta analítica avanzada que permite a los administradores de Talento Humano contrastar resultados de múltiples procesos de medición (2 a 5 encuestas) en una sola interfaz. Automatiza el cálculo de variaciones (deltas) y proporciona insights generados por IA.

## 2. Contexto Funcional
Facilita la toma de decisiones basada en datos históricos. Elimina la necesidad de cruces manuales en Excel, permitiendo ver la evolución de métricas críticas (Favorabilidad, Participación, NPS) y el detalle por dimensiones/preguntas entre diferentes momentos del tiempo o campañas.

## 3. Alcance / No Alcance
- **Alcance**:
  - **Clima**: Enfocado en ambiente laboral.
  - **Cultura**: Enfocado en valores y comportamientos.
  - **NPS**: Enfocado en lealtad y recomendación.
  - Comparación de 2 a 5 encuestas del mismo tipo.
  - Selección de una encuesta "Base" como ancla de comparación.
  - Filtrado demográfico completo (Líder, Área, Rol, Ciudad, País, etc.).
- **No Alcance**:
  - Comparación de tipos mixtos (ej. Clima vs Cultura).
  - Selección de más de 5 encuestas (por densidad de información en UI).

## 4. Flujo End-to-End
1. **Configuración (Wizard)**:
   - **Paso 1**: Elegir Tipo de Encuesta.
   - **Paso 2**: Seleccionar encuestas del listado (mín. 2, máx. 5).
   - **Paso 3**: Definir cuál es la **Base** (Tooltip Icono (i): *"La encuesta base es el punto de referencia principal. Todas las demás se compararán contra esta para calcular las mejoras o caídas (deltas)."*).
4. **Finalizar**: Clic en "Ver Comparativo" -> Toast de Éxito: *"Comparativo generado exitosamente."*
5. **Dashboard**: Visualización de Cards de KPI y Tabla de Dimensiones.
6. **Filtros**: Aplicación de filtros demográficos que actualizan todo el sistema.
7. **Análisis**: Apertura de Drawer para ver comentarios e insights de IA.
8. **Reportes**: Exportación a Excel/PDF o copia de enlace compartido.

## 5. Prototipo Funcional como Fuente de Verdad
La implementación en `/src/` es el referente técnico:
- **`EncuestasDashboard.tsx`**: Lógica de entrada y wizard.
- **`ComparativeDashboard.tsx`**: Núcleo del dashboard y filtros.
- **`comparativeMocks.ts`**: Estructura de datos y contratos de API simulados.

## 6. Reglas de Negocio (Core Logic)
- **Cálculo de Delta**: $\Delta = \text{Valor Encuesta X} - \text{Valor Base}$.
  - *Interpretación*: Positivo = Mejora (Verde). Negativo = Retroceso (Rojo).
- **Privacy Wall (Configurable)**: 
  - Regla: Si $n < \text{Umbral}$ (ej: 3, 5, 10), se muestra el candado 🔒.
  - Tooltip: *"Datos protegidos por umbral de anonimato (Umbral: X)."*
- **Estado Sin Datos ($n=0$)**: Se muestra el texto **"Sin respuestas"** o guion "—".
- **Visibilidad por Producto**:
  - **Clima**: Dashboard completo (Favorabilidad, Participación, NPS).
  - **Cultura**: Oculta NPS (Grid de 2 columnas: Fav, Part).
  - **NPS**: Oculta Favorabilidad (Participación y Score NPS).

## 7. Comportamiento UI por Componente
### Matriz de Estados y Tooltips
| Componente | Escenario | Visualización | Tooltip (Hover) |
| :--- | :--- | :--- | :--- |
| **Cards KPI** | $n=0$ | "Sin respuestas" | "No hay datos para los filtros seleccionados." |
| **Delta Pill** | Mejora | Píldora Verde | "Mejora significativa respecto a la encuesta base." |
| **Delta Pill** | Caída | Píldora Roja | "Retroceso respecto a la encuesta base." |
| **Heatmap** | Celda | Color Escala | "Puntaje promedio del segmento [X] en la dimensión [Y]." |
| **Heatmap** | Sin respuestas | Celda Gris | "Sin respuestas suficientes para mostrar datos." |
| **Gráfico** | Tendencia | Línea de Tiempo | "Línea de tiempo que conecta los resultados históricos." |
| **Gráfico** | Sin datos | Vacío | "Sin datos suficientes para graficar." |
| **N/A en Tablas** | Faltante | "N/A" | "Esta dimensión no fue evaluada en esta encuesta específica." |

## 8. Rutas de Usuario Detalladas
### RUTA 1: Filtros (Escenario "Juan Pérez")
- El usuario selecciona un líder en el Header.
- **Hover en Header (i)**: *"Los filtros aplicados afectan a todos los componentes del dashboard (Cards, Gráficos y Heatmap)."*
- **Hovers de KPI Cards (Info)**:
  - **Favorabilidad**: *"Suma de respuestas positivas (4 y 5) sobre el total de respuestas."*
  - **Participación**: *"Colaboradores que respondieron vs. Colaboradores invitados."*
  - **NPS**: *"Net Promoter Score: % Promotores (9-10) - % Detractores (0-6)."*
- Si el líder no tiene respuestas: Tooltip: *"No se encontraron registros para este segmento en este proceso de medición."*

### RUTA 2: Análisis IA y Comentarios
- **Tooltip Icono IA**: *"Este análisis resume automáticamente los comentarios de los colaboradores mediante inteligencia artificial."*
- **Hovers de Sentimiento**:
  - **Positivo**: *"Comentarios que expresan satisfacción o aprobación."*
  - **Neutro**: *"Comentarios informativos o sin una carga emocional clara."*
  - **Negativo**: *"Comentarios que expresan descontento o áreas de mejora."*

### RUTA 3: Acciones de Header y Reportes
- **Compartir (🔗)**: 
  - **Clima/NPS**: Abre drawer en modo `share`. Al copiar el enlace, muestra Toast: *"Enlace copiado correctamente"* y cierra el drawer automáticamente.
  - **Cultura**: Bloqueo preventivo con Toast de error: *"¡Vaya! Hubo un problema al generar tu enlace de comparativo... intenta compartirlo más tarde."*
- **Descargar (📥)**: 
  - **Clima/NPS**: Abre drawer unificado (40vw) en pestaña "Generar". El éxito en la descarga se registra en la pestaña "Descargas".
  - **Cultura**: El botón abre el drawer, pero al intentar generar el PDF/CSV, el sistema redirige automáticamente a la pestaña de **"Descargas"** mostrando un fallo visual con mensaje humano.
- **Información (💡)**: Tooltip: *"Guía rápida sobre cómo interpretar los deltas y colores del comparativo."*

## 9. Criterios de Aceptación
- Bloqueo de navegación si no se seleccionan al menos 2 encuestas.
- Ocultación dinámica de Cards (NPS en Cultura, Favorabilidad en NPS).
- Activación inmediata del candado de privacidad al cambiar filtros.

## 10. Insumos Técnicos para Desarrollo
- **Iconografía**: 🌱 (Clima), ❤️ (Cultura), ⏱️ (NPS).
- **Manejo de Errores**:
  - Toast Error: *"Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo."*
  - Error Humano (Cultura/Fallas): *"¡Vaya! Hubo un problema al procesar la solicitud. Por favor intenta más tarde."*
  - Error Carga: *"Error de conexión. No pudimos recuperar la información del comparativo."*

## 11. Edge Cases
- **Dimensiones Inconsistentes**: Manejo de "N/A" sin romper el layout.
- **Comentarios Escasos**: IA dirá: *"Se requieren más comentarios para el análisis."*

## 12. Analítica
- Eventos: `compare_start`, `filter_apply`, `report_download`, `share_link_copy`.

## 13. QA Checklist
- [x] ¿El candado aparece según el umbral dinámico?
- [x] ¿Los deltas son correctos respecto a la Base?
- [x] ¿Todos los hovers muestran el texto especificado en la Sección 7?

## 14. Riesgos y Decisiones
- **Decisión**: Se priorizó la encuesta Base como ancla fija para evitar confusión en el cálculo de deltas transversales.

## 16. Unified Report Drawer (Especificaciones Técnicas)
- **Dimensionamiento**: Layout endurecido a **40vw** fijo en desktop para garantizar legibilidad de URLs y tablas de filtros. `overflow-x-hidden` obligatorio.
- **Estructura de Pestañas**:
  - **Modo Compartir**: Pestaña única. El bloque de "Personalización" se ubica debajo del input de enlace.
  - **Modo Exportar**: Dual (Generar / Descargas).
- **Estados de Interacción**:
  - **Normal**: Drawer abierto ocupando el lateral derecho.
  - **Minimizado (Floating Widget)**: Widget compacto lateral para seguimiento de descargas asíncronas.
  - **Inline Error**: Mensaje rojo (`status-negative`) con icono `AlertCircle` dentro de la lista de historial para descargas fallidas.

## 17. Aprobaciones
- [ ] Product Manager | [ ] Tech Lead | [ ] QA Lead
