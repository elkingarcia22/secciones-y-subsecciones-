import * as React from "react"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

/** Footer bar height (h-16) plus its border, so the offset below clears it exactly. */
const FOOTER_HEIGHT_PX = 65

/**
 * UbitsToaster
 *
 * Wrapper for Sonner notifications following UBITS B2B standards.
 * Centered above the wizard's bottom action bar rather than tucked in a
 * corner, so feedback about the step the author is on sits where they're
 * already looking instead of competing with the footer buttons.
 * Detects the system theme (light/dark) from documentElement classes.
 */
export function UbitsToaster({ className, style }: { className?: string, style?: React.CSSProperties }) {
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
      offset={{ bottom: FOOTER_HEIGHT_PX + 16 }}
      closeButton
      richColors={false} // Keeping it sober as per UBITS rules
      expand={false}
      className={className}
      style={style}
    />
  )
}
