import * as React from "react"

import { cn } from "@/lib/utils"

/*
 * Píldora de resaltado que persigue al ítem activo de un popup de Radix.
 *
 * Antes cada ítem se pintaba su propio fondo (`focus:bg-accent`): el resaltado
 * desaparecía en un sitio y reaparecía en otro, de golpe. Aquí el fondo es UN
 * solo elemento absoluto que se traslada hasta el ítem activo, así que recorrer
 * la lista se lee como un movimiento continuo en vez de un parpadeo por ítem —
 * y el teclado hereda el mismo recorrido gratis.
 *
 * Se monta como PRIMER hijo del contenedor con scroll (el viewport del Select o
 * el Content del DropdownMenu, ambos `relative`). Primero en el DOM para quedar
 * por debajo de los ítems; `absolute` dentro del scroller para acompañar al
 * contenido cuando la lista se desplaza.
 */

/*
 * Cómo se averigua cuál es el ítem activo. Las tres listas del proyecto lo
 * marcan de forma distinta y hay que cubrir las tres:
 *
 *   - DropdownMenu (radix react-menu) pone `data-highlighted` en el ítem.
 *   - Command (cmdk) pone `data-selected="true"`, y deja el foco en el input:
 *     el DOM enfocado nunca es el ítem, solo el atributo cambia.
 *   - Select (radix react-select) no pone ningún atributo: mueve el foco real
 *     del DOM al ítem, que es de donde sale el `focus:` de sus estilos.
 *
 * De ahí que haya dos estrategias: primero los atributos, y si no hay ninguno,
 * el nodo enfocado. `data-radix-collection-item` / `[cmdk-item]` sirven para
 * subir desde ese nodo hasta el ítem que lo contiene (el foco puede estar en un
 * hijo, y los sub-trigger del menú también son ítems).
 */
const MARKED_SELECTOR = '[data-highlighted], [cmdk-item][data-selected="true"]'
const ITEM_SELECTOR = "[data-radix-collection-item], [cmdk-item]"

/* Los atributos que hay que vigilar para saber que el ítem activo cambió. */
const WATCHED_ATTRIBUTES = ["data-highlighted", "data-selected"]

function resolveActiveItem(container: HTMLElement): HTMLElement | null {
  const marked = container.querySelector<HTMLElement>(MARKED_SELECTOR)
  if (marked) return marked

  const focused = document.activeElement
  if (focused instanceof HTMLElement && container.contains(focused)) {
    return focused.closest<HTMLElement>(ITEM_SELECTOR)
  }
  return null
}

/*
 * La posición se mide con `offsetTop`/`offsetLeft`, no con
 * `getBoundingClientRect`: son coordenadas de layout, así que no las altera el
 * scroll del contenedor ni el `transform` de la animación de entrada en
 * cascada de los propios ítems.
 */
type Placement = {
  top: number
  left: number
  width: number
  height: number
  /*
   * El radio se copia del ítem en vez de fijarse aquí: cada lista usa el suyo
   * (`rounded-sm` en el Select, `rounded-lg` en el DropdownMenu, y el ítem de
   * Command lo cambia cuando vive dentro de un diálogo). Un radio propio se
   * desalinearía de las esquinas del ítem que está resaltando.
   */
  radius: string
}

function measure(item: HTMLElement): Placement {
  return {
    top: item.offsetTop,
    left: item.offsetLeft,
    width: item.offsetWidth,
    height: item.offsetHeight,
    radius: getComputedStyle(item).borderRadius,
  }
}

function samePlacement(a: Placement | null, b: Placement | null) {
  if (!a || !b) return a === b
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height &&
    a.radius === b.radius
  )
}

type HighlightState = {
  placement: Placement | null
  visible: boolean
  /* Un ítem destructivo tiñe la píldora en lugar de pintarse el fondo él mismo. */
  variant: string | null
  /*
   * Al aparecer, la píldora no debe deslizarse desde el origen del contenedor:
   * solo se desliza cuando ya estaba visible sobre otro ítem.
   */
  slide: boolean
}

const INITIAL: HighlightState = {
  placement: null,
  visible: false,
  variant: null,
  slide: false,
}

export function FluidHighlight({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [state, setState] = React.useState<HighlightState>(INITIAL)

  React.useEffect(() => {
    const container = ref.current?.parentElement
    if (!container) return

    let previous: Placement | null = null
    let lastActive: HTMLElement | null = null
    let queued = false
    let disposed = false

    const sync = () => {
      queued = false
      if (disposed) return
      const active = resolveActiveItem(container)
      /*
       * Salir antes de medir cuando el ítem activo no ha cambiado: `sync` se
       * dispara también desde `pointermove`, y leer `offsetTop` fuerza un
       * reflow. Con esta guarda mover el ratón dentro de un mismo ítem no
       * cuesta nada.
       */
      if (active === lastActive) return
      lastActive = active

      const next = active ? measure(active) : null
      const slide = previous !== null && next !== null
      previous = next

      setState((current) => {
        /* Sin ítem activo la píldora se desvanece donde está, no salta al origen. */
        if (!next) {
          return current.visible ? { ...current, visible: false } : current
        }
        const variant = active?.dataset.variant ?? null
        if (
          current.visible &&
          current.variant === variant &&
          samePlacement(current.placement, next)
        ) {
          return current
        }
        return { placement: next, visible: true, variant, slide }
      })
    }

    /*
     * Todo se difiere a una microtarea coalescida, a propósito. Pasar de un
     * ítem a otro dispara `focusout` y luego `focusin`: atender el `focusout`
     * al instante apagaría la píldora justo antes de reencenderla en el
     * destino, que es el parpadeo que este componente existe para eliminar.
     * Radix emite los dos dentro de la misma tarea (un `.focus()` síncrono),
     * así que la microtarea se ejecuta cuando el foco ya está asentado y solo
     * se lee un estado.
     *
     * Microtarea y no `requestAnimationFrame`: un popup montado con la pestaña
     * en segundo plano no recibe frames, y ahí la píldora quedaría sin colocar
     * hasta volver a la pestaña.
     */
    const schedule = () => {
      if (queued) return
      queued = true
      queueMicrotask(sync)
    }

    sync()

    /*
     * `pointermove` además de los eventos de foco, y no por redundancia: el
     * resaltado de Radix Select se mueve llamando a `.focus()` sobre el ítem
     * bajo el cursor, y `focus()` NO emite `focusin` si el documento no tiene
     * el foco del sistema (otra ventana al frente, panel de preview en
     * segundo plano). En ese estado `document.activeElement` sí se actualiza,
     * así que el `pointermove` es lo que mantiene la píldora sincronizada.
     */
    container.addEventListener("focusin", schedule)
    container.addEventListener("focusout", schedule)
    container.addEventListener("pointermove", schedule)
    container.addEventListener("pointerleave", schedule)
    const observer = new MutationObserver(schedule)
    observer.observe(container, {
      subtree: true,
      attributes: true,
      attributeFilter: WATCHED_ATTRIBUTES,
    })

    return () => {
      disposed = true
      container.removeEventListener("focusin", schedule)
      container.removeEventListener("focusout", schedule)
      container.removeEventListener("pointermove", schedule)
      container.removeEventListener("pointerleave", schedule)
      observer.disconnect()
    }
  }, [])

  const { placement, visible, variant, slide } = state

  return (
    <div
      ref={ref}
      aria-hidden
      data-slot="fluid-highlight"
      data-variant={variant ?? undefined}
      data-slide={slide ? "true" : "false"}
      className={cn(
        "pointer-events-none absolute left-0 top-0 bg-accent",
        "data-[variant=destructive]:bg-destructive/10 dark:data-[variant=destructive]:bg-destructive/20",
        className
      )}
      style={{
        width: placement?.width ?? 0,
        height: placement?.height ?? 0,
        borderRadius: placement?.radius,
        transform: `translate3d(${placement?.left ?? 0}px, ${placement?.top ?? 0}px, 0)`,
        opacity: visible && placement ? 1 : 0,
      }}
    />
  )
}
