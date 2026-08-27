import * as React from "react";
import { Minimize2, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRailAutoHide } from "./railAutoHide";

interface ActionRailShellProps {
  /**
   * Actions that depend on what is selected right now. Pass null when nothing
   * is — the shell then drops the group and its divider entirely.
   */
  contextual?: React.ReactNode;
  /** Actions this screen always offers. */
  persistent: React.ReactNode;
  /**
   * Holds the rail open regardless of the auto-hide preference. Screens set it
   * while a selection exists: an action that needs a selection must not be one
   * pointer-move away from vanishing while someone reaches for it.
   */
  keepOpen?: boolean;
}

/**
 * The floating action rail, shared by every screen that has one.
 *
 * One shell rather than one per screen because it *is* one bar to the reader:
 * it sits in the same place, opens and closes the same way, and remembers
 * whether it should hide even after they move to another tab. Only its contents
 * are of the screen — which is why they arrive as two slots instead of the
 * whole bar being reimplemented next door.
 */
export function ActionRailShell({
  contextual = null,
  persistent,
  keepOpen = false,
}: ActionRailShellProps) {
  const [autoHide, setAutoHide] = useRailAutoHide();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCollapseTimer = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!autoHide || keepOpen) return;
    timeoutRef.current = setTimeout(() => setIsExpanded(false), 150);
  }, [autoHide, keepOpen]);

  React.useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsExpanded(!autoHide || keepOpen);
  }, [autoHide, keepOpen]);

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div className="pointer-events-none flex flex-col items-center justify-end pb-4">
      {/* Hover catch area, so the collapsed handle is easy to reach. */}
      <div
        className="pointer-events-auto flex h-16 flex-col items-center justify-end px-6"
        onMouseEnter={() => {
          setIsExpanded(true);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
        }}
        onMouseLeave={startCollapseTimer}
      >
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-3xl transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            isExpanded
              ? "h-14 max-w-[800px] border border-white/10 bg-surface-nav px-3 shadow-rail"
              // Collapsed: a full pill rather than a half-rounded hump, so the
              // handle reads as one continuous rounded line from any angle.
              : "h-1.5 w-[64px] max-w-[64px] translate-y-[2px] rounded-full border-transparent bg-border-strong shadow-card"
          )}
        >
          <div
            className={cn(
              "flex w-max items-center gap-2 transition-all duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              isExpanded ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            )}
          >
            {contextual && (
              <>
                {contextual}
                <div className="mx-1 my-2 w-px self-stretch bg-white/10" />
              </>
            )}

            {/* Always in the same spot, whatever screen this is: the toggle
                belongs to the bar, not to the actions it happens to hold. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAutoHide(!autoHide)}
                  aria-label={autoHide ? "Mantener barra abierta" : "Ocultar barra automáticamente"}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95"
                >
                  {autoHide ? (
                    <Pin className="h-[20px] w-[20px]" strokeWidth={2} />
                  ) : (
                    <Minimize2 className="h-[20px] w-[20px]" strokeWidth={2} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {autoHide ? "Mantener barra abierta" : "Ocultar barra automáticamente"}
              </TooltipContent>
            </Tooltip>

            {persistent}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The thin vertical rule that separates groups of rail actions. */
export function RailDivider() {
  return <div className="mx-1 my-2 w-px self-stretch bg-white/10" />;
}

/**
 * The glow that runs across the bar when its contextual group swaps. Lives
 * here so both rails announce a change of context identically.
 */
export function RailGroupShimmer({ animKey }: { animKey: number }) {
  return (
    <div
      key={`shimmer-${animKey}`}
      className="pointer-events-none absolute inset-0 rounded-3xl"
      style={{ animation: "railGroupShimmer 1200ms ease-out both", animationDelay: "200ms" }}
    />
  );
}

/**
 * Re-fires the stagger whenever the rail swaps which set of actions it shows.
 * Both rails need the same "did my context change?" signal, so it lives here.
 */
export function useContextChangeKey(context: string): number {
  const previous = React.useRef(context);
  const [key, setKey] = React.useState(0);

  React.useEffect(() => {
    if (previous.current !== context) {
      previous.current = context;
      setKey((current) => current + 1);
    }
  }, [context]);

  return key;
}
