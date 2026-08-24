import * as React from "react"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

/**
 * Falls back to the tallest bar in the app (the survey list's, which also has
 * to clear the legal footer beneath it) when nobody names a shorter one.
 */
const DEFAULT_BOTTOM_OFFSET_PX = 144

/**
 * UbitsToaster
 *
 * Wrapper for Sonner notifications following UBITS B2B standards.
 * Centered above the screen's bottom action bar rather than tucked in a
 * corner, so feedback about what just happened sits where they're already
 * looking instead of competing with — or hiding behind — the action bar.
 * Detects the system theme (light/dark) from documentElement classes.
 *
 * Mounted once, at the app level — a second instance elsewhere would render
 * every toast twice, since both would read the same toast queue. Screens
 * don't share a bottom bar height (the survey list also clears a legal
 * footer the other screens don't have), so the one mount takes an offset
 * from whichever screen is current rather than guessing a single number.
 */
export function UbitsToaster({
  className,
  style,
  bottomOffset = DEFAULT_BOTTOM_OFFSET_PX,
}: {
  className?: string
  style?: React.CSSProperties
  /** Distance in px from the viewport bottom to the toast stack — enough to
   * clear the current screen's own bottom bar. */
  bottomOffset?: number
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
      position="bottom-center"
      offset={{ bottom: bottomOffset }}
      closeButton
      richColors={false} // Keeping it sober as per UBITS rules
      expand={false}
      className={className}
      style={style}
    />
  )
}
