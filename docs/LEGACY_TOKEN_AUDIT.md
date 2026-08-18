# Legacy Token Audit

| Token / variable legacy | Valor legacy | Token UBITS (Alias) | shadcn Semantic | Coincide | Acción recomendada |
|---|---|---|---|---|---|
| `--ubits-accent-brand` | `#0c5bef` | `--color-brand` | `--primary` | Sí | Mapear a `--primary` |
| `--ubits-sidebar-bg` | `#202837` | `--color-surface-nav` | N/A (Layout) | No | Usar Navy oficial (#0A0A60) |
| `--ubits-bg-1` | `#ffffff` | `--color-surface` | `--card`, `--popover` | Sí | Base para cards blancas |
| `--ubits-bg-2` | `#F3F3F4` | `--color-bg-app` | `--background` | No | Fondo sobrio B2B |
| `--ubits-fg-1-high` | `#303a47` | `--color-text-primary`| `--foreground` | No | Contraste enterprise |
| `--ubits-feedback-accent-success` | `#328e2c` | `--color-success` | N/A (Custom) | Sí | Mantener valor legacy |
| `--ubits-feedback-accent-error` | `#e9343c` | `--color-error` | `--destructive` | No | Usar rojo oficial UBITS |

## Estrategia de Tokens
Se utilizará un sistema de dos capas en `src/styles/tokens.css`:

1. **UBITS Aliases (Fuente de Verdad):**
   - `--color-brand: #0C5BEF;`
   - `--color-surface-nav: #0A0A60;`
   - `--color-surface: #FFFFFF;`

2. **shadcn Semantics (Mapeo):**
   - `--primary: var(--color-brand);`
   - `--background: var(--color-bg-app);`
   - `--card: var(--color-surface);`
   - `--foreground: var(--color-text-primary);`

## Observaciones Generales
- **Sobriedad:** Se eliminan referencias a "vibrante" o "profundo" en favor de "limpio" y "B2B enterprise".
- **Cards:** Siempre fondo blanco con bordes sutiles, evitando elevaciones complejas.
- **Acción:** El azul UBITS se reserva para elementos interactivos primarios.
