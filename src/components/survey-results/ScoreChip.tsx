import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { bandForScore, formatScore } from "./favorabilityScale";

interface ScoreChipProps {
  /** Null renders the masked state instead of a value. */
  score: number | null;
  className?: string;
}

/**
 * A 1–5 average as a `Badge`, in the variant of its band.
 *
 * `null` is a first-class state, not a zero: a group below the anonymity
 * threshold has a score the product deliberately refuses to show, and rendering
 * it as "0" reads as the worst possible result instead of as no result. The lock
 * says which one it is.
 */
export function ScoreChip({ score, className }: ScoreChipProps) {
  if (score === null) {
    return (
      <motion.div layout="position">
        <Badge
          variant="neutral"
          className={cn("gap-1 tabular-nums rounded-full", className)}
          title="Grupo por debajo del mínimo de respuestas"
        >
          <Lock className="h-3 w-3" strokeWidth={2} />
          Reservado
        </Badge>
      </motion.div>
    );
  }

  const band = bandForScore(score);

  return (
    <motion.div 
      layout="position"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums", className)}
      style={{
        backgroundColor: band.background,
        color: band.foreground,
      }}
    >
      {formatScore(score)}
    </motion.div>
  );
}
