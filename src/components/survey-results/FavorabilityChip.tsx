import { motion } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  FAVORABILITY_FLOOR,
  FAVORABILITY_TARGET,
  NEGATIVE_BG,
  NEGATIVE_TEXT,
  POSITIVE_BG,
  POSITIVE_TEXT,
  YELLOW_BG,
  YELLOW_TEXT,
  formatPercent,
} from "./favorabilityScale";

/**
 * A favorability percentage, coloured by the verdict it falls under.
 *
 * The same mark the Favorabilidad tab puts beside every section and question,
 * so the number means the same thing — and looks the same — wherever the report
 * shows it.
 */
export function FavorabilityChip({
  value,
  labeled,
  dimmed,
  className,
}: {
  value: number;
  labeled?: boolean;
  dimmed?: boolean;
  className?: string;
}) {
  const isPositive = value >= FAVORABILITY_TARGET;
  const isWarning = value >= FAVORABILITY_FLOOR && value < FAVORABILITY_TARGET;

  return (
    <motion.span 
      layout="position"
      className={cn("flex items-center gap-1.5", dimmed && "opacity-45 grayscale", className)}
    >
      {labeled && (
        <span className="text-[11px] font-semibold text-muted-foreground">Favorabilidad:</span>
      )}
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
        style={{
          backgroundColor: isPositive ? POSITIVE_BG : isWarning ? YELLOW_BG : NEGATIVE_BG,
          color: isPositive ? POSITIVE_TEXT : isWarning ? YELLOW_TEXT : NEGATIVE_TEXT,
        }}
      >
        {formatPercent(value)}
      </motion.span>
    </motion.span>
  );
}

/**
 * A question or section with nothing on the 1–5 scale. Showing it at 0% would
 * read as the worst result in the survey instead of as no result.
 */
export function NoScaleBadge({ label = "Sin escala" }: { label?: string }) {
  return (
    <motion.div layout="position">
      <Badge variant="neutral" className="gap-1.5 whitespace-nowrap rounded-full">
        <MessageSquareText className="h-3 w-3" strokeWidth={2} />
        {label}
      </Badge>
    </motion.div>
  );
}
