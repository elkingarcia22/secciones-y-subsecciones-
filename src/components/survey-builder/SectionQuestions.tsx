import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ANCHOR_ATTRIBUTE } from "@/hooks/useAnchorOffset";
import { useDragReorder } from "@/hooks/useDragReorder";
import { QuestionCard } from "./QuestionCard";
import { QuestionEditor } from "./QuestionEditor";
import { moveDestinationsForQuestion } from "./sectionTree";
import type { SurveyQuestion, SurveySection } from "./surveyBuilderTypes";

export interface QuestionListHandlers {
  /** The single question currently open in edit mode, anywhere in the survey. */
  editingQuestionId: string | null;
  /** True once the author has tried to leave the sections step with an
   * incomplete question still open — flips on its missing-field highlighting
   * rather than showing errors on a form nobody has tried to submit yet. */
  showQuestionValidation: boolean;
  onOpenQuestion: (questionId: string) => void;
  /** Every edit lands straight in the survey — there is no draft to save. */
  onQuestionChange: (sectionId: string, question: SurveyQuestion) => void;
  onCloseQuestion: () => void;
  onAddQuestion: (sectionId: string) => void;
  onDuplicateQuestion: (questionId: string) => void;
  onRemoveQuestion: (questionId: string) => void;
  onReorderQuestions: (fromId: string, toId: string) => void;
  /** Whole tree, so a question can compute everywhere it may be moved to. */
  sections: readonly SurveySection[];
  /** Moves a question into a different section's question list. */
  onMoveQuestion: (questionId: string, targetSectionId: string) => void;
}

interface SectionQuestionsProps extends QuestionListHandlers {
  readOnly?: boolean;
  sectionId: string;
  questions: readonly SurveyQuestion[];
}

/**
 * A section's own questions, grouped into a single bordered list with dividers
 * instead of one card per question: the whole block reads as "las preguntas de
 * esta subsección", so it never competes with the nested subsection shells.
 *
 * The question being edited leaves the list and renders as a full form in its
 * place, so only one editor is ever open across the whole survey.
 *
 * Owns its drag context so reordering never crosses from one subsection's list
 * into another's.
 */
export function SectionQuestions({
  readOnly,
  sectionId,
  questions,
  editingQuestionId,
  showQuestionValidation,
  onOpenQuestion,
  onQuestionChange,
  onCloseQuestion,
  onAddQuestion,
  onDuplicateQuestion,
  onRemoveQuestion,
  onReorderQuestions,
  sections,
  onMoveQuestion,
}: SectionQuestionsProps) {
  const { draggingId, overId, getHandleProps, getDropTargetProps } = useDragReorder(onReorderQuestions);

  // Position of the open question in *this* list, or -1 when it lives elsewhere.
  const editingIndex = questions.findIndex((question) => question.id === editingQuestionId);
  const isEditingHere = editingIndex !== -1;

  // Every section this question could move into — same set for all rows here.
  const moveDestinations = moveDestinationsForQuestion(sections, sectionId);

  /**
   * The rows of a slice of the list, keeping the absolute numbering. Splitting
   * the list is what lets the open question step out of it as its own card.
   */
  const renderRows = (slice: readonly SurveyQuestion[], offset: number) => (
    <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/70 bg-surface">
      {slice.map((question, index) => (
        <QuestionCard
          readOnly={readOnly}
          key={question.id}
          question={question}
          index={offset + index}
          isDragging={draggingId === question.id}
          isDropTarget={overId === question.id && draggingId !== question.id}
          onOpen={() => onOpenQuestion(question.id)}
          onRemove={() => onRemoveQuestion(question.id)}
          moveDestinations={moveDestinations}
          onMove={(targetId) => onMoveQuestion(question.id, targetId)}
          handleProps={getHandleProps(question.id)}
          dropTargetProps={getDropTargetProps(question.id)}
        />
      ))}
    </ul>
  );

  const rowsBefore = isEditingHere ? questions.slice(0, editingIndex) : questions;
  const rowsAfter = isEditingHere ? questions.slice(editingIndex + 1) : [];

  return (
    <div className="flex flex-col gap-2">
      {/* rounded-md is 14px here; rounded-xl would be 28px, at which point the
          first and last rows collide with the curve unless the list is padded. */}
      {rowsBefore.length > 0 && renderRows(rowsBefore, 0)}

      {/* The open question leaves the list and becomes its own card: a full
          blue contour and a lift, so it reads as the one thing in focus rather
          than a taller row among dimmed siblings. It edits the survey straight
          on — the stored question *is* what the editor shows. */}
      {isEditingHere && (
        <div
          {...{ [ANCHOR_ATTRIBUTE]: true }}
          className="rounded-xl border border-primary bg-surface p-4 shadow-card ring-2 ring-primary/20 animate-in fade-in zoom-in-[0.99] duration-200"
        >
          <QuestionEditor
            readOnly={readOnly}
            question={questions[editingIndex]}
            index={editingIndex}
            showValidation={showQuestionValidation}
            onChange={(question) => onQuestionChange(sectionId, question)}
            onClose={onCloseQuestion}
            onDuplicate={() => onDuplicateQuestion(questions[editingIndex].id)}
            onRemove={() => onRemoveQuestion(questions[editingIndex].id)}
          />
        </div>
      )}

      {rowsAfter.length > 0 && renderRows(rowsAfter, editingIndex + 1)}

      {!readOnly && (
        <button
          type="button"
          onClick={() => onAddQuestion(sectionId)}
          data-click-outside-ignore
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/70 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground transition-all",
            "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          {questions.length === 0 ? "Añadir la primera pregunta" : "Añadir pregunta"}
        </button>
      )}
    </div>
  );
}
