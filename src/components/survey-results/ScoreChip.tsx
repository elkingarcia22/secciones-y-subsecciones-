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
      <Badge
        variant="neutral"
        className={cn("gap-1 tabular-nums", className)}
        title="Grupo por debajo del mínimo de respuestas"
      >
        <Lock className="h-3 w-3" strokeWidth={2.4} />
        Reservado
      </Badge>
    );
  }

  const band = bandForScore(score);

  return (
    <div 
      className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums border", className)}
      style={{
        backgroundColor: band.background,
        color: band.foreground,
        borderColor: band.color ?? band.border
      }}
    >
      {formatScore(score)}
    </div>
  );
}
