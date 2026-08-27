"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * The app has exactly two tab treatments, and which one a strip gets is decided
 * by where it sits, not by what it switches:
 *
 *   `page` — spans the full width at the top of a page or panel and changes
 *            everything below it. Filled pill, 40px. Loud enough to hold a
 *            whole screen on its own.
 *   `view` — sits inline in a toolbar row beside other controls and changes one
 *            region. The sidebar's own segmented control: recessed track,
 *            raised surface on the active segment, label in the accent.
 *
 * The tier lives on TabsList and reaches the triggers through context, so a
 * strip declared with the raw primitives comes out identical to one declared
 * through UbitsTabs.
 */
export type TabsVariant = "view" | "page"

const TabsVariantContext = React.createContext<TabsVariant>("view")

const Tabs = TabsPrimitive.Root

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVariant
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "view", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        // `bg-muted` casi no se distinguía del fondo de la página. `bg-accent`
        // sí contrastaba, pero como bloque sólido y grisáceo se veía pesado —
        // sobre todo en oscuro, donde salía un azul marino compacto encima de
        // un fondo casi negro. `tab-track` es un paso de luz, no un color
        // distinto: mismo tono que el fondo, apenas más claro.
        "inline-flex items-center justify-center bg-tab-track p-1 text-text-secondary",
        // 36px es el alto del control segmentado del menú: 4px de pista por
        // lado más una pastilla de 28. 40px es el de un input o una acción
        // primaria, que es la escala a la que juega la navegación de página.
        variant === "page" ? "h-10 rounded-full" : "h-9 rounded-lg",
        className
      )}
      {...props}
    />
  </TabsVariantContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext)
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex h-full items-center justify-center gap-2 whitespace-nowrap px-3 py-0 text-[13px] font-medium ring-offset-background transition-all hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:font-semibold data-[state=active]:shadow-card",
        variant === "page"
          ? "rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          : // Superficie elevada y etiqueta en azul: el mismo lenguaje que la
            // fila activa del menú (bg-surface-muted font-semibold text-primary).
            "rounded-md data-[state=active]:bg-surface data-[state=active]:text-primary",
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))

TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
