import { Frown, Meh, Smile, Star, Angry, Laugh } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  EMOJI_STEPS,
  LINEAR_STEPS,
  NPS_MAX,
  NPS_MIN,
  STAR_STEPS,
  likertSteps,
} from "./questionCatalog";
import type { SurveyQuestion } from "./surveyBuilderTypes";

/**
 * Read-only sketch of what the respondent will see. It is a preview, not an
 * input: nothing here is clickable, so the author never wonders whether they
 * just answered their own survey.
 */

const EMOJI_FACES = [Angry, Frown, Meh, Smile, Laugh];

interface ScalePreviewProps {
  question: SurveyQuestion;
}

export function ScalePreview({ question }: ScalePreviewProps) {
  const { kind } = question.scale;

  if (kind === "likert" || kind === "likert-nom035") {
    return (
      <PreviewFrame>
        <ul className="flex flex-wrap gap-1.5">
          {likertSteps(question).map((step) => (
            <li
              key={step}
              className="rounded-md border border-border/70 px-2.5 py-1 text-[12px] font-medium text-text-secondary"
            >
              {step}
            </li>
          ))}
          {question.scale.allowDontKnow && (
            <li className="rounded-md border border-dashed border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground">
              No sabe / no responde
            </li>
          )}
        </ul>
      </PreviewFrame>
    );
  }

  if (kind === "nps") {
    return (
      <PreviewFrame>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: NPS_MAX - NPS_MIN + 1 }, (_, index) => (
            <span
              key={index}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/70 text-[12px] font-semibold tabular-nums text-text-secondary"
            >
              {NPS_MIN + index}
            </span>
          ))}
        </div>
      </PreviewFrame>
    );
  }

  if (kind === "stars") {
    return (
      <PreviewFrame>
        <div className="flex items-center gap-3">
          {Array.from({ length: STAR_STEPS }, (_, index) => (
            <Star key={index} className="h-6 w-6 text-muted-foreground/40" strokeWidth={2} />
          ))}
        </div>
      </PreviewFrame>
    );
  }

  if (kind === "emoji") {
    return (
      <PreviewFrame>
        <div className="flex items-center gap-4">
          {Array.from({ length: EMOJI_STEPS }, (_, index) => {
            const Face = EMOJI_FACES[index] ?? Meh;
            return <Face key={index} className="h-7 w-7 text-muted-foreground/40" strokeWidth={2} />;
          })}
        </div>
      </PreviewFrame>
    );
  }

  if (kind === "linear") {
    return (
      <PreviewFrame>
        <div className="flex items-start gap-6">
          {Array.from({ length: LINEAR_STEPS }, (_, index) => (
            <div key={index} className="flex flex-col items-center gap-1.5">
              <span className="h-4 w-4 rounded-full border border-border" />
              <span className="text-[11px] font-semibold tabular-nums text-text-secondary">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </PreviewFrame>
    );
  }

  return null;
}

function PreviewFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-md border border-dashed border-border/70 px-3.5 py-3", className)}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Vista del participante
      </p>
      {children}
    </div>
  );
}
