import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Same visual language as Popover, opened by hover instead of click — for
 * content that explains something in passing (a definition, a stat readout)
 * rather than content the user deliberately opens and dismisses.
 */
function HoverCard({
  openDelay = 150,
  closeDelay = 100,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return (
    <HoverCardPrimitive.Root
      data-slot="hover-card"
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  collisionPadding = 16,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(
          "z-50 flex w-72 origin-[var(--radix-hover-card-content-transform-origin)] flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm text-popover-foreground shadow-drawer ring-1 ring-foreground/10 outline-none max-h-[var(--radix-hover-card-content-available-height)] overflow-y-auto data-[side=bottom]:data-open:slide-in-from-top-2 data-[side=left]:data-open:slide-in-from-right-2 data-[side=right]:data-open:slide-in-from-left-2 data-[side=top]:data-open:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:duration-200 data-open:[animation-timing-function:cubic-bezier(0.16,1,0.3,1)] data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-closed:duration-200 data-closed:[animation-timing-function:cubic-bezier(0.4,0,1,1)]",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
