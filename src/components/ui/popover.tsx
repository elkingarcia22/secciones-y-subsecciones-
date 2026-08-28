import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  collisionPadding = 16,
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> &
  Pick<React.ComponentProps<typeof PopoverPrimitive.Portal>, "container">) {
  return (
    <PopoverPrimitive.Portal container={container}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          // Base
          "z-50 flex w-72 origin-[var(--radix-popover-content-transform-origin)] flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-drawer ring-1 ring-foreground/10 outline-none",
          // Open: emerge desde el origen del botón (scale + fade + dirección por lado)
          "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.96]",
          "data-[side=bottom]:data-open:slide-in-from-top-1",
          "data-[side=top]:data-open:slide-in-from-bottom-1",
          "data-[side=left]:data-open:slide-in-from-right-1",
          "data-[side=right]:data-open:slide-in-from-left-1",
          // Open duration — más lento en la entrada para que se perciban los stagger items
          "data-open:duration-[280ms] data-open:[animation-timing-function:cubic-bezier(0.16,1,0.3,1)]",
          // Close: salida rápida y limpia
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.97]",
          "data-[side=bottom]:data-closed:slide-out-to-top-1",
          "data-[side=top]:data-closed:slide-out-to-bottom-1",
          "data-[side=left]:data-closed:slide-out-to-right-1",
          "data-[side=right]:data-closed:slide-out-to-left-1",
          "data-closed:duration-[180ms] data-closed:[animation-timing-function:cubic-bezier(0.4,0,1,1)]",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <div
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
