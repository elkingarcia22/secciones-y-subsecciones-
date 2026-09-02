import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { OptionTally, QuestionBreakdown } from "@/mocks/questionResponses";
import { FAVORABILITY_BANDS, NSNR, NSNR_BG, NSNR_BORDER, NSNR_TEXT } from "./favorabilityScale";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";

/** Colours a tally takes: its band's, or the NS/NR grey when it's off-scale. */
function tallyPalette(tally: OptionTally, accent: string) {
  if (tally.isNsNr) {
    return { color: NSNR, background: NSNR_BG, border: NSNR_BORDER, foreground: NSNR_TEXT };
  }
  if (tally.bandIndex !== null) {
    const band = FAVORABILITY_BANDS[tally.bandIndex];
    return {
      color: band.color ?? accent,
      background: band.background,
      border: band.border,
      foreground: band.foreground,
    };
  }
  // Choice options and NPS points sit outside the favorability scale: they get
  // the brand accent so they never read as "good" or "bad" by colour alone.
  return { color: accent, background: "hsl(var(--muted))", border: "hsl(var(--border))", foreground: "hsl(var(--muted-foreground))" };
}

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);
const formatShare = (value: number) => `${value.toFixed(1).replace(/\.0$/, "").replace(".", ",")}%`;

interface AnswerTallyListProps {
  breakdown: QuestionBreakdown;
  /** Opens the roster filtered to the people who gave this answer. */
  onDrillDown?: (tallyId: string) => void;
  /** NPS and long option lists read better as a compact row of columns. */
  dense?: boolean;
}

/**
 * How the answers to one question split, option by option.
 *
 * The bar is per-option and horizontal rather than one stacked bar, because
 * this view exists to answer a counting question — *how many picked a 4* — and
 * a stacked bar is built to answer a shape question. The stacked bar still
 * appears above it, where the shape belongs.
 *
 * Each row is a way in: clicking it opens the roster narrowed to exactly the
 * people behind that number, which is the whole point of having the number.
 */
export function AnswerTallyList({ breakdown, onDrillDown, dense }: AnswerTallyListProps) {
  const max = React.useMemo(
    () => Math.max(1, ...breakdown.tallies.map((tally) => tally.count)),
    [breakdown.tallies]
  );
  const accent = "hsl(var(--primary))";

  if (breakdown.tallies.length === 0) return null;

  if (dense) {
    return (
      <motion.div
        className="flex flex-wrap gap-2"
        initial="hidden"
        animate="show"
        variants={cascadeContainer}
      >
        {breakdown.tallies.map((tally) => {
          const palette = tallyPalette(tally, accent);
          const interactive = onDrillDown !== undefined && tally.count > 0;
          return (
            <motion.button
              key={tally.id}
              variants={cascadeItem}
              type="button"
              disabled={!interactive}
              onClick={() => onDrillDown?.(tally.id)}
              className={cn(
                "group flex min-w-[64px] flex-col items-center gap-1 rounded-xl border px-2.5 py-2 transition-all",
                interactive
                  ? "hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  : "cursor-default opacity-70"
              )}
              style={{ backgroundColor: palette.background, borderColor: palette.border }}
              title={
                interactive
                  ? `Ver las ${formatCount(tally.count)} personas que respondieron ${tally.shortLabel}`
                  : tally.label
              }
            >
              <span
                className="text-[11px] font-bold leading-none"
                style={{ color: palette.foreground }}
              >
                {tally.shortLabel}
              </span>
              <span
                className="text-[14px] font-extrabold leading-none tabular-nums"
                style={{ color: palette.foreground }}
              >
                {formatCount(tally.count)}
              </span>
              <span className="text-[10px] font-medium leading-none text-muted-foreground tabular-nums">
                {formatShare(tally.percentage)}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.ul
      className="flex flex-col"
      initial="hidden"
      animate="show"
      variants={cascadeContainer}
    >
      {breakdown.tallies.map((tally) => {
        const palette = tallyPalette(tally, accent);
        const interactive = onDrillDown !== undefined && tally.count > 0;
        const width = `${Math.max(2, (tally.count / max) * 100)}%`;
        // A step of the scale earns its band's colour; a plain choice option
        // has no band, and colouring it would invent a verdict the survey
        // never asked for.
        const scaled = tally.bandIndex !== null || tally.isNsNr;

        return (
          <motion.li
            key={tally.id}
            variants={cascadeItem}
            className="group grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40"
          >
            {/* The step number is already the first thing the option says
                ("3 · Ni de acuerdo ni en desacuerdo"), so it is not repeated
                as a badge. The colour lives on the bar and the count. */}
            <span className="col-start-1 min-w-0 truncate text-[13px] font-semibold text-text-primary">
              {tally.label}
            </span>

            {/* Count and share in plain text: the bar underneath already carries
                the option's colour, and repeating it on the number turned the
                list into five competing accents with nothing to anchor them. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="col-start-2 flex shrink-0 cursor-default items-baseline justify-end gap-2 pl-2">
                  <span className="text-[14px] font-extrabold leading-none tabular-nums text-text-primary">
                    {formatCount(tally.count)}
                  </span>
                  <span className="w-[52px] text-right text-[12px] font-semibold leading-none tabular-nums text-muted-foreground">
                    {formatShare(tally.percentage)}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="z-[100] px-2.5 py-1 text-[11px] font-medium">
                {tally.label} · {formatCount(tally.count)} personas ({formatShare(tally.percentage)})
              </TooltipContent>
            </Tooltip>

            {/* The way into the people behind the number: always on show, so a
                reader can see the rows are a door without having to sweep the
                list to find out. Icon only — the tooltip says the rest. */}
            {onDrillDown !== undefined && (
              <span className="col-start-3 row-span-2 row-start-1 flex w-8 justify-end">
                {interactive && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onDrillDown(tally.id)}
                        aria-label={`Ver las ${formatCount(tally.count)} personas que respondieron ${tally.label}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground shadow-card transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="z-[100] px-2.5 py-1 text-[11px] font-medium"
                    >
                      Ver las {formatCount(tally.count)} personas que respondieron esta opción
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            )}

            {/* The bar sits under the label, spanning the same two columns, so
                the numbers keep a clean right edge to line up on.

                A step of the scale is filled with its heatmap pastel, so the
                same "4" reads as the same colour in both views — and at 12px
                the fill alone carries it, without the cell's border. A solid
                fill at this size was loud enough to outshout the numbers beside
                it. An option with no band keeps the flat accent: there is no
                pastel to borrow. */}
            <span className="col-start-1 col-end-3 h-3 overflow-hidden rounded-full bg-muted/40">
              <span
                className="block h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width,
                  backgroundColor: scaled ? palette.background : palette.color,
                }}
              />
            </span>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
