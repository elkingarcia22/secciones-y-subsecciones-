import { participantCount } from "./participants";
import type { SurveyDraft } from "./surveyBuilderTypes";

/**
 * Survey builder stepper — the left panel as a sequence of steps.
 *
 * Steps fall into two groups that behave differently on purpose:
 *
 *   obligatorio  a numbered path walked in order. Each step unlocks once every
 *                previous one is complete, so the number means something.
 *   opcional     the welcome and closing pages. Always reachable — locking
 *                something optional behind progress would contradict calling
 *                it optional — and never numbered, so they stay out of the
 *                count the author is working through.
 *
 * Whether an optional page is switched on lives in its own editor, not here:
 * the menu answers "where am I", not "is this on".
 */

export type StepperStepId =
  | "general"
  | "demographics"
  | "sections"
  | "participants"
  | "pages";

/**
 * The numbered path. Order is the gate: index N needs 0…N-1 complete.
 *
 * Participants comes early because it is a decision about scope, not content:
 * who the survey is for shapes what is worth asking, so it belongs before the
 * questions rather than as an afterthought once they are written.
 */
export const REQUIRED_STEPS: readonly StepperStepId[] = [
  "general",
  "participants",
  "demographics",
  "sections",
];

/** Always reachable, never numbered. */
export const OPTIONAL_STEPS: readonly StepperStepId[] = ["pages"];

/** Every step, in menu order — required first, then optional. */
export const STEPPER_ORDER: readonly StepperStepId[] = [
  ...REQUIRED_STEPS,
  ...OPTIONAL_STEPS,
];

export const isOptionalStep = (step: StepperStepId): boolean =>
  OPTIONAL_STEPS.includes(step);

/**
 * 1-based position in the entire stepper sequence. All steps now have numbers
 * for visual consistency, including optional ones.
 */
export function stepNumber(step: StepperStepId): number | null {
  const index = STEPPER_ORDER.indexOf(step);
  return index === -1 ? null : index + 1;
}

export interface StepperStatusInput {
  draft: SurveyDraft;
  /** Step ids the author has already visited. */
  visitedSteps: ReadonlySet<StepperStepId>;
  /** At least one section with at least one question, across the whole tree. */
  hasSectionWithQuestion: boolean;
  /** Every section has at least one question (no empty sections). */
  allSectionsHaveQuestions: boolean;
  /** Every question across the whole tree has its required fields filled in. */
  allQuestionsComplete: boolean;
}

export type StepState = "complete" | "active" | "locked" | "available";

/**
 * Whether a step is done.
 *
 * Steps with content of their own are judged on that content. Steps configured
 * elsewhere in the wizard count as done the first time they are opened — the
 * author has seen them, which is all this panel can honestly assert.
 */
export function isStepComplete(
  step: StepperStepId,
  { draft, visitedSteps, hasSectionWithQuestion, allSectionsHaveQuestions, allQuestionsComplete }: StepperStatusInput
): boolean {
  switch (step) {
    case "general":
      return (
        draft.name.trim() !== "" &&
        draft.startDate !== "" &&
        draft.endDate !== "" &&
        draft.kind !== null
      );
    // Demographics arrives prefilled, so being opened is what makes it a
    // decision rather than a default nobody looked at. Switching the block off
    // is a valid answer; leaving it on with nothing in it is not — that is a
    // survey whose results can't be segmented, which nobody asked for.
    case "demographics":
      return (
        visitedSteps.has("demographics") &&
        (!draft.demographics.enabled || draft.demographics.fields.length > 0)
      );
    case "sections":
      return hasSectionWithQuestion && allSectionsHaveQuestions && allQuestionsComplete;
    // Participants has content of its own now, so it is judged on that content
    // rather than on having been opened: a survey with nobody to answer it
    // isn't a step anyone finished.
    case "participants":
      return participantCount(draft.participants) > 0;
    // Optional pages carry content of their own, so they are judged on that
    // content while switched on — an enabled page with nothing on it isn't a
    // page anyone finished. Switched off, they are vacuously done.
    case "pages":
      return true;
  }
}

/**
 * Whether a step is reachable. Optional steps require the whole required path
 * to be complete before they open: the welcome and closing pages cap the
 * wizard, so an author shouldn't land on them while a required step is still
 * unfinished — a welcome page written before any questions exist would greet a
 * survey that can't be taken. Within the required path, a step needs every
 * earlier required step complete; optional ones never stand in the path.
 */
export function isStepReachable(
  step: StepperStepId,
  input: StepperStatusInput
): boolean {
  if (isOptionalStep(step)) {
    return REQUIRED_STEPS.every((required) => isStepComplete(required, input));
  }

  const index = REQUIRED_STEPS.indexOf(step);
  return REQUIRED_STEPS.slice(0, index).every((previous) =>
    isStepComplete(previous, input)
  );
}

/** Visual state for a single step. */
export function getStepState(
  step: StepperStepId,
  input: StepperStatusInput,
  activeStep: StepperStepId
): StepState {
  if (step === activeStep) return "active";
  if (!isStepReachable(step, input)) return "locked";
  if (isStepComplete(step, input)) return "complete";
  // Unvisited optional steps show as locked visually for consistent appearance
  // even though they remain always reachable functionally
  if (isOptionalStep(step) && !input.visitedSteps.has(step)) return "locked";
  return "available";
}

/** Resolves which step the current selection points at. */
export function stepFromSelection(selection: {
  kind: string;
  id: string;
}): StepperStepId {
  return selection.kind === "section" ? "sections" : (selection.id as StepperStepId);
}
