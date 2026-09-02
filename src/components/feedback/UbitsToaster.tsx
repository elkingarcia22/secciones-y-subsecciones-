import * as React from "react"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

/**
 * Clears the app header (h-14, plus the shell's own p-2 outer padding) with
 * room to spare, so the stack never starts flush against it.
 */
const DEFAULT_TOP_OFFSET_PX = 76

/**
 * UbitsToaster
 *
 * Wrapper for Sonner notifications following UBITS B2B standards. Stacked in
 * the top-right corner, clear of the header, so feedback about what just
 * happened doesn't sit on top of — or get mistaken for — the screen's own
 * bottom action bar. Detects the system theme (light/dark) from
 * documentElement classes.
 *
 * Mounted once, at the app level — a second instance elsewhere would render
 * every toast twice, since both would read the same toast queue.
 */
export function UbitsToaster({
  className,
  style,
  topOffset = DEFAULT_TOP_OFFSET_PX,
}: {
  className?: string
  style?: React.CSSProperties
  /** Distance in px from the viewport top to the toast stack — enough to
   * clear the app header. */
  topOffset?: number
}) {
  const [theme, setTheme] = React.useState<"light" | "dark">("light")

  React.useEffect(() => {
    // Initial check
    const isDark = document.documentElement.classList.contains("dark")
    setTheme(isDark ? "dark" : "light")

    // Observer to react to manual theme changes in SidebarRail
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const isDarkNow = document.documentElement.classList.contains("dark")
          setTheme(isDarkNow ? "dark" : "light")
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"]
    })

    return () => observer.disconnect()
  }, [])

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      offset={{ top: topOffset }}
      closeButton
      richColors={false} // Keeping it sober as per UBITS rules
      expand={false}
      className={className}
      style={style}
    />
  )
}
