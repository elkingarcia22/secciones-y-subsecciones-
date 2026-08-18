# ECharts Decision Record (EDR)

## Estado
**Implementado** · Hotfix 7C.2.1 aprobado (pendiente QA final).

**Versión instalada:** `echarts` v6.0.0 (no `echarts-for-react`).

## Contexto
Se requiere una librería de visualización de datos que sea robusta, altamente personalizable y compatible con el ecosistema de React y los estándares de diseño UBITS.

## Alternativas Evaluadas

### 1. `echarts-for-react`
- **Ventajas**: Wrapper de React sencillo, fácil de usar.
- **Riesgos**: Dependencia de un tercero para el ciclo de vida, puede tener retrasos en actualizaciones de la librería base, bundle ligeramente superior por el wrapper.

### 2. `echarts` (Directo)
- **Ventajas**: Control total sobre el ciclo de vida del canvas, acceso inmediato a nuevas versiones de Apache ECharts, menor huella de dependencias.
- **Riesgos**: Requiere implementación manual del wrapper de React (hooks de limpieza, manejo de resize).

## Decisión Recomendada
**Instalar `echarts` directo + Crear Wrapper Propio UBITS.**

### Justificación
1. **Control Total**: Necesitamos un control preciso sobre cómo se integran los tokens CSS (`tokens.css`) en la configuración del tema de ECharts.
2. **Bundle Optimization**: El uso directo permite importar solo los módulos necesarios (Bar, Line, Grid, Dataset) reduciendo el tamaño final del bundle.
3. **Mantenibilidad**: Al ser un starter kit de larga duración, es más seguro depender directamente de la librería oficial de Apache que de wrappers mantenidos por la comunidad.

## Estrategia de Implementación Técnica
- **Lifecycle**: Uso de `useRef` y `useEffect` para inicializar y destruir la instancia de ECharts.
- **Resize**: Uso de `ResizeObserver` nativo o el método `resize()` de ECharts dentro de un listener global.
- **Theming**: Se creará un objeto `ubits-theme` que mapeará las variables CSS `--brand-primary`, `--foreground`, etc., directamente a las propiedades de ECharts.
- **Modularidad**: En producción, se importarán los componentes de forma granular:
  ```typescript
  import * as echarts from 'echarts/core';
  import { BarChart, LineChart } from 'echarts/charts';
  import { GridComponent, TooltipComponent } from 'echarts/components';
  import { CanvasRenderer } from 'echarts/renderers';
  ```

## Criterios para Avanzar a Fase 7C.2
1. Aprobación de esta estrategia por el equipo.
2. Estabilidad de la Fase 7B confirmada por QA.
3. Disponibilidad de los tokens de color semánticos finales.

## Riesgos y Mitigaciones
- **Curva de Aprendizaje**: ECharts tiene una API extensa. Se mitigará mediante la creación de `ChartShell` y componentes preconfigurados (BarChart, LineChart) que simplifiquen su uso para desarrolladores.
- **Performance**: Canvas vs SVG. ECharts permite ambos; se evaluará el uso de Canvas por defecto por su mejor performance con grandes volúmenes de datos.
