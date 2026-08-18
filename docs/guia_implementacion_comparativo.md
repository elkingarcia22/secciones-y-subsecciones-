# Guía de Implementación: Comparativo de Encuestas UBITS

Este documento sirve como insumo para PMs (definición de Historias de Usuario) y Desarrolladores (guía de implementación técnica) para el módulo de Comparativo de Encuestas.

---

## 1. Contexto de Negocio

### Descripción
El módulo Comparativo de Encuestas permite a los administradores de talento humano contrastar los resultados de múltiples procesos de medición (encuestas) en una sola vista analítica. Facilita la identificación de patrones, mejoras o retrocesos significativos en la percepción de los colaboradores.

### El Problema
Los reportes individuales ofrecen una "fotografía" estática. Sin una herramienta comparativa, el usuario debe exportar datos manualmente, cruzar archivos de Excel y calcular deltas por su cuenta para entender el impacto real de sus intervenciones.

### La Solución
Un dashboard dinámico que automatiza el cruce de datos entre 2 y 5 encuestas del mismo tipo, centralizando el cálculo de variaciones (deltas) y permitiendo segmentación demográfica instantánea.

---

## 2. Definiciones Técnicas y Reglas de Negocio

### Tipos de Encuestas y Restricciones
- **Clima, Cultura y NPS**: Solo se pueden comparar encuestas del mismo tipo.
- **Mínimo/Máximo**: Entre 2 y 5 encuestas.
- **La Encuesta "Base"**: El usuario elige una como punto de referencia. Los deltas ($\Delta$) se calculan contra esta base: $\Delta = \text{Valor X} - \text{Valor Base}$.

### Política de Privacidad y Anonimato (Privacy Wall)
- **Umbral Técnico**: Si un segmento filtrado tiene **menos de 5 respuestas ($n < 5$)**, los datos se ocultan.
- **UI**: Se muestra el icono de **Candado (Lock)** 🔒 en lugar de porcentajes o deltas.
- **Tooltip**: "Segmento con menos de 5 participantes. Resultados ocultos para garantizar el anonimato."

### Estado Sin Respuestas (Empty State)
- **Condición**: $n = 0$ (típico en el caso de filtros como "Líder Juan Pérez" en periodos donde no existía).
- **UI**: Texto **"Sin respuestas"** con tooltip aclaratorio.

---

## 3. Comportamiento por Caso de Uso

### Caso: Cultura y Valores
- **Métricas**: Favorabilidad y Participación (Se oculta el card de NPS).
- **Ajuste UI**: El grid se adapta a 2 columnas para mantener la armonía visual.

### Caso: NPS 
- **Métricas**: Participación y NPS Score (-100 a 100).
- **Ajuste UI**: Se elimina la métrica de Favorabilidad y se enfoca en lealtad.

---

## 4. Flujos de Navegación (Rutas Paso a Paso)

### RUTA A: El "Caso Juan Pérez" (Filtro sin histórico)
1. **Acción**: En el header, abrir filtro de "Líder" y seleccionar a "Juan Pérez".
2. **Efecto**: Si Juan es un líder nuevo, las tablas de las encuestas más antiguas mostrarán **"Sin respuestas"**.
3. **Validación**: El usuario debe ver el tooltip explicando que no hubo participación en esos periodos.

### RUTA B: Insights de IA y Comentarios
1. **Acción**: En la tabla de Dimensiones, hacer clic sobre cualquier nombre (ej: "Comunicación").
2. **UI**: Se abre un **Drawer lateral** (40% de la pantalla).
3. **Análisis IA**: Compara los comentarios de la Base vs las demás encuestas y resume hallazgos.
4. **Detalle**: Permite ver la lista de comentarios crudos filtrados por sentimiento.

### RUTA C: Compartir y Descargar
1. **Compartir**: Clic en icono superior derecho. Genera una URL persistente que guarda los filtros aplicados.
2. **Descargar**:
   - **Excel**: Matriz de datos raw (Dimensiones vs Encuestas).
   - **PDF**: Reporte visual con gráficas de tendencia y cards.

---

## 5. Explicación de Componentes UI

- **Delta Pill**: Verde (Mejora), Rojo (Caída), Gris (Estable).
- **Heatmap**: Permite cruzar Dimensiones vs Segmentos (Área, Ciudad, etc.) con escala de colores.
- **Iconografía**: 🌱 (Clima), ❤️ (Cultura), ⏱️ (NPS).

---

> [!IMPORTANT]
> **Checklist para Desarrolladores**:
> 1. Validar que el botón "Comparar" se habilite solo con $\ge 2$ encuestas.
> 2. Asegurar que el cambio de filtros en el header refresque el Heatmap y los Insights de IA.
> 3. Verificar que el icono de Candado 🔒 aparezca correctamente cuando $n < 5$.
