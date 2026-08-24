import { ArrowRight, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface BuilderFooterProps {
  /** 1-based position in the required path, or null on an optional step. */
  stepNumber: number | null;
  totalRequiredSteps: number;
  /** Whether there is a next step to move to at all — not whether it is
   * unlocked yet. Clicking a locked one still surfaces the usual gate toast. */
  canContinue: boolean;
  /** The advance button's label — "Finalizar" on the closing step. */
  continueLabel?: string;
  /** Explains why the advance button is disabled, when it is disabled. */
  continueDisabledReason?: string;
  onSave: () => void;
  onContinue: () => void;
}

/**
 * Wizard actions: what happens next with the step the author is on. Saving and
 * advancing are both "leave this step" actions, so they belong together at the
 * point the author is actually done with it.
 *
 * Leaving the builder is not here — that is the shell breadcrumb's job, since
 * it is navigation out of the screen rather than an action on this step.
 */
export function BuilderFooter({
  stepNumber,
  totalRequiredSteps,
  canContinue,
  continueLabel = "Continuar",
  continueDisabledReason,
  onSave,
  onContinue,
}: BuilderFooterProps) {
  return (
    <footer className="mx-3 mb-3 flex h-16 shrink-0 items-center justify-end gap-4 rounded-2xl border border-border/50 bg-surface px-6 shadow-sm">

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          className="h-9 gap-2 rounded-xl border-border/60 px-4 text-[13px] font-semibold text-text-primary hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <Save className="h-4 w-4" strokeWidth={2.2} />
          Guardar encuesta
        </Button>

        <ContinueButton
          canContinue={canContinue}
          onContinue={onContinue}
          label={continueLabel}
          disabledReason={continueDisabledReason}
        />
      </div>
    </footer>
  );
}

/**
 * The advance button. On the last step there is nowhere to continue to, so the
 * button disables — but a disabled button swallows pointer events, which would
 * take a Tooltip wrapped around it down too. Only reach for the wrapper when
 * it is needed.
 */
function ContinueButton({
  canContinue,
  onContinue,
  label,
  disabledReason,
}: {
  canContinue: boolean;
  onContinue: () => void;
  label: string;
  disabledReason?: string;
}) {
  const isFinal = label === "Finalizar";
  const button = (
    <Button
      size="sm"
      onClick={onContinue}
      disabled={!canContinue}
      className="h-9 gap-2 rounded-xl px-4 text-[13px]"
    >
      {label}
      {isFinal ? (
        <Check className="h-4 w-4" strokeWidth={2.4} />
      ) : (
        <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
      )}
    </Button>
  );

  if (canContinue) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{button}</span>
      </TooltipTrigger>
      <TooltipContent side="top">
        {disabledReason ?? "Ya estás en el último paso"}
      </TooltipContent>
    </Tooltip>
  );
}
