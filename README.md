# Secciones y Subsecciones de Encuestas

Prototipo UBITS para la gestión de **secciones y subsecciones** de encuestas.

Basado en el proyecto `comparativo de encuestas` (design system, tokens, shell de navegación
e iconografía). El punto de partida es el **home** (listado de encuestas), traído sin cambios
desde ese proyecto.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 3 con tokens semánticos UBITS (`src/styles/tokens.css`)
- shadcn/ui + Radix UI (`src/components/ui`)
- ECharts para gráficas (`src/components/charts`)

## Comandos

```bash
npm install
npm run dev
npm run build
npm run type-check
npm run lint
```

## Estructura

```text
src/
├── App.tsx                 # Monta el shell + el home
├── screens/
│   ├── PlaygroundShellDemo.tsx      # Shell: sidebar rail + tabs
│   ├── EncuestasDashboard.tsx       # Home: listado de encuestas
│   └── DatosDemograficosDashboard.tsx
├── components/             # Design system (ui, charts, forms, navigation, ...)
├── config/                 # Configuración de navegación
├── icons/                  # Sistema de iconos UBITS
├── mocks/                  # Datos de prueba
└── styles/                 # tokens.css + globals.css
```

## Qué se trajo del proyecto base

Se copió toda la base compartida (configs, design system, tokens, iconos, mocks, docs) y
únicamente las pantallas del home. Las pantallas del comparativo (`ComparativeDashboard`,
`PDFPreview`, `SurveyAnalyticsDashboard`) **no** se trajeron porque no forman parte del
alcance de este proyecto.

La documentación heredada del proyecto base está en [`docs/`](docs/); es material de
referencia del design system y del shell.
