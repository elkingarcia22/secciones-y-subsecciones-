import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        // El velo solo se funde: cualquier movimiento aquí competiría con el
        // del panel, que es lo que la persona sigue con la vista.
        "fixed inset-0 z-50 bg-black/10 supports-[backdrop-filter]:backdrop-blur-[2px] data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out",
        className
      )}
      {...props}
    />
  )
}

/** Dónde se ancla el panel según el lado del que sale. */
const sidePositionClasses = {
  right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm rounded-l-2xl",
  left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm rounded-r-2xl",
  top: "inset-x-0 top-0 h-auto border-b rounded-b-2xl",
  bottom: "inset-x-0 bottom-0 h-auto border-t rounded-t-2xl",
} as const

/**
 * El movimiento de entrada y salida, por lado.
 *
 * El panel recorre su ancho completo desde fuera de la pantalla, no los 40px
 * de antes: un desplazamiento corto se lee como un salto, uno completo se lee
 * como que el panel viene de algún sitio. La curva de entrada frena al final
 * (expo-out) y la de salida arranca despacio, así abrir se siente atendido y
 * cerrar se siente rápido.
 */
const sideMotionClasses = {
  right: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=open]:duration-500 data-[state=closed]:duration-300 transition ease-in-out",
  left: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left data-[state=open]:duration-500 data-[state=closed]:duration-300 transition ease-in-out",
  top: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top data-[state=open]:duration-500 data-[state=closed]:duration-300 transition ease-in-out",
  bottom: "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom data-[state=open]:duration-500 data-[state=closed]:duration-300 transition ease-in-out",
} as const

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          // `gap-4` leaves seams between header/body/footer that this
          // background shows through — bg-background instead of bg-popover
          // so those seams read as the app's own tone, not raw white.
          "fixed z-50 flex flex-col gap-4 overflow-hidden bg-background bg-clip-padding text-sm text-popover-foreground shadow-drawer will-change-transform",
          sidePositionClasses[side],
          sideMotionClasses[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-3 right-3"
              size="icon-sm"
            >
              <XIcon
              />
              <span className="sr-only">Close</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
