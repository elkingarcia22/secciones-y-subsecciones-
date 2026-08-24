import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Distribution } from "@/mocks/surveyResults";
import { NEGATIVE, NSNR, POSITIVE, YELLOW } from "./favorabilityScale";

function formatCount(n: number) {
  return new Intl.NumberFormat("es-CO").format(Math.round(n));
}

/**
 * The favorability breakdown, as eNPS states it.
 *
 * eNPS never shows a bare score: beside it sit the three shares it was built
 * from, and on a section header they hide behind a "Detalles" toggle so a
 * closed outline stays scannable. Favorabilidad has the same problem — a lone
 * 68% says nothing about whether the other 32% is neutral or angry — so it
 * reads the same way here, with the five boxes folded into the four groups the
 * tab's own KPI cards already name.
 */

export interface FavorabilityGroups {
  favorable: number;
  neutral: number;
  unfavorable: number;
  nsnr: number;
  /** Everyone who answered, NS/NR included: the base every share is over. */
  total: number;
}

/** Boxes 4–5 favourable, 3 neutral, 1–2 unfavourable, plus the opt-outs. */
export function favorabilityGroups(
  distribution: Distribution | null,
  nsnr = 0
): FavorabilityGroups {
  const boxes = distribution ?? [0, 0, 0, 0, 0];
  const unfavorable = boxes[0] + boxes[1];
  const neutral = boxes[2];
  const favorable = boxes[3] + boxes[4];
  return {
    favorable,
    neutral,
    unfavorable,
    nsnr,
    total: unfavorable + neutral + favorable + nsnr,
  };
}

interface GroupMeta {
  key: keyof Omit<FavorabilityGroups, "total">;
  label: string;
  short: string;
  color: string;
}

/** Column order, worst-to-best reversed: the good news reads first, as in eNPS. */
export const FAVORABILITY_GROUPS: readonly GroupMeta[] = [
  { key: "favorable", label: "Favorables", short: "Favorables", color: POSITIVE },
  { key: "neutral", label: "Neutrales", short: "Neutrales", color: YELLOW },
  { key: "unfavorable", label: "Desfavorables", short: "Desfav.", color: NEGATIVE },
  { key: "nsnr", label: "No sabe / No responde", short: "NS/NR", color: NSNR },
];

const share = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/**
 * The four shares as dots with percentages.
 *
 * `compact` drops the fixed column width — right for a header row, where the
 * dots sit beside a chip; the wide form lines up under the table's own column
 * headings.
 */
export function FavorabilityBreakdownDots({
  groups,
  compact,
  className,
  activeGroups,
}: {
  groups: FavorabilityGroups;
  compact?: boolean;
  className?: string;
  /** Group keys still lit by "Resaltar". Omitted means every group is lit. */
  activeGroups?: ReadonlySet<string>;
}) {
  return (
    <div className={cn("flex items-center", compact ? "gap-2" : "gap-4", className)}>
      {FAVORABILITY_GROUPS.map((group) => (
        <Tooltip key={group.key}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex shrink-0 cursor-default items-center py-[3px] text-[11.5px] font-medium tabular-nums text-text-primary transition-opacity",
                compact ? "gap-1.5" : "w-[84px] justify-end gap-2",
                activeGroups && !activeGroups.has(group.key) && "opacity-35 grayscale"
              )}
            >
              <div
                className={cn("shrink-0 rounded-full", compact ? "h-1.5 w-1.5" : "h-2 w-2")}
                style={{ backgroundColor: group.color }}
              />
              <span>{share(groups[group.key], groups.total)}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="z-[100] px-2.5 py-1 text-[11px] font-medium">
            {group.label} · {formatCount(groups[group.key])} respuestas
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/** The column headings the wide dots line up under. */
export function FavorabilityBreakdownHeaders({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {FAVORABILITY_GROUPS.map((group) => (
        <span
          key={group.key}
          className="w-[84px] text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          {group.short}
        </span>
      ))}
    </div>
  );
}

/**
 * A favorability value with its breakdown beside it, revealed by a "Detalles"
 * toggle that only appears on hover — the same control eNPS puts on its section
 * headers. `children` is whatever states the value: a chip, a chip with its
 * distribution tooltip, a dash for a hidden level.
 */
export function FavorabilityWithBreakdown({
  groups,
  expandable = true,
  compact = true,
  className,
  activeGroups,
  children,
}: {
  groups: FavorabilityGroups;
  expandable?: boolean;
  compact?: boolean;
  className?: string;
  activeGroups?: ReadonlySet<string>;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className={cn("group/score flex shrink-0 items-center pt-1", className)}>
      {expandable && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((current) => !current);
          }}
          aria-expanded={expanded}
          className={cn(
            "mr-3 flex h-6 items-center rounded-md border border-border/50 bg-secondary/50 px-2.5 text-[10px] font-medium text-secondary-foreground transition-all hover:bg-secondary",
            expanded
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100 group-hover/score:opacity-100"
          )}
        >
          {expanded ? "Ocultar" : "Detalles"}
        </button>
      )}

      <div
        className={cn(
          "flex items-center transition-all duration-300 ease-in-out",
          compact ? "mr-4" : "mr-8",
          expandable && !expanded ? "w-0 overflow-hidden opacity-0" : "opacity-100"
        )}
      >
        <FavorabilityBreakdownDots groups={groups} compact={compact} activeGroups={activeGroups} />
      </div>

      {children}
    </div>
  );
}
