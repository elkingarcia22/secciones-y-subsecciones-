import { PencilLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Sentiment } from "@/mocks/questionResponses";
import type { SentimentGroups } from "./SentimentBreakdown";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "./sentimentScale";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

const share = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

/** The share as a label. Anything that exists reads as at least 1%: a single
 * correction out of a thousand comments is not "0%" of the reader's work. */
const shareLabel = (value: number, total: number) => {
  const rounded = share(value, total);
  return `${rounded === 0 && value > 0 ? 1 : rounded}%`;
};

const answersLabel = (value: number) =>
  `${formatCount(value)} ${value === 1 ? "respuesta" : "respuestas"}`;

/**
 * How the comments were read, as one line above the outline.
 *
 * The tree states every branch's split and the KPI row states the average, but
 * between them nothing said the whole measurement's distribution — *what share
 * of everything written is positive, and how many answers is that*. A card row
 * for it would cost a screenful before the first comment, so it is a single
 * strip the height of a control, and each group is stated the way the table
 * states a column: the share first, the answers behind it.
 *
 * It is a reading, not a control: the numbers are of the comments in scope, so
 * the strip stays a fixed reference while the toolbar's filters move the list
 * under it.
 */
export function CommentsSummaryBar({
  groups,
  corrected,
}: {
  groups: SentimentGroups;
  /** Comments whose reading the reader has re-labelled. */
  corrected: number;
}) {
  if (groups.total === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-border/50 bg-muted/20 px-3 py-1.5">
      <span className="mr-1 text-[12px] font-semibold leading-none text-text-secondary">
        Distribución de sentimiento
      </span>

      {/* Every number on the right edge, the way each row of the tree carries
          its total: the label opens the line, the figures line up under the
          controls above them. */}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-1.5">
        {SENTIMENT_ORDER.map((id) => (
          <SentimentStat key={id} id={id} count={groups[id]} total={groups.total} />
        ))}

        {/* Corrections are about the reader's own work, not about the
            measurement, so they close the line behind a divider — stated in the
            same shape so the row reads as one scale. */}
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border/70" />

        <CorrectedStat count={corrected} total={groups.total} />
      </div>
    </div>
  );
}

/** One group: share, then the answers behind it. */
function SentimentStat({
  id,
  count,
  total,
}: {
  id: Sentiment;
  count: number;
  total: number;
}) {
  const style = SENTIMENT_STYLES[id];

  return (
    <span className="flex items-center gap-1.5 px-2 py-1 leading-none">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: style.color }} />
      <span className="text-[11.5px] font-medium text-text-secondary">{style.label}</span>
      <span className="text-[13px] font-bold tabular-nums text-text-primary">
        {shareLabel(count, total)}
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {answersLabel(count)}
      </span>
    </span>
  );
}

/** The corrections, in the same shape as the three readings. */
function CorrectedStat({ count, total }: { count: number; total: number }) {
  const empty = count === 0;

  return (
    <span
      className="flex items-center gap-1.5 px-2 py-1 leading-none"
      title={
        empty
          ? "Todavía no corregiste ningún sentimiento"
          : `${formatCount(count)} de ${formatCount(total)} con el sentimiento corregido a mano`
      }
    >
      <PencilLine
        className={cn("h-3 w-3 shrink-0", empty ? "text-muted-foreground/50" : "text-primary/70")}
        strokeWidth={2.4}
      />
      <span
        className={cn(
          "text-[11.5px] font-medium",
          empty ? "text-muted-foreground/70" : "text-text-secondary"
        )}
      >
        Corregidos
      </span>
      <span
        className={cn(
          "text-[13px] font-bold tabular-nums",
          empty ? "text-muted-foreground/70" : "text-text-primary"
        )}
      >
        {shareLabel(count, total)}
      </span>
      <span
        className={cn(
          "text-[11px] tabular-nums",
          empty ? "text-muted-foreground/70" : "text-muted-foreground"
        )}
      >
        {answersLabel(count)}
      </span>
    </span>
  );
}
