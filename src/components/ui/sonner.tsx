import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

type ToasterTheme = "light" | "dark" | "system"

const Toaster = ({ theme = "system", ...props }: ToasterProps & { theme?: ToasterTheme }) => {
  return (
    <Sonner
      theme={theme}
      className={`toaster group ${props.className || ""}`}
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-status-positive" />
        ),
        info: (
          <InfoIcon className="size-4 text-status-info" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-status-warning" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-status-negative" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-primary" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-drawer",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-status-positive/20",
          error: "group-[.toaster]:border-status-negative/20",
          warning: "group-[.toaster]:border-status-warning/20",
          info: "group-[.toaster]:border-status-info/20",
          // Sonner default: a 20px circle absolutely pinned to the toast's
          // corner, half hanging off the edge — a small, easy-to-miss target.
          // This instead flows as the last item in the toast's own row (order
          // + static position), landing fully on the card at a normal
          // icon-button size, so there's a real 28px area to aim for instead
          // of a sliver at the rim.
          closeButton:
            "group-[.toast]:!static group-[.toast]:!order-last group-[.toast]:!left-auto group-[.toast]:!right-auto group-[.toast]:!top-auto group-[.toast]:!ml-2 group-[.toast]:!size-7 group-[.toast]:![transform:none] group-[.toast]:!rounded-md group-[.toast]:!border-transparent group-[.toast]:!bg-transparent group-[.toast]:!text-muted-foreground [&_svg]:!size-4 hover:group-[.toast]:!bg-muted hover:group-[.toast]:!text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
