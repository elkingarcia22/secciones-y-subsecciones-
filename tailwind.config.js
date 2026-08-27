import tailwindAnimate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* shadcn semantic mapping to UBITS tokens (using HSL for opacity support) */
        border: "hsl(var(--border) / <alpha-value>)",
        /* Sin este mapeo, `text-border-strong` y `border-border-strong/40`
           (usados en AppSidebar y EncuestasDashboard) no generaban ninguna regla. */
        "border-strong": "hsl(var(--color-border-strong-hsl) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        info: "hsl(var(--info) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        nav: "hsl(var(--nav) / <alpha-value>)",
        "nav-foreground": "hsl(var(--nav-foreground) / <alpha-value>)",
        
        /* UBITS Semantic Design System Utilities (Legacy/Direct HEX) */
        brand: {
          DEFAULT: "var(--color-brand)",
          hover: "var(--color-brand-hover)",
          pressed: "var(--color-brand-pressed)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          nav: "var(--color-surface-nav)",
          muted: "var(--color-surface-muted)",
          subtle: "var(--color-surface-subtle)",
        },
        "tab-track": "var(--color-tab-track)",
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
        },
        status: {
          positive: "hsl(var(--color-positive-hsl) / <alpha-value>)",
          "positive-dark": "var(--color-positive-dark)",
          "positive-bg": "var(--color-positive-bg)",
          negative: "hsl(var(--color-negative-hsl) / <alpha-value>)",
          warning: "hsl(var(--color-warning-hsl) / <alpha-value>)",
          "warning-light": "var(--color-warning-light)",
          info: "hsl(var(--color-info-hsl) / <alpha-value>)",
        },
        ai: {
          bg: "var(--color-ai-bg)",
          border: "var(--color-ai-border)",
        },
      },
      /*
       * The whole scale is declared here, 2xl and 3xl included. Leaving those
       * two on Tailwind's defaults is what made the scale non-monotonic:
       * `rounded-lg` resolved to 20px while `rounded-2xl` stayed at 16px, so
       * a card came out rounder than the panel containing it.
       */
      borderRadius: {
        DEFAULT: "var(--radius-xs)",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        drawer: "var(--shadow-drawer)",
        rail: "var(--shadow-rail)",
        premium: "var(--shadow-premium)",
        "ai-premium": "var(--shadow-ai-premium)",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "sans-serif"],
        body: ["var(--font-body)"],
        heading: ["var(--font-heading)"],
      },
      /*
       * `data-open:` / `data-closed:` — los componentes de overlay (sheet,
       * dialog, popover, dropdown, tooltip…) vienen escritos con la sintaxis
       * de Tailwind v4. En v3 esos modificadores no existen salvo que se
       * declaren aquí, así que TODAS sus clases de animación no generaban
       * ninguna regla: los drawers aparecían y desaparecían de golpe.
       */
      data: {
        open: 'state="open"',
        closed: 'state="closed"',
      },
      keyframes: {
        "highlight-row": {
          "0%": { backgroundColor: "rgba(56, 101, 245, 0.8)" },
          "100%": { backgroundColor: "transparent" }
        },
        /* Overlay: solo opacidad, para no competir con el panel. */
        "overlay-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "overlay-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        /*
         * Drawer: desplazamiento completo desde su borde. El plugin
         * `tailwindcss-animate` haría lo mismo, pero su keyframe genérico
         * escribe `transform` entero, así que cualquier panel con transform
         * propio (los diálogos centrados) se rompe. Declararlos aquí deja
         * cada movimiento explícito y con su propia curva.
         */
        "drawer-in-right": {
          from: { transform: "translate3d(100%, 0, 0)" },
          to: { transform: "translate3d(0, 0, 0)" },
        },
        /* La salida suma una atenuación de opacidad al desplazamiento: solo
           trasladar se lee como un corte seco justo en el borde de la
           pantalla, mientras que desvanecerse a la vez que se mueve se lee
           como que el panel se disuelve en el camino — más transitorio. */
        "drawer-out-right": {
          from: { transform: "translate3d(0, 0, 0)", opacity: "1" },
          to: { transform: "translate3d(100%, 0, 0)", opacity: "0.3" },
        },
        "drawer-in-left": {
          from: { transform: "translate3d(-100%, 0, 0)" },
          to: { transform: "translate3d(0, 0, 0)" },
        },
        "drawer-out-left": {
          from: { transform: "translate3d(0, 0, 0)", opacity: "1" },
          to: { transform: "translate3d(-100%, 0, 0)", opacity: "0.3" },
        },
        "drawer-in-top": {
          from: { transform: "translate3d(0, -100%, 0)" },
          to: { transform: "translate3d(0, 0, 0)" },
        },
        "drawer-out-top": {
          from: { transform: "translate3d(0, 0, 0)", opacity: "1" },
          to: { transform: "translate3d(0, -100%, 0)", opacity: "0.3" },
        },
        "drawer-in-bottom": {
          from: { transform: "translate3d(0, 100%, 0)" },
          to: { transform: "translate3d(0, 0, 0)" },
        },
        "drawer-out-bottom": {
          from: { transform: "translate3d(0, 0, 0)", opacity: "1" },
          to: { transform: "translate3d(0, 100%, 0)", opacity: "0.3" },
        },
        /* Diálogo centrado: el translate de centrado viaja dentro del
           keyframe, así que la escala no lo pisa a mitad de animación. */
        "dialog-in": {
          from: { opacity: "0", transform: "translate3d(-50%, -50%, 0) scale(0.96)" },
          to: { opacity: "1", transform: "translate3d(-50%, -50%, 0) scale(1)" },
        },
        "dialog-out": {
          from: { opacity: "1", transform: "translate3d(-50%, -50%, 0) scale(1)" },
          to: { opacity: "0", transform: "translate3d(-50%, -50%, 0) scale(0.96)" },
        },
      },
      animation: {
        "highlight-row": "highlight-row 3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        /* La salida es incluso más larga que la entrada: quitarse de en medio
           rápido se leía como un corte, no como una transición. Una curva
           ease-in-out sobre una duración generosa deja que el ojo siga el
           recorrido completo en vez de percibir un salto entre "abierto" y
           "cerrado". */
        "overlay-in": "overlay-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "overlay-out": "overlay-out 380ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "drawer-in-right": "drawer-in-right 340ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "drawer-out-right": "drawer-out-right 420ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "drawer-in-left": "drawer-in-left 340ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "drawer-out-left": "drawer-out-left 420ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "drawer-in-top": "drawer-in-top 340ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "drawer-out-top": "drawer-out-top 420ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "drawer-in-bottom": "drawer-in-bottom 340ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "drawer-out-bottom": "drawer-out-bottom 420ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "dialog-in": "dialog-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "dialog-out": "dialog-out 160ms cubic-bezier(0.4, 0, 1, 1) both",
      }
    },
  },
  darkMode: "class",
  plugins: [tailwindAnimate],
}
