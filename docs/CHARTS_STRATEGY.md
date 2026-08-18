# Charts Strategy · UBITS Enterprise

## Visión General
La visualización de datos en el ecosistema UBITS debe ser analítica, sobria y orientada a la toma de decisiones. No buscamos gráficos decorativos, sino herramientas de claridad para usuarios enterprise.

## Principios Visuales
1. **Sobriedad Analítica**: El dato es el protagonista. Los ejes, grids y labels deben ser discretos para no competir con la información.
2. **Cero HEX**: El uso de colores se hará exclusivamente mediante tokens CSS (`tokens.css`). Los charts deben responder automáticamente al cambio de tema (light/dark).
3. **Cromatismo Semántico**:
   - **Énfasis**: Azul UBITS (`--brand-primary`).
   - **Estados**: Uso de tokens `--status-*` para positivo, negativo, advertencia e información.
   - **Neutralidad**: Escala de grises (`--muted-foreground`, `--border`) para elementos estructurales.
4. **Desktop-First**: Diseñados para pantallas grandes con alta densidad de información, pero con escalabilidad responsiva.
5. **No Decoración**:
   - Prohibido el uso de gradientes innecesarios.
   - Prohibido el uso de sombras pesadas o efectos 3D.
   - Prohibido el uso de paletas de colores "arcoíris" sin significado semántico.

## Tipos de Gráficos Permitidos

| Tipo | Uso Recomendado | Prioridad |
|---|---|---|
| **Bar Chart (Vertical/Horizontal)** | Comparación de categorías, rankings. | Alta |
| **Line Chart** | Tendencias temporales continuas. | Alta |
| **Area Chart** | Tendencias acumulativas con énfasis en volumen. | Media |
| **Donut Chart** | Composición de un total (máximo 5-6 categorías). | Media |
| **Heatmap** | Densidad de datos en dos dimensiones (ej. horarios). | Media |
| **Sparkline** | Tendencias compactas dentro de tablas o KPIs. | Alta |
| **Stacked Bar** | Composición y comparación simultánea. | Media |

## Reglas de Implementación

### Resolución de tokens CSS para Canvas
ECharts renderiza sobre Canvas. El Canvas API **no resuelve** CSS custom properties (`var(--token)`).
Pasar strings tipo `var(--token)` directamente a ECharts resulta en colores inválidos y ECharts
cae a sus defaults internos — el theming UBITS no se aplica.

**Regla obligatoria:** siempre resolver los valores reales de los tokens antes de pasarlos a ECharts:
```ts
const color = getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim()
// Produce: "#0c5bef" — valor concreto válido para Canvas
```

Para tokens HSL-channel (shadcn, e.g. `--foreground: 215 19% 23%`), envolver en `hsl()` con comas:
```ts
const hsl = (ch: string) => `hsl(${ch.replace(/\s+/g, ', ')})`
const colorText = hsl(getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim())
// Produce: "hsl(215, 19%, 23%)" — formato compatible con zrender/Canvas
```

- **Grids**: Líneas de fondo suaves y discretas.
- **Tooltips**: Estilo sobrio (fondo neutro, texto legible, sin bordes agresivos).
- **Leyendas**: Siempre alineadas y legibles, preferiblemente en la parte superior o inferior.
- **Interactividad**: Zoom, panning y hover deben ser fluidos pero no distractores.
- **Empty States**: Los gráficos sin datos deben mostrar un `EmptyChartState` coherente con el sistema.

## Accesibilidad
- Los colores deben tener contraste suficiente.
- Soporte para etiquetas de texto claras que no dependan solo del color para diferenciar categorías.
- Preparación para navegación por teclado (ECharts nativo).
