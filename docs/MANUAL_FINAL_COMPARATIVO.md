# Manual Maestro: Comparativo de Encuestas UBITS

Este documento es la especificación definitiva para PMs y Desarrolladores. Contiene la visión de negocio, reglas técnicas y flujos de usuario detallados.

---

## 1. Contexto de Negocio

### Objetivo
Habilitar una toma de decisiones basada en datos históricos, permitiendo contrastar entre 2 y 5 encuestas del mismo tipo en una sola vista.

### El Problema que Soluciona
Elimina la necesidad de cruces manuales en Excel. Automatiza el cálculo de variaciones (deltas) y permite segmentar resultados por variables demográficas (Líder, Área, etc.) de forma instantánea.

---

## 2. Definiciones Técnicas y Reglas de Negocio

### Tipos de Encuestas en el Comparativo
El comparativo se restringe a encuestas del mismo tipo para asegurar la coherencia de los datos:
- **Clima**: Enfocado en ambiente laboral.
- **Cultura**: Enfocado en valores y comportamientos.
- **NPS**: Enfocado en lealtad y recomendación.

### Reglas del Comparativo
- **Mínimo de encuestas**: 2 (Una Base + Una Comparativa).
- **Máximo de encuestas**: 5 (Una Base + Cuatro Comparativas).
- **Selección de la "Base"**: 
  - El usuario debe elegir una encuesta como **Base**. 
  - La Base es el punto de referencia principal. Todos los deltas ($\Delta$) se calculan comparando las encuestas adicionales contra esta Base.
  - *Fórmula*: $\Delta = \text{Valor Encuesta X} - \text{Valor Base}$. (Un delta positivo indica mejora respecto a la base).

### A. Política de Privacidad (Privacy Wall Configurable)
- **Regla**: El umbral de anonimato es **configurable por el usuario** desde la configuración de la encuesta. Si un filtro arroja un número de respuestas menor al umbral definido ($n < \text{Umbral}$, ej: 3, 5 o 10), el dato se protege automáticamente.
- **UI**: Se muestra el icono de **Candado** 🔒. Se ocultan promedios, porcentajes y deltas.
- **Tooltip**: "Este segmento cuenta con menos participantes del umbral de privacidad definido (Umbral: X). Los resultados se ocultan para garantizar el anonimato."

### B. Estado Sin Respuestas (Empty State)
- **Regla**: Si $n = 0$.
- **UI**: Texto **"Sin respuestas"** o guion "—".
- **Caso Común**: Filtrar por un líder (ej. Juan Pérez) en una encuesta antigua donde él aún no trabajaba en la empresa.

### C. La Encuesta "Base"
- Es el punto de referencia inamovible para el cálculo de deltas.
- **Fórmula**: $\text{Valor Encuesta X} - \text{Valor Base}$.

---

## 3. Comportamiento por Producto (Lógica UI)

| Tipo | Cards Visibles | Lógica Especial | Icono |
| :--- | :--- | :--- | :--- |
| **Clima** | Favorabilidad, Participación, NPS | Happy Path estándar. | 🌱 |
| **Cultura** | Favorabilidad, Participación | Se oculta el card de NPS. Grid de 2 columnas. | ❤️ |
| **NPS** | Participación, NPS Score | Se oculta Favorabilidad. Escala -100 a 100. | ⏱️ |

---

## 4. Rutas de Navegación (Paso a Paso)

### RUTA 1: El Wizard de Configuración
1. **Paso 1**: Elegir Tipo (Clima/Cultura/NPS).
2. **Paso 2**: Seleccionar de 2 a 5 encuestas del listado.
3. **Paso 3**: Definir cuál es la **Base**.
   - **Tooltip Icono (i)**: *"La encuesta base es el punto de referencia principal. Todas las demás se compararán contra esta para calcular las mejoras o caídas (deltas)."*
4. **Finalizar**: Clic en "Ver Comparativo".
   - **Toast de Éxito**: "Comparativo generado exitosamente."

### RUTA 2: El Escenario "Juan Pérez" (Filtros)
1. **Navegación**: En el Header > Filtro **Líder**.
2. **Acción**: Seleccionar "Juan Pérez".
3. **Tooltip en Header (i)**: *"Los filtros aplicados afectan a todos los componentes del dashboard (Cards, Gráficos y Heatmap)."*
4. **Cards de KPI (Hovers de Info)**:
   - **Favorabilidad**: *"Suma de respuestas positivas (4 y 5) sobre el total de respuestas."*
   - **Participación**: *"Colaboradores que respondieron vs. Colaboradores invitados."*
   - **NPS**: *"Net Promoter Score: % Promotores (9-10) - % Detractores (0-6)."*
5. **Resultado**: Si no hay datos, verás **"Sin respuestas"**.
   - **Tooltip de Estado Vacío**: *"No se encontraron registros para este segmento en este proceso de medición."*

### RUTA 3: Análisis IA y Comentarios
1. **Acción**: En la tabla de Dimensiones, clic en el nombre de una dimensión.
2. **UI**: Se despliega el Drawer lateral.
3. **Tooltip Icono IA**: *"Este análisis resume automáticamente los comentarios de los colaboradores mediante inteligencia artificial."*
4. **Tags de Sentimiento (Hovers)**:
   - **Positivo**: *"Comentarios que expresan satisfacción o aprobación."*
   - **Neutro**: *"Comentarios informativos o sin una carga emocional clara."*
   - **Negativo**: *"Comentarios que expresan descontento o áreas de mejora."*

### RUTA 4: Iconos de Acción (Header)
1. **Compartir**: Hover sobre icono 🔗.
   - **Tooltip**: *"Copiar enlace del comparativo con filtros actuales."*
   - **Toast Éxito**: "Enlace copiado al portapapeles."
2. **Descargar**: Hover sobre icono 📥.
   - **Tooltip**: *"Exportar resultados a Excel o PDF."*
   - **Toast Éxito**: "La descarga del reporte ha iniciado."
3. **Información General**: Hover sobre icono 💡.
   - **Tooltip**: *"Guía rápida sobre cómo interpretar los deltas y colores del comparativo."*

---

## 5. Componentes y Glosario Visual
- **Delta Pill**:
  - **Verde**: *"Mejora significativa respecto a la encuesta base."*
  - **Rojo**: *"Retroceso respecto a la encuesta base."*
- **Heatmap**: Hover en celda: *"Puntaje promedio del segmento [Nombre] en la dimensión [Dimensión]."*
- **N/A en Tablas**: Hover: *"Esta dimensión no fue medida en este proceso."*

---

## 6. Catálogo de Estados Vacíos y Errores Técnicos

### A. Fallos de Sistema (Toasts de Error)
- **Error General**: "Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo."
- **Error de Carga**: "Error de conexión. No pudimos recuperar la información del comparativo."

### B. Estados Vacíos por Filtros (Resumen Visual)
| Componente | Escenario | Visualización | Tooltip (Hover) |
| :--- | :--- | :--- | :--- |
| **Cards KPI** | $n=0$ | "Sin respuestas" | "No hay datos para los filtros seleccionados." |
| **Gráfico** | $n=0$ | Vacío | "Sin datos suficientes para graficar." |
| **IA Insights** | $n <$ Umbral | "Datos insuficientes" | "Se requieren más comentarios para el análisis." |
| **Privacidad** | $n <$ Umbral | Icono 🔒 | "Datos protegidos por umbral de anonimato (Umbral: X)." |

---

> [!IMPORTANT]
> **Checklist de Calidad Final**:
> - ¿El icono de candado aparece dinámicamente según el umbral configurado (3, 5, 10, etc.)?
> - ¿Se oculta el card de NPS en encuestas de Cultura?
> - ¿Los filtros del header afectan también al Heatmap y al Drawer de IA?
> - ¿Se maneja correctamente el estado "N/A" cuando las encuestas tienen dimensiones distintas?

