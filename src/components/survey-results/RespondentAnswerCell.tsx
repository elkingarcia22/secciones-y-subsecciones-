import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { QuestionBreakdown, RespondentAnswer, Sentiment } from "@/mocks/questionResponses";
import { FAVORABILITY_BANDS, NSNR_BG, NSNR_BORDER, NSNR_TEXT } from "./favorabilityScale";
import { SENTIMENT_STYLES } from "./sentimentScale";

/**
 * One person's answer to one question, printed the way they gave it.
 *
 * A scale answer stays a scale: the five steps are all drawn, with the one they
 * picked filled in its band colour. Reducing it to the bare number "4" would
 * lose what the reader needs — that a 4 is the second-best of five, and which
 * wording sat under it.
 */
export function RespondentAnswerCell({
  answer,
  breakdown,
  sentiment,
}: {
  answer: RespondentAnswer | undefined;
  breakdown: QuestionBreakdown | undefined;
  /** Sentiment of a written answer, corrections included. */
  sentiment?: Sentiment;
}) {
  if (!answer || answer.skipped) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/70">
        <Minus className="h-3 w-3" strokeWidth={2} />
        Sin responder
      </span>
    );
  }

  if (answer.nsnr) {
    return (
      <span
        className="inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-semibold"
        style={{ backgroundColor: NSNR_BG, borderColor: NSNR_BORDER, color: NSNR_TEXT }}
      >
        No sabe / No responde
      </span>
    );
  }

  if (answer.type === "open") {
    const style = sentiment ? SENTIMENT_STYLES[sentiment] : null;
    return (
      <div className="flex min-w-0 flex-col gap-2.5">
        <div className="rounded-md bg-muted/40 px-3.5 py-2.5 text-[13px] leading-relaxed text-text-primary">
          {answer.display}
        </div>
        {style && (
          <div className="flex justify-end">
            <span
              className="inline-flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-bold shadow-card"
              style={{
                backgroundColor: style.background,
                borderColor: style.border,
                color: style.foreground,
              }}
            >
              <style.icon className="h-3 w-3" strokeWidth={2.5} />
              {style.label}
            </span>
          </div>
        )}
      </div>
    );
  }

  // A scale on the 1–5 favorability band: draw all five, fill the chosen one.
  if (answer.bandIndex !== null) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-1">
          {FAVORABILITY_BANDS.map((band, index) => {
            const picked = index === answer.bandIndex;
            return (
              <span
                key={band.id}
                aria-hidden
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md border text-[11px] font-bold tabular-nums transition-all",
                  picked ? "scale-110 shadow-card" : "opacity-40"
                )}
                style={{
                  backgroundColor: picked ? band.background : "transparent",
                  borderColor: picked ? band.border : "hsl(var(--border))",
                  color: picked ? band.foreground : "hsl(var(--muted-foreground))",
                }}
              >
                {picked ? <Check className="h-3 w-3" strokeWidth={2.5} /> : index + 1}
              </span>
            );
          })}
        </div>
        <span className="text-right text-[11px] font-semibold text-text-secondary">
          {answer.display}
        </span>
      </div>
    );
  }

  // NPS and other off-scale numeric answers: the number, plainly.
  if (breakdown?.scaleKind === "nps" && answer.value !== null) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-[11px] font-semibold text-muted-foreground">Recomendaría</span>
        <span className="flex h-7 min-w-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 px-1.5 text-[13px] font-extrabold tabular-nums text-primary">
          {answer.value}
        </span>
      </span>
    );
  }

  // Choice questions: one chip per option they ticked.
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {answer.selected.map((label) => (
        <Badge key={label} variant="neutral" className="max-w-[220px] truncate text-[11px]">
          {label}
        </Badge>
      ))}
    </div>
  );
}
