import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * The design system adds named elevations (`shadow-card`, `shadow-drawer`, …)
 * on top of Tailwind's numeric scale. Unregistered, tailwind-merge reads those
 * as shadow *colours* and lets a base `shadow-md` survive next to them — so an
 * override silently loses to whichever rule the stylesheet emits last.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [{ shadow: ["card", "drawer", "premium", "ai-premium"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
