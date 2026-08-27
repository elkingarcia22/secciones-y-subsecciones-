import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sentimentTotals, type OpenComment, type Sentiment } from "@/mocks/questionResponses";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "./sentimentScale";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(Math.round(value));

/**
 * The sentiment breakdown, stated the way Favorabilidad states favorability.
 *
 * Same problem, so the same answer: a lone total says nothing about what it is
 * made of, and drawing a bar for it on every header turns an outline into a
 * chart nobody reads. So the three shares are dots with percentages, hidden
 * behind a "Detalles" toggle on a section header and lined up under their own
 * column headings on a question row — with the actual number of comments one
 * hover away, exactly as `FavorabilityBreakdown` does it.
 */

export interface SentimentGroups extends Record<Sentiment, number> {
  /** Every comment counted, the base each share is over. */
  total: number;
}

export function sentimentGroups(
  comments: readonly OpenComment[],
  overrides: ReadonlyMap<string, Sentiment>
): SentimentGroups {
  const totals = sentimentTotals(comments, overrides);
  return { ...totals, total: comments.length };
}

interface GroupMeta {
  key: Sentiment;
  label: string;
  short: string;
  color: string;
}

/** Column order matches the scale legend: the good news reads first. */
export const SENTIMENT_GROUPS: readonly GroupMeta[] = SENTIMENT_ORDER.map((id) => ({
  key: id,
  label: SENTIMENT_STYLES[id].label,
  short: SENTIMENT_STYLES[id].label,
  color: SENTIMENT_STYLES[id].color,
}));

const share = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/**
 * The three shares as dots with percentages.
 *
 * `compact` drops the fixed column width — right for a header row, where the
 * dots sit beside a count chip; the wide form lines up under the table's own
 * column headings.
 */
export function SentimentBreakdownDots({
  groups,
  compact,
  className,
}: {
  groups: SentimentGroups;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center", compact ? "gap-2" : "gap-4", className)}>
      {SENTIMENT_GROUPS.map((group) => (
        <Tooltip key={group.key}>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex shrink-0 cursor-default items-center py-[3px] text-[12px] font-medium tabular-nums text-text-primary",
                compact ? "gap-1.5" : "w-[76px] justify-end gap-2"
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
            {group.label} · {formatCount(groups[group.key])} comentarios
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/** The column headings the wide dots line up under. */
export function SentimentBreakdownHeaders({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {SENTIMENT_GROUPS.map((group) => (
        <span
          key={group.key}
          className="w-[76px] text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
        >
          {group.short}
        </span>
      ))}
    </div>
  );
}

/**
 * A section's comment total with its breakdown beside it, revealed by the same
 * hover-in "Detalles" toggle the Favorabilidad and eNPS headers carry.
 */
export function SentimentWithBreakdown({
  groups,
  expandable = true,
  compact = true,
  className,
  children,
}: {
  groups: SentimentGroups;
  expandable?: boolean;
  compact?: boolean;
  className?: string;
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
            "mr-3 flex h-6 items-center rounded-md border border-border/60 bg-secondary/50 px-2.5 text-[10px] font-medium text-secondary-foreground transition-all hover:bg-secondary",
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
        <SentimentBreakdownDots groups={groups} compact={compact} />
      </div>

      {children}
    </div>
  );
}
