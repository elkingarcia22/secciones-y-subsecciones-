import * as React from "react";
import { cn } from "@/lib/utils";
import { useRailAutoHide } from "./railAutoHide";
import { RailOrientationContext, useRailIsVertical, useRailOrientation } from "./railOrientation";
import { useDraggableRail } from "./useDraggableRail";
import { RailDragHandle } from "./RailDragHandle";
import { RailSettingsMenu } from "./RailSettingsMenu";
import { motion } from "framer-motion";

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
 * whether it should hide — and which way it lies — even after they move to
 * another tab. Only its contents are of the screen, which is why they arrive
 * as two slots instead of the whole bar being reimplemented next door.
 */
export function ActionRailShell({
  contextual = null,
  persistent,
  keepOpen = false,
}: ActionRailShellProps) {
  const [autoHide] = useRailAutoHide();
  const [orientation] = useRailOrientation();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVertical = orientation === "vertical";
  const { barRef, position, isDragging, gripHandlers } = useDraggableRail();

  const startCollapseTimer = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!autoHide || keepOpen || isDragging) return;
    timeoutRef.current = setTimeout(() => setIsExpanded(false), 150);
  }, [autoHide, keepOpen, isDragging]);

  React.useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsExpanded(!autoHide || keepOpen);
  }, [autoHide, keepOpen]);

  // Keep the rail open for the whole gesture — autoHide collapsing it out
  // from under a drag in progress would strand the grip mid-move.
  React.useEffect(() => {
    if (!isDragging) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsExpanded(true);
  }, [isDragging]);

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  // Undragged, the two axes dock in different places: flat along the bottom of
  // the shell's own anchor, upright against the right edge of the viewport.
  // The upright dock has to be fixed because the anchor it is portalled into
  // is a bottom strip with no height to centre against. It keeps a gap off the
  // edge so its collapsed pill lands beside the page's scrollbar rather than
  // on top of it — at that size the two are the same mark, and a handle that
  // reads as a scrollbar thumb invites the wrong drag.
  const isFloating = position != null || isVertical;
  const floatingStyle = position
    ? { left: position.x, top: position.y, transform: "translateX(-50%)" }
    : { right: 20, top: "50%", transform: "translateY(-50%)" };

  return (
    <RailOrientationContext.Provider value={orientation}>
      <div
        className={cn(
          "pointer-events-none flex justify-end",
          isVertical ? "flex-row items-center pr-1" : "flex-col items-center pb-4"
        )}
      >
        {/* Hover catch area, so the collapsed handle is easy to reach. Switches
            to fixed positioning once dragged, so it can sit anywhere in the
            viewport instead of only at the shell's dock. `position.x` is that
            spot's center, and this box's own width swings between the expanded
            bar and the collapsed pill — anchoring via `left` plus
            `translateX(-50%)` keeps the center fixed at the drop point instead
            of the left edge, so collapsing doesn't drag the visible mark
            leftward with it. */}
        <div
          ref={barRef}
          className={cn(
            "pointer-events-auto flex justify-end",
            isVertical ? "w-16 flex-row items-center py-6" : "h-16 flex-col items-center px-6",
            isFloating && "fixed z-[60]"
          )}
          style={isFloating ? floatingStyle : undefined}
          onMouseEnter={() => {
            setIsExpanded(true);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={startCollapseTimer}
        >
          <motion.div
            layout={!isDragging}
            initial={false}
            transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
            className={cn(
              "relative flex items-center justify-center rounded-3xl",
              isExpanded
                ? cn(
                    "border border-white/10 bg-surface-nav shadow-rail overflow-visible",
                    isVertical ? "w-14 max-h-[800px] py-3" : "h-14 max-w-[800px] px-3"
                  )
                : // Collapsed: a full pill rather than a half-rounded hump, so
                  // the handle reads as one continuous rounded line from any
                  // angle. It lies along the same axis as the bar it replaces.
                  cn(
                    "rounded-full border-transparent bg-border-strong shadow-card overflow-hidden",
                    isVertical
                      ? "h-[64px] max-h-[64px] w-1.5 translate-x-[2px]"
                      : "h-1.5 w-[64px] max-w-[64px] translate-y-[2px]"
                  )
            )}
          >
            <motion.div
              layout={isDragging ? false : "position"}
              transition={{ type: "spring", bounce: 0.35, duration: 0.7 }}
              className={cn(
                "dock-container flex items-center gap-2",
                isVertical ? "h-max flex-col" : "w-max",
                isExpanded
                  ? "scale-100 opacity-100 transition-opacity duration-300"
                  : "pointer-events-none scale-95 opacity-0 transition-opacity duration-150"
              )}
            >
              {/* The bar's own controls, kept together at the head of the
                  rail: where it sits, and how it behaves. Neither touches the
                  screen's content, so they read as one group and the divider
                  after them is the line between "the bar" and "the work". */}
              {isExpanded && (
                <>
                  <RailDragHandle isDragging={isDragging} {...gripHandlers} />
                  <RailSettingsMenu />
                  <RailDivider />
                </>
              )}

              {contextual && (
                <>
                  {contextual}
                  <RailDivider />
                </>
              )}

              {persistent}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </RailOrientationContext.Provider>
  );
}

/** The thin rule that separates groups of rail actions, across whichever axis
 *  the bar is currently drawn on. */
export function RailDivider() {
  const isVertical = useRailIsVertical();
  return (
    <div
      className={cn("self-stretch bg-white/10", isVertical ? "mx-2 my-1 h-px" : "mx-1 my-2 w-px")}
    />
  );
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
